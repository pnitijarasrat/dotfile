import { test, expect, mock } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { MAX_TEXT, inputOf, keep, wrap } from '../hooks/inspect.ts'
import type { Log } from '../types'

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const LOG = { plugin: 'event-viewer', key: 'log' } as const

// The engine beneath the mod: one session, a mocked clock, and tools that
// answer what `answer` gives for their input.
function engine(on: On, answer: (e: Record<string, unknown>) => unknown) {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 11, 7, 2, 5) })
  let last: Log | undefined
  on('session.id', async () => ({ value: 'one' }) as never)
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  on('tool.call', async ($, e) => answer(e as never) as never)
  return { clock, ids: () => (last?.events ?? []).map(ev => ev.id) }
}

const mount = ($: Engine, bodyColumns = 120) =>
  $.ui.mount({
    plugin: 'event-viewer', surface: 'terminal', component: 'Pane', requestId: 'event-viewer',
    props: { bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 30 } },
  } as never)

type Ui = Awaited<ReturnType<typeof mount>>
const shows = async (ui: Ui, text: RegExp) => (await ui.find({ type: 'Text', text } as never)) !== undefined

test('selecting a row opens its Event Properties with the full input and result, and OK closes it', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ result: 'ok', text: 'line one\nline two' }))
  await $.tool.call({ tool: 'Bash', command: 'npm test --silent', description: 'Run the tests' } as never)
  await clock.settle()
  const [id] = ids()

  const ui = await mount($)
  expect(await shows(ui, /Event Properties/)).toBe(false)
  await ui.press({ key: `ev-${id}` } as never)
  expect(await shows(ui, /Event Properties/)).toBe(true)
  expect(await shows(ui, /^Bash$/)).toBe(true)
  expect(await shows(ui, /Status:\s+Done/)).toBe(true)
  expect(await shows(ui, /Agent:\s+main/)).toBe(true)
  expect(await shows(ui, /command: npm test --silent/)).toBe(true)
  expect(await shows(ui, /description: Run the tests/)).toBe(true)
  expect(await shows(ui, /^ Result$/)).toBe(true)
  expect(await shows(ui, /line one/)).toBe(true)
  expect(await shows(ui, /line two/)).toBe(true)

  await ui.press({ key: 'ok' } as never)
  expect(await shows(ui, /Event Properties/)).toBe(false)
  await ui.unmount()
})

test('selecting the selected row again closes its Properties', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ result: 'ok', text: 'ok' }))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await clock.settle()
  const [id] = ids()
  const ui = await mount($)
  await ui.press({ key: `ev-${id}` } as never)
  expect(await shows(ui, /Event Properties/)).toBe(true)
  await ui.press({ key: `ev-${id}` } as never)
  expect(await shows(ui, /Event Properties/)).toBe(false)
  await ui.unmount()
})

test('a call a hook denied shows its Reason', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ deny: 'force-pushing is not allowed here' }))
  await $.tool.call({ tool: 'Bash', command: 'git push --force' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /Status:\s+Denied/)).toBe(true)
  expect(await shows(ui, /^ Reason$/)).toBe(true)
  expect(await shows(ui, /force-pushing is not allowed here/)).toBe(true)
  await ui.unmount()
})

test("a call a permission rule denied shows the rule's reason", async ($, on) => {
  const clock = mock.clock(on)
  let last: Log | undefined
  on('session.id', async () => ({ value: 'one' }) as never)
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  on('tool.check', async () => ({ decision: 'deny', reason: 'Bash(rm:*) is denied' }) as never)
  on('tool.call', async (_, e) => {
    await $.tool.check({ tool: e.tool, input: { command: 'rm -rf x' }, tool_use_id: e.tool_use_id } as never)
    return { isError: true, result: 'Permission denied', text: 'Permission to use Bash has been denied.' } as never
  })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf x' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${last!.events[0]!.id}` } as never)
  expect(await shows(ui, /^ Reason$/)).toBe(true)
  expect(await shows(ui, /Bash\(rm:\*\) is denied/)).toBe(true)
  await ui.unmount()
})

test('a call that failed shows its Error', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ isError: true, result: 'boom', text: 'Exit code 1\nnpm ERR! missing script: tset' }))
  await $.tool.call({ tool: 'Bash', command: 'npm run tset' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /Status:\s+Error/)).toBe(true)
  expect(await shows(ui, /^ Error$/)).toBe(true)
  expect(await shows(ui, /missing script: tset/)).toBe(true)
  await ui.unmount()
})

