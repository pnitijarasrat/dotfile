import { test, expect, mock } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { MAX_EVENTS } from '../hooks/log.ts'
import { costOf, percentOf, summaryOf, tokensOf } from '../hooks/stats.ts'
import type { Log } from '../types'

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const LOG = { plugin: 'event-viewer', key: 'log' } as const
const MODEL = 'claude-opus-5-5'
const START = Date.UTC(2026, 9, 11, 7, 2, 5)

// The engine beneath the mod: a session whose id the test can change, a
// clock that moves only when the test moves it, tools that answer what
// `answer` gives, turns that start and end, and the usage the status line
// would read (none until the test gives one).
function engine(on: On, answer: (tool: string) => unknown = () => ({ result: 'ok', text: 'ok' })) {
  const clock = mock.clock(on, { now: START })
  const at = { session: 'one', usage: undefined as unknown }
  let last: Log | undefined
  on('session.id', async () => ({ value: at.session }) as never)
  on('session.usage', async () => {
    if (at.usage === undefined) throw new Error('no reading yet')
    return { value: at.usage } as never
  })
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  on('tool.call', async ($, e) => answer(e.tool) as never)
  on('turn.start', async (_, e) => ({ turnId: e.turnId }) as never)
  on('turn.complete', async () => ({ text: '' }) as never)
  on('agent.spawn', async () => ({ model: MODEL, agentId: 'a1' }) as never)
  return { clock, at, log: () => last }
}

const mount = ($: Engine, bodyColumns = 104) =>
  $.ui.mount({
    plugin: 'event-viewer', surface: 'terminal', component: 'Pane', requestId: 'event-viewer',
    props: { bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 } },
  } as never)

type Ui = Awaited<ReturnType<typeof mount>>
// A figure as the Summary shows it: its label, then its value right-aligned
// in its column.
const shows = async (ui: Ui, label: string, value: string) =>
  (await ui.find({ type: 'Text', text: new RegExp(`(?:^| )${label}:\\s+${value.replace(/[$.]/g, '\\$&')} `) } as never)) !== undefined

// One model step whose response reports `usage`.
function stepUsage(on: On, usage: Record<string, number>) {
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: { model: MODEL, ...usage } } as never
  })
}

async function drain($: Engine, agentId?: string) {
  const stream = $.turn.step({ turnId: 't1', index: 0, model: MODEL, messageCount: 1, ...(agentId ? { agentId } : {}) } as never)
  for await (const _ of stream) { /* read through */ }
}

test('the Summary counts tool calls by how they settled, and Running from the running rows', async ($, on) => {
  const answers: Record<string, unknown> = {
    Read: { result: 'ok', text: 'ok' },
    Bash: { isError: true, result: 'boom', text: 'Exit code 1' },
    Edit: { deny: 'not here' },
  }
  // Glob takes 5s, so it is still running when the window is drawn.
  const { clock } = engine(on, tool => (tool === 'Glob' ? clock.sleep(5000).then(() => answers.Read) : answers[tool]))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/repo/b' } as never)
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/repo/x' } as never)
  const running = $.tool.call({ tool: 'Glob', pattern: 'x' } as never)
  await clock.settle()

  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: /─ Summary / } as never)).toBeDefined()
  expect(await shows(ui, 'Tool calls', '5')).toBe(true)
  expect(await shows(ui, 'Done', '2')).toBe(true)
  expect(await shows(ui, 'Errors', '1')).toBe(true)
  expect(await shows(ui, 'Denied', '1')).toBe(true)
  expect(await shows(ui, 'Running', '1')).toBe(true)
  await ui.unmount()

  await clock.advance(5000)
  await running
  const after = await mount($)
  expect(await shows(after, 'Done', '3')).toBe(true)
  expect(await shows(after, 'Running', '0')).toBe(true)
  await after.unmount()
})

test('an interrupted call counts as an error', async ($, on) => {
  const { clock, log } = engine(on, () => {
    throw new Error('interrupted')
  })
  await expect($.tool.call({ tool: 'Bash', command: 'sleep 9' } as never)).rejects.toThrow()
  await clock.settle()
  expect(log()?.stats).toMatchObject({ done: 0, error: 1, denied: 0 })
})

