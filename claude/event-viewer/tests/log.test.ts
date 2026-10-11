import { test, expect, mock } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { columnsOf, statusOf } from '../hooks/log.ts'
import type { Log } from '../types'

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const LOG = { plugin: 'event-viewer', key: 'log' } as const

// The session the engine stands in for, and the log as the mod last wrote it
// to session state (the kit holds $.state beneath the plugins; a test reads
// it by watching the writes).
function watchLog(on: On) {
  let last: Log | undefined
  const at = { session: 'one' }
  on('session.id', async () => ({ value: at.session }) as never)
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  return { at, log: () => last, events: async () => last?.events ?? [] }
}

const mount = ($: Engine) =>
  $.ui.mount({
    plugin: 'event-viewer', surface: 'terminal', component: 'Pane', requestId: 'event-viewer',
    props: { bodyColumns: 104, placement: 'dock', scroll: { offset: 0, bodyRows: 30 } },
  } as never)

// Stands in for the engine beneath the mod: each call takes `ms` on the
// mocked clock, then answers what `answer` gives for its tool.
function engine(on: On, ms: number, answer: (tool: string) => unknown) {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 11, 7, 2, 5) })
  on('tool.call', async ($, e) => {
    if (ms > 0) await clock.sleep(ms)
    return answer(e.tool) as never
  })
  return { clock, ...watchLog(on) }
}

// What core answers when the person picks "No" at the permission prompt: the
// tool's error result carrying Claude Code's rejection message (the tool
// never runs). Recorded from Claude Code's reject message, not from a live
// prompt: the research (#84) left it unverified, and a test has no prompt.
const REJECTED =
  "The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed."

test('a call shows as running, then settles to done with its clock duration', async ($, on) => {
  const { clock, events } = engine(on, 1200, () => ({ result: 'ok', text: 'ok' }))
  const call = $.tool.call({ tool: 'Read', file_path: '/repo/CONTEXT.md' } as never)
  await clock.settle()

  expect(await events()).toMatchObject([{ tool: 'Read', target: '/repo/CONTEXT.md', status: 'running' }])
  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: /\(>\) Running/ } as never)).toBeDefined()
  await ui.unmount()

  await clock.advance(1200)
  await call
  const [done] = await events()
  expect(done).toMatchObject({ status: 'done' })
  expect(done!.endedAt! - done!.startedAt).toBe(1200)

  const after = await mount($)
  expect(await after.find({ type: 'Text', text: /\(i\) Done/ } as never)).toBeDefined()
  expect(await after.find({ type: 'Text', text: /1\.2s/ } as never)).toBeDefined()
  expect(await after.find({ type: 'Text', text: /Claude Session - 1 event\(s\)/ } as never)).toBeDefined()
  await after.unmount()
})

test('a tool that fails settles to error', async ($, on) => {
  const { clock, events } = engine(on, 30, () => ({ isError: true, result: 'boom', text: 'Exit code 1' }))
  const call = $.tool.call({ tool: 'Bash', command: 'false' } as never)
  await clock.advance(30)
  await call
  expect(await events()).toMatchObject([{ tool: 'Bash', target: 'false', status: 'error' }])
})

test('a call a hook refuses settles to denied', async ($, on) => {
  const { clock, events } = engine(on, 0, () => ({ deny: 'not here' }))
  await $.tool.call({ tool: 'Bash', command: 'git push --force' } as never)
  await clock.settle()
  expect(await events()).toMatchObject([{ status: 'denied' }])
})

test('a call a permission rule refuses settles to denied', async ($, on) => {
  const clock = mock.clock(on)
  const { events } = watchLog(on)
  on('tool.check', async () => ({ decision: 'deny', reason: 'Bash(rm:*) is denied' }) as never)
  on('tool.call', async (_, e) => {
    const verdict = await $.tool.check({ tool: e.tool, input: { command: 'rm -rf x' }, tool_use_id: e.tool_use_id } as never)
    return { isError: true, result: verdict.reason, text: verdict.reason } as never
  })
  await $.tool.call({ tool: 'Bash', command: 'rm -rf x' } as never)
  await clock.settle()
  expect(await events()).toMatchObject([{ status: 'denied', verdict: 'deny' }])
})

// The open question from #84: the person answering "No" shows as denied, not
// as an error, though core hands it back as an errored result.
test('the person answering No at the permission prompt shows as denied, not error', async ($, on) => {
  const clock = mock.clock(on)
  const { events } = watchLog(on)
  on('tool.check', async () => ({ decision: 'ask' }) as never)
  on('tool.call', async (_, e) => {
    await $.tool.check({ tool: e.tool, input: { file_path: '/repo/x' }, tool_use_id: e.tool_use_id } as never)
    return { isError: true, result: REJECTED, text: REJECTED } as never
  })
  await $.tool.call({ tool: 'Edit', file_path: '/repo/x', old_string: 'a', new_string: 'b' } as never)
  await clock.settle()
  expect(await events()).toMatchObject([{ status: 'denied', verdict: 'ask' }])
})

test('a call the person allowed at the prompt that then fails stays an error', () => {
  expect(statusOf({ isError: true, text: 'Exit code 1' }, 'ask')).toBe('error')
  expect(statusOf({ isError: true, text: REJECTED }, 'ask')).toBe('denied')
})

test('an MCP tool shows as server:tool', async ($, on) => {
  const { clock, events } = engine(on, 0, () => ({ result: 'ok', text: 'ok' }))
  await $.tool.call({ tool: 'mcp__claude-in-chrome__navigate', url: 'http://localhost:5173' } as never)
  await clock.settle()
  const [ev] = await events()
  expect(ev).toMatchObject({ tool: 'mcp__claude-in-chrome__navigate', target: 'http://localhost:5173', status: 'done' })
  expect(columnsOf(ev!).category).toBe('claude-in-chrome:navigate')
  expect(columnsOf(ev!).source).toBe('Claude')
})

test("a subagent's call names the subagent's type as its Source", () => {
  const ev = { id: '1', tool: 'Grep', target: 'frame_', agent: 'Explore', status: 'done', startedAt: 0, endedAt: 61 } as const
  expect(columnsOf(ev)).toMatchObject({ source: 'Explore', category: 'Grep', event: 'frame_', dur: '61ms', type: '(i) Done' })
})

test('each status reads as its Type', () => {
  const at = { id: '1', tool: 'Read', target: '', startedAt: 0 }
  expect(columnsOf({ ...at, status: 'running' }).type).toBe('(>) Running')
  expect(columnsOf({ ...at, status: 'done', endedAt: 1 }).type).toBe('(i) Done')
  expect(columnsOf({ ...at, status: 'denied', endedAt: 1 }).type).toBe('(!) Denied')
  expect(columnsOf({ ...at, status: 'error', endedAt: 1 }).type).toBe('(x) Error')
  expect(columnsOf({ ...at, status: 'running' }).dur).toBe('')
  expect(columnsOf({ ...at, status: 'done', endedAt: 75000 }).dur).toBe('01:15')
})

test('the log is kept in session state, and a new session starts empty', async ($, on) => {
  const { at, clock, log } = engine(on, 0, () => ({ result: 'ok', text: 'ok' }))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a' } as never)
  await clock.settle()
  expect(log()).toMatchObject({ session: 'one', events: [{ target: '/repo/a' }] })

  at.session = 'two'
  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: /Claude Session - 0 event\(s\)/ } as never)).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Read', file_path: '/repo/b' } as never)
  await clock.settle()
  expect(log()).toMatchObject({ session: 'two', events: [{ target: '/repo/b' }] })
})
