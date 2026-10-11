import { test, expect, mock } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { displayOf, elapsedOf } from '../hooks/display.ts'
import type { Log } from '../types'

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const LOG = { plugin: 'event-viewer', key: 'log' } as const
const MODEL = 'claude-opus-5-5'

// The engine beneath the mod: one session, a clock that moves only when the
// test moves it, tools that take `toolMs`, and turns that start and end.
function engine(on: On, toolMs = 0) {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 11, 7, 2, 5) })
  let last: Log | undefined
  on('session.id', async () => ({ value: 'one' }) as never)
  on('state.set', async ($, e, next) => {
    if (e.plugin === LOG.plugin && e.key === LOG.key) last = e.value as Log
    return next(e)
  })
  on('tool.call', async () => {
    if (toolMs > 0) await clock.sleep(toolMs)
    return { result: 'ok', text: 'ok' } as never
  })
  on('turn.start', async (_, e) => ({ turnId: e.turnId }) as never)
  on('turn.complete', async () => ({ text: '' }) as never)
  return { clock, log: () => last }
}

const mount = ($: Engine) =>
  $.ui.mount({
    plugin: 'event-viewer', surface: 'terminal', component: 'Pane', requestId: 'event-viewer',
    props: { bodyColumns: 104, placement: 'dock', scroll: { offset: 0, bodyRows: 30 } },
  } as never)

// Streams one model step through the mod: `chunks` come from beneath, `gap`
// ms apart, and the step returns once they are all in.
function step(on: On, clock: { sleep: (ms: number) => Promise<void> }, chunks: { kind: string; text?: string }[], gap: number) {
  on('turn.step', async function* (_, e) {
    for (const c of chunks) {
      await clock.sleep(gap)
      yield { index: 0, ...c } as never
    }
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: null } as never
  })
}

async function drain($: Engine) {
  const stream = $.turn.step({ turnId: 't1', index: 0, model: MODEL, messageCount: 1 } as never)
  for await (const _ of stream) { /* read through */ }
}

test('between turns the Display reads IDLE', async ($, on) => {
  engine(on)
  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: /IDLE\s+waiting for a prompt/ } as never)).toBeDefined()
  await ui.unmount()
})

test("while a tool call runs the Display reads its step, and the time ticks from the call's start", async ($, on) => {
  const { clock } = engine(on, 5000)
  const call = $.tool.call({ tool: 'Bash', command: 'npm test --silent' } as never)
  await clock.settle()

  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: /RUNNING\s+Bash  npm test --silent/ } as never)).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /88:80/ } as never)).toBeDefined()
  await clock.advance(3000)
  expect(await ui.find({ type: 'Text', text: /88:83/ } as never)).toBeDefined()

  await clock.advance(2000)
  await call
  expect(await ui.find({ type: 'Text', text: /IDLE/ } as never)).toBeDefined()
  await ui.unmount()
})

test('while the model thinks the Display reads THINKING and its model, then the time resets as the step changes', async ($, on) => {
  const { clock, log } = engine(on)
  step(on, clock, [{ kind: 'thinking', text: 'hm' }, { kind: 'thinking', text: 'm' }, { kind: 'text', text: 'Done.' }], 4000)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  const streaming = drain($)

  await clock.advance(4000)
  expect(log()?.phase).toMatchObject({ kind: 'thinking', model: MODEL })
  const ui = await mount($)
  expect(await ui.find({ type: 'Text', text: new RegExp(`THINKING\\s+${MODEL}`) } as never)).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /88:80/ } as never)).toBeDefined()
  await clock.advance(2000)
  expect(await ui.find({ type: 'Text', text: /88:82/ } as never)).toBeDefined()

  // Still thinking at the second chunk: the time runs on.
  await clock.advance(2000)
  expect(await ui.find({ type: 'Text', text: /88:84/ } as never)).toBeDefined()
  // Under the test kit a mounted drawing's acts never resolve once a model
  // step writes mid-stream, so the window is closed while the step changes.
  await ui.unmount()

  // The answer starts streaming: a new step, timed from zero.
  await clock.advance(4000)
  await streaming
  expect(log()?.phase).toMatchObject({ kind: 'working', model: MODEL })
  const writing = await mount($)
  expect(await writing.find({ type: 'Text', text: new RegExp(`WORKING\\s+${MODEL}`) } as never)).toBeDefined()
  expect(await writing.find({ type: 'Text', text: /88:80/ } as never)).toBeDefined()

  await $.turn.complete({ answer: 'Done.', durationMs: 12000, isAborted: false, turnId: 't1', reason: 'answer' } as never)
  expect(await writing.find({ type: 'Text', text: /IDLE/ } as never)).toBeDefined()
  await writing.unmount()

  // The next turn reads the model the last step named until its own step does.
  await $.turn.start({ text: 'again', turnId: 't2' } as never)
  expect(log()?.phase).toMatchObject({ kind: 'working', model: MODEL })
})