// The log is written whole on every change, so 502 calls take a while.
test("the tool-call counters outlast the log's row limit", { timeoutMs: 20_000 }, async ($, on) => {
  const { clock, log } = engine(on)
  for (let i = 0; i < MAX_EVENTS + 2; i++) await $.tool.call({ tool: 'Read', file_path: `/repo/${i}` } as never)
  await clock.settle()
  expect(log()?.events).toHaveLength(MAX_EVENTS)
  expect(log()?.stats).toMatchObject({ done: MAX_EVENTS + 2 })
  const ui = await mount($)
  expect(await shows(ui, 'Tool calls', String(MAX_EVENTS + 2))).toBe(true)
  await ui.unmount()
})

test("Turns count the main loop's completed turns, and Busy time ticks through the current one", async ($, on) => {
  const { clock } = engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await clock.advance(3000)
  await $.turn.complete({ answer: '', durationMs: 3000, isAborted: false, turnId: 't1', reason: 'answer' } as never)
  // A subagent's turn is not one of the main loop's.
  await $.turn.complete({ answer: '', durationMs: 9000, isAborted: false, turnId: 's1', agentId: 'a1', reason: 'answer' } as never)
  // An aborted turn still counts, and so does its time.
  await $.turn.start({ text: 'again', turnId: 't2' } as never)
  await clock.advance(2000)
  await $.turn.complete({ answer: '', durationMs: 2000, isAborted: true, turnId: 't2', reason: 'aborted' } as never)

  const ui = await mount($)
  expect(await shows(ui, 'Turns', '2')).toBe(true)
  expect(await shows(ui, 'Busy time', '00:05')).toBe(true)
  await clock.advance(4000)
  expect(await shows(ui, 'Busy time', '00:05')).toBe(true)
  await ui.unmount()

  await $.turn.start({ text: 'more', turnId: 't3' } as never)
  const live = await mount($)
  expect(await shows(live, 'Turns', '2')).toBe(true)
  await clock.advance(2000)
  expect(await shows(live, 'Busy time', '00:07')).toBe(true)
  await live.unmount()
})

test('Subagents count every spawn', async ($, on) => {
  const { log } = engine(on)
  await $.agent.spawn({ prompt: 'look', description: 'Look', subagentType: 'Explore' } as never)
  await $.agent.spawn({ prompt: 'dig', description: 'Dig', subagentType: 'general-purpose' } as never)
  expect(log()?.stats).toMatchObject({ subagents: 2 })
  const ui = await mount($)
  expect(await shows(ui, 'Subagents', '2')).toBe(true)
  await ui.unmount()
})

test("Tokens count every step's input and cache writes in, its output out, subagents' included", async ($, on) => {
  engine(on)
  stepUsage(on, { input_tokens: 1200, cache_creation_input_tokens: 800, cache_read_input_tokens: 90_000, output_tokens: 450 })
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await drain($)
  await drain($, 'a1')
  const ui = await mount($)
  expect(await shows(ui, 'Tokens in', '4.0k')).toBe(true)
  expect(await shows(ui, 'Tokens out', '900')).toBe(true)
  await ui.unmount()
})

test('Context, Cost and Session age come from the session usage on every draw', async ($, on) => {
  const { at, clock } = engine(on)
  const ui = await mount($)
  // No reading yet: each shows as not known.
  expect(await shows(ui, 'Context', '-')).toBe(true)
  expect(await shows(ui, 'Cost', '-')).toBe(true)
  expect(await shows(ui, 'Session age', '-')).toBe(true)
  await ui.unmount()

  at.usage = { startedAt: START - 65_000, context: { window: 200_000, tokens: 84_000, percent: 42.4 }, rateLimits: [], cost: { usd: 0.834 } }
  const read = await mount($)
  expect(await shows(read, 'Context', '42%')).toBe(true)
  expect(await shows(read, 'Cost', '$0.83')).toBe(true)
  expect(await shows(read, 'Session age', '01:05')).toBe(true)
  await clock.advance(1000)
  expect(await shows(read, 'Session age', '01:06')).toBe(true)
  await read.unmount()

  // A window with no fill reading yet.
  at.usage = { startedAt: START, context: { window: 200_000 }, rateLimits: [] }
  const empty = await mount($)
  expect(await shows(empty, 'Context', '-')).toBe(true)
  expect(await shows(empty, 'Cost', '-')).toBe(true)
  await empty.unmount()
})