test('a call that is still running says it has no result yet', async ($, on) => {
  const clock = mock.clock(on)
  let last: Log | undefined
  on('session.id', async () => ({ value: 'one' }) as never)
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  on('tool.call', async () => {
    await clock.sleep(5000)
    return { result: 'ok', text: 'ok' } as never
  })
  const call = $.tool.call({ tool: 'Bash', command: 'sleep 5' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${last!.events[0]!.id}` } as never)
  expect(await shows(ui, /Status:\s+Running/)).toBe(true)
  expect(await shows(ui, /still running: no result yet/)).toBe(true)
  await ui.unmount()
  await clock.advance(5000)
  await call
})

test('a long result scrolls: its box says which lines show, and ▼ reaches the last', async ($, on) => {
  const text = Array.from({ length: 100 }, (_, i) => `row ${i + 1}`).join('\n')
  const { clock, ids } = engine(on, () => ({ result: text, text }))
  await $.tool.call({ tool: 'Read', file_path: '/repo/long.txt' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /row 1\b/)).toBe(true)
  expect(await shows(ui, /row 100\b/)).toBe(false)
  expect(await shows(ui, /lines 1-\d+ of 100/)).toBe(true)

  await ui.press({ key: 'output-down' } as never)
  expect(await shows(ui, /row 1\b/)).toBe(false)
  for (let i = 0; i < 50; i++) await ui.press({ key: 'output-down' } as never)
  expect(await shows(ui, /row 100\b/)).toBe(true)
  expect(await shows(ui, /lines \d+-100 of 100/)).toBe(true)

  for (let i = 0; i < 50; i++) await ui.press({ key: 'output-up' } as never)
  expect(await shows(ui, /row 1\b/)).toBe(true)
  await ui.unmount()
})

test('↑ and ↓ step to the previous and next event', async ($, on) => {
  const { clock, ids } = engine(on, e => ({ result: 'ok', text: `read ${e.file_path as string}` }))
  for (const f of ['/repo/a', '/repo/b', '/repo/c']) await $.tool.call({ tool: 'Read', file_path: f } as never)
  await clock.settle()
  const [, b] = ids()
  const ui = await mount($)
  await ui.press({ key: `ev-${b}` } as never)
  expect(await shows(ui, /read \/repo\/b/)).toBe(true)
  await ui.press({ key: 'next' } as never)
  expect(await shows(ui, /read \/repo\/c/)).toBe(true)
  // The last event stays put.
  await ui.press({ key: 'next' } as never)
  expect(await shows(ui, /read \/repo\/c/)).toBe(true)
  await ui.press({ key: 'prev' } as never)
  await ui.press({ key: 'prev' } as never)
  expect(await shows(ui, /read \/repo\/a/)).toBe(true)
  await ui.unmount()
})

test('in a window under 100 columns the Properties sit under the log', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ result: 'ok', text: 'all good' }))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await clock.settle()
  const ui = await mount($, 80)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /Event Properties/)).toBe(true)
  expect(await shows(ui, /all good/)).toBe(true)
  await ui.press({ key: 'ok' } as never)
  expect(await shows(ui, /Event Properties/)).toBe(false)
  await ui.unmount()
})

test("a call's input reads as its arguments, one per line, without the envelope", () => {
  expect(inputOf({ tool: 'Edit', tool_use_id: 't1', file_path: '/repo/x', old_string: 'a\nb', replace_all: false })).toBe(
    'file_path: /repo/x\nold_string:\n  a\n  b\nreplace_all: false',
  )
  expect(inputOf({ tool: 'TodoWrite', tool_use_id: 't2', todos: [{ content: 'x' }] })).toBe('todos: [{"content":"x"}]')
})

test('long lines wrap rather than being cut', () => {
  expect(wrap('abcdefghij\n\tk', 4)).toEqual(['abcd', 'efgh', 'ij', '  k'])
  expect(wrap('', 4)).toEqual([''])
})

test('text past what the log keeps says how much was not kept', () => {
  expect(keep('short')).toBe('short')
  const kept = keep('x'.repeat(MAX_TEXT + 1234))
  expect(kept.startsWith('x'.repeat(MAX_TEXT))).toBe(true)
  expect(kept.endsWith('… 1,234 more characters not kept')).toBe(true)
})

test('the person answering No at the prompt shows their refusal as the Reason', async ($, on) => {
  const refused = "The user doesn't want to proceed with this tool use. The tool use was rejected."
  const { clock, ids } = engine(on, () => ({ isError: true, result: refused, text: refused }))
  await $.tool.call({ tool: 'Edit', file_path: '/repo/x', old_string: 'a', new_string: 'b' } as never)
  await clock.settle()
  const ui = await mount($)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /Status:\s+Denied/)).toBe(true)
  expect(await shows(ui, /^ Reason$/)).toBe(true)
  expect(await shows(ui, /doesn't want to proceed/)).toBe(true)
  await ui.unmount()
})

test('stepping to a call older than the log shows keeps it in view', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ result: 'ok', text: 'ok' }))
  for (let i = 0; i < 40; i++) await $.tool.call({ tool: 'Read', file_path: `/repo/${i}` } as never)
  await clock.settle()
  const all = ids()
  const ui = await mount($)
  // The oldest row the log shows, then the one before it.
  const shown = []
  for (const id of all) if (await ui.find({ key: `ev-${id}` } as never)) shown.push(id)
  const top = all.indexOf(shown[0]!)
  expect(top).toBeGreaterThan(0)
  await ui.press({ key: `ev-${all[top]}` } as never)
  await ui.press({ key: 'prev' } as never)
  expect(await ui.find({ key: `ev-${all[top - 1]}` } as never)).toBeDefined()
  await ui.unmount()
})

test('docked beside the log at 100 columns, the log keeps all its columns', async ($, on) => {
  const { clock, ids } = engine(on, () => ({ result: 'ok', text: 'ok' }))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await clock.settle()
  const ui = await mount($, 100)
  await ui.press({ key: `ev-${ids()[0]}` } as never)
  expect(await shows(ui, /Event Properties/)).toBe(true)
  expect(await shows(ui, /^ Dur\.\s*$/)).toBe(true)
  expect(await shows(ui, /^ 0ms\s*$/)).toBe(true)
  await ui.unmount()
})