test("a subagent's turn ending leaves the main loop's step alone", async ($, on) => {
  const { log } = engine(on)
  await $.turn.start({ text: 'go', turnId: 't1' } as never)
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 's1', agentId: 'a1', reason: 'answer' } as never)
  expect(log()?.phase).toMatchObject({ kind: 'working' })
})

test('a running call outranks thinking; the latest running call is the step', () => {
  const at = { session: 'one', phase: { kind: 'thinking', since: 0, model: MODEL } } as const
  const run = (id: string, startedAt: number) => ({ id, tool: 'Read', target: `/repo/${id}`, status: 'running', startedAt }) as const
  const done = { id: 'c', tool: 'Grep', target: 'x', status: 'done', startedAt: 0, endedAt: 3 } as const
  expect(displayOf({ ...at, events: [done, run('a', 1), run('b', 5)] })).toEqual({ word: 'RUNNING', what: 'Read  /repo/b', since: 5 })
  expect(displayOf({ ...at, phase: { ...at.phase, since: 4 }, events: [done] })).toEqual({ word: 'THINKING', what: MODEL, since: 4 })
  expect(displayOf({ session: 'one', events: [done] })).toEqual({ word: 'IDLE', what: 'waiting for a prompt', since: undefined })
  expect(displayOf({ ...at, events: [{ ...run('m', 2), tool: 'mcp__claude-in-chrome__navigate', target: 'http://x' }] }).what).toBe('claude-in-chrome:navigate  http://x')
})

test('a step that comes on as a call settles is timed from then', () => {
  const working = { kind: 'working', since: 0, model: MODEL } as const
  const ended = { id: 'b', tool: 'Bash', target: 'ls', status: 'done', startedAt: 2, endedAt: 7 } as const
  const older = { id: 'a', tool: 'Read', target: '/repo/a', status: 'running', startedAt: 1 } as const
  // Back to the turn after its call: the clock starts again, not from the turn.
  expect(displayOf({ session: 'one', phase: working, events: [ended] })).toMatchObject({ word: 'WORKING', since: 7 })
  // The latest of two parallel calls ends: the older one comes on now.
  expect(displayOf({ session: 'one', phase: working, events: [older, ended] })).toMatchObject({ word: 'RUNNING', what: 'Read  /repo/a', since: 7 })
  // One that started before the running call settling changes nothing.
  expect(displayOf({ session: 'one', phase: working, events: [{ ...ended, id: 'z', startedAt: 0 }, { ...older, startedAt: 3 }] })).toMatchObject({ since: 3 })
  // A thinking that began after the call ended keeps its own start.
  expect(displayOf({ session: 'one', phase: { ...working, kind: 'thinking', since: 9 }, events: [ended] })).toMatchObject({ since: 9 })
})


test('elapsed time lights its digits from the first that is not zero', () => {
  expect(elapsedOf(0)).toEqual({ ghost: '88:8', lit: '0' })
  expect(elapsedOf(5_400)).toEqual({ ghost: '88:8', lit: '5' })
  expect(elapsedOf(75_000)).toEqual({ ghost: '8', lit: '1:15' })
  expect(elapsedOf(754_000)).toEqual({ ghost: '', lit: '12:34' })
  expect(elapsedOf(3_725_000)).toEqual({ ghost: '8', lit: '1:02:05' })
})