test('the counters reset with the log on a new session id', async ($, on) => {
  const { at, clock, log } = engine(on)
  stepUsage(on, { input_tokens: 1200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 450 })
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await drain($)
  await clock.advance(1000)
  await $.turn.complete({ answer: '', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'answer' } as never)
  await $.agent.spawn({ prompt: 'look', description: 'Look', subagentType: 'Explore' } as never)
  // A turn under way when the session changes.
  await $.turn.start({ text: 'more', turnId: 't2' } as never)
  await clock.settle()
  expect(log()?.stats).toMatchObject({ done: 1, turns: 1, busyMs: 1000, subagents: 1, tokensIn: 1200, tokensOut: 450 })
  expect(log()?.stats?.turnSince).toBeDefined()

  at.session = 'two'
  const ui = await mount($)
  for (const [label, value] of [
    ['Tool calls', '0'], ['Done', '0'], ['Turns', '0'], ['Busy time', '00:00'],
    ['Subagents', '0'], ['Tokens in', '0'], ['Tokens out', '0'],
  ] as const) expect(await shows(ui, label, value)).toBe(true)
  await clock.advance(3000)
  expect(await shows(ui, 'Busy time', '00:00')).toBe(true)
  await ui.unmount()

  await $.tool.call({ tool: 'Read', file_path: '/repo/b' } as never)
  await clock.settle()
  expect(log()).toMatchObject({ session: 'two', stats: { done: 1, turns: 0, busyMs: 0, subagents: 0, tokensIn: 0, tokensOut: 0 } })
  expect(log()?.stats?.turnSince).toBeUndefined()
})

test('tokens read as a plain count, then thousands, then millions', () => {
  expect(tokensOf(0)).toBe('0')
  expect(tokensOf(999)).toBe('999')
  expect(tokensOf(1000)).toBe('1.0k')
  expect(tokensOf(182_400)).toBe('182.4k')
  expect(tokensOf(999_960)).toBe('1.0M')
  expect(tokensOf(1_234_567)).toBe('1.2M')
})

test('cost reads in dollars to the cent and context as a whole percent', () => {
  expect(costOf(0)).toBe('$0.00')
  expect(costOf(0.834)).toBe('$0.83')
  expect(costOf(12.5)).toBe('$12.50')
  expect(percentOf(41.6)).toBe('42%')
  expect(percentOf(0)).toBe('0%')
})

test('labels shorten in a column narrower than 18 cells', () => {
  const log: Log = { session: 'one', events: [] }
  const labels = (w: number) => summaryOf(log, undefined, 0, w).map(col => col.map(f => f.label))
  expect(labels(18)).toEqual([
    ['Tool calls', 'Done', 'Errors', 'Denied', 'Running'],
    ['Turns', 'Busy time', 'Subagents', 'Tokens in', 'Tokens out'],
    ['Context', 'Cost', 'Session age'],
  ])
  expect(labels(17)).toEqual([
    ['Calls', 'Done', 'Errors', 'Denied', 'Running'],
    ['Turns', 'Busy', 'Agents', 'In', 'Out'],
    ['Context', 'Cost', 'Age'],
  ])
})

test("a column whose long label would cut its value takes the short labels", () => {
  const log: Log = { session: 'one', events: [] }
  const usage = { startedAt: 0, context: { window: 200_000, percent: 42 }, rateLimits: [], cost: { usd: 0.83 } }
  const hour = 3_725_000
  const [calls, , session] = summaryOf(log, usage, hour, 18)
  expect(session!.map(f => f.label)).toEqual(['Context', 'Cost', 'Age'])
  expect(session![2]!.value).toBe('01:02:05')
  expect(calls![0]!.label).toBe('Tool calls')
  expect(summaryOf(log, usage, hour, 25)[2]!.map(f => f.label)).toEqual(['Context', 'Cost', 'Session age'])
})
