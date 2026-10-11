import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { cells, cut } from './cells.ts'
import { displayOf, elapsedOf } from './display.ts'
import { inputOf, outputOf, windowOf, wrap } from './inspect.ts'
import { MAX_EVENTS, categoryOf, columnsOf, durationOf, settle, startEvent, statusOf, timeOf } from './log.ts'
import type { Settled } from './log.ts'
import { spent, statsOf, summaryOf, tally } from './stats.ts'
import type { Figure } from './stats.ts'
import type { SessionUsage } from 'claude-code'
import type { Inspect, Log, LogEvent, Phase, Stats } from '../types'

// The Event Viewer (#83): a Win95 Frame window, opened by /event-viewer, that
// shows what Claude is doing in this session. Laid out as the prototype in
// #87 decided (variant B): title bar, raised bevel, grey body holding the
// activity log of tool calls (#91) with its Summary of session stats (#94),
// the Display as its status bar (#92), and a selected row's Event Properties
// (#93).

const PANE = 'event-viewer'
const COMMAND = 'event-viewer'
const TITLE = 'Event Viewer - Claude Session'

// The log lives in session state, so it survives a reload of this module.
const log = atom({ plugin: 'event-viewer', key: 'log' } as const, { session: '', events: [] } as Log)

// The row whose Event Properties are open, and how far its boxes scroll.
const inspect = atom({ plugin: 'event-viewer', key: 'inspect' } as const, { id: '', input: 0, output: 0 } as Inspect)

// The log as this session holds it: another session's starts empty.
const ofSession = (l: Log, session: string): Log => (l.session === session ? l : { session, events: [] })

// Frame roles (docs/theme-spec.md)
const FRAME = {
  frame_face: '#C0C0C0',
  frame_highlight: '#FFFFFF',
  frame_dark_shadow: '#000000',
  frame_title: '#000080',
  frame_title_text: '#FFFFFF',
  frame_text: '#000000',
  frame_shadow: '#808080',
  frame_selection: '#000080',
  frame_selection_text: '#FFFFFF',
  frame_gray_text: '#808080',
  frame_window: '#FFFFFF',
  frame_data_red: '#800000',
  frame_data_yellow: '#808000',
  frame_data_blue: '#000080',
}

// Display roles (docs/theme-spec.md)
const DISPLAY = {
  display_bg: '#000000',
  display_fg: '#00FFFF',
  display_ghost: '#008080',
}

// Each Type in its Frame data color (#87); Done stays frame_text.
const TYPE_FG: Record<LogEvent['status'], string> = {
  done: FRAME.frame_text,
  running: FRAME.frame_data_blue,
  denied: FRAME.frame_data_yellow,
  error: FRAME.frame_data_red,
}

// Rows of an inline window's grey body; a docked one fills the dock.
const INLINE_BODY_ROWS = 26

// A Seg is a run of cells in one style; a Row is segs exactly one window wide.
// Neighbouring segs with the same key press as one Button.
type Seg = { t: string; fg: string; bg?: string; b?: boolean; press?: () => unknown; key?: string; hotkey?: string }
type Row = Seg[]

const sg = (t: string, fg = FRAME.frame_text, bg: string | undefined = FRAME.frame_face, b = false): Seg => ({ t, fg, bg, b })

const width = (r: Row) => r.reduce((n, g) => n + cells(g.t), 0)

// Pads or cuts a row to exactly w cells.
function fit(r: Row, w: number, bg = FRAME.frame_face): Row {
  const have = width(r)
  if (have <= w) return have === w ? r : [...r, sg(' '.repeat(w - have), FRAME.frame_text, bg)]
  const out: Row = []
  let room = w
  for (const g of r) {
    if (room <= 0) break
    const n = cells(g.t)
    out.push(n <= room ? g : { ...g, t: cut(g.t, room) })
    room -= n
  }
  return out
}

// A box of w cells around rows in 1/8-cell lines, `lit` above and left and
// `dark` below and right.
function bevel(rows: Row[], w: number, fill: string, lit: string, dark: string): Row[] {
  return [
    [sg(' '), sg('▁'.repeat(w - 2), lit), sg(' ')],
    ...rows.map(r => [sg('▕', lit), ...fit(r, w - 2, fill), sg('▏', dark)]),
    [sg(' '), sg('▔'.repeat(w - 2), dark), sg(' ')],
  ]
}

// Sunken: shadow above and left, highlight below and right.
const sunken = (rows: Row[], w: number, fill: string) => bevel(rows, w, fill, FRAME.frame_shadow, FRAME.frame_highlight)
// Raised: highlight above and left, dark shadow below and right.
const raised = (rows: Row[], w: number) => bevel(rows, w, FRAME.frame_face, FRAME.frame_highlight, FRAME.frame_dark_shadow)

// A one-row push button: its side lines for the bevel.
function pushButton(key: string, label: string, press: () => unknown, opts: { hotkey?: string; bold?: boolean } = {}): Row {
  const face = { press, key, ...(opts.hotkey === undefined ? {} : { hotkey: opts.hotkey }) }
  return [
    { ...sg('▕', FRAME.frame_highlight), ...face },
    { ...sg(` ${label} `, FRAME.frame_text, FRAME.frame_face, opts.bold), ...face },
    { ...sg('▏', FRAME.frame_dark_shadow), ...face },
  ]
}

function menuBar(w: number): Row {
  const items = ['Log', 'View', 'Options', 'Help']
  return fit([sg(' '), ...items.flatMap(t => [sg(t), sg('  ')])], w)
}

// The log: a sunken white list box under raised column headers, newest call
// last; it shows the latest `room` calls, or from the selected one when it
// is older.
const COLUMNS = [
  { title: 'Type', key: 'type', w: 13 },
  { title: 'Time', key: 'time', w: 10 },
  { title: 'Source', key: 'source', w: 9 },
  { title: 'Category', key: 'category', w: 14 },
  { title: 'Event', key: 'event', w: 0 },
  { title: 'Dur.', key: 'dur', w: 8 },
] as const

// Beside the Event Properties the log is narrower: once the Event column
// would have fewer cells than this, the columns tighten to what their
// contents need.
const TIGHT_BELOW = 12
const TIGHT: Record<(typeof COLUMNS)[number]['key'], number> = { type: 12, time: 9, source: 8, category: 11, event: 0, dur: 7 }

// Each row presses as one: selecting it, or deselecting it when selected.
function logBox(events: LogEvent[], w: number, room: number, selected: string, select: (id: string) => unknown): Row[] {
  const inner = w - 2
  const loose = COLUMNS.reduce((n, c) => n + c.w, 0)
  const widths = COLUMNS.map(c => (inner - loose < TIGHT_BELOW ? TIGHT[c.key] : c.w))
  const fixed = widths.reduce((n, cw) => n + cw, 0)
  // The Event column takes what the others leave.
  const cols = COLUMNS.map((c, i) => ({ ...c, w: widths[i] === 0 ? Math.max(6, inner - fixed) : widths[i]! }))
  const header = fit(cols.flatMap(c => [sg(cut(` ${c.title}`, c.w - 1)), sg('▕', FRAME.frame_shadow)]), inner)
  const at = events.findIndex(ev => ev.id === selected)
  const start = Math.max(0, events.length - room)
  const rows = events.slice(at >= 0 && at < start ? at : start).slice(0, room).map(ev => {
    const cells = columnsOf(ev)
    const chosen = ev.id === selected
    const bg = chosen ? FRAME.frame_selection : FRAME.frame_window
    const fg = (key: string) => (chosen ? FRAME.frame_selection_text : key === 'type' ? TYPE_FG[ev.status] : FRAME.frame_text)
    const press = { press: () => select(chosen ? '' : ev.id), key: `ev-${ev.id}` }
    return fit(cols.map(c => ({ ...sg(cut(` ${cells[c.key]}`, c.w), fg(c.key), bg), ...press })), inner, FRAME.frame_window)
  })
  const blank = Array.from({ length: Math.max(0, room - rows.length) }, (): Row => [])
  return sunken([header, ...rows, ...blank], w, FRAME.frame_window)
}

// The Summary (#94): an etched group box, shadow above and left, highlight
// below and right, of three columns of figures, each label left and its value
// right; a figure not known yet reads `-` in gray.
const SUMMARY_ROWS = 7

function summaryBox(columns: (w: number) => Figure[][], w: number): Row[] {
  const inner = w - 2
  const cw = Math.floor(inner / 3)
  const figure = (f: Figure | undefined): Row => {
    if (f === undefined) return [sg(' '.repeat(cw))]
    const value = f.value === undefined ? sg('-', FRAME.frame_gray_text) : sg(f.value)
    const label = ` ${f.label}:`
    return fit([sg(label), sg(' '.repeat(Math.max(1, cw - cells(label) - cells(value.t) - 1))), value, sg(' ')], cw)
  }
  const cols = columns(cw)
  const rows = Array.from({ length: SUMMARY_ROWS - 2 }, (_, i): Row => cols.flatMap(col => figure(col[i])))
  const title = ' Summary '
  return [
    [sg('┌─', FRAME.frame_shadow), sg(title), sg('─'.repeat(Math.max(0, w - 3 - cells(title))), FRAME.frame_shadow), sg('┐', FRAME.frame_highlight)],
    ...rows.map(r => [sg('│', FRAME.frame_shadow), ...fit(r, inner), sg('│', FRAME.frame_highlight)]),
    [sg('└', FRAME.frame_shadow), sg('─'.repeat(inner), FRAME.frame_highlight), sg('┘', FRAME.frame_highlight)],
  ]
}

// The Display: one sunken LCD row of lit cyan over black, the step on the
// left with the event count in ghost cyan, the elapsed time on the right.
function display(log: Log, now: number, w: number): Row[] {
  const step = displayOf(log)
  const clock = elapsedOf(step.since === undefined ? 0 : now - step.since)
  const lit = (t: string, b = false) => sg(t, DISPLAY.display_fg, DISPLAY.display_bg, b)
  const ghost = (t: string) => sg(t, DISPLAY.display_ghost, DISPLAY.display_bg)
  const inner = w - 2
  const time = [ghost(clock.ghost), lit(clock.lit, true), lit(' ')]
  const left = fit([
    lit(` ${step.word.padEnd(9)}`, true),
    lit(step.what),
    ghost(`   ${log.events.length} events`),
  ], Math.max(0, inner - width(time)), DISPLAY.display_bg)
  return sunken([[...left, ...time]], w, DISPLAY.display_bg)
}

// The Event Properties panel (#93): a raised panel of the call's fields, then
// its Input and its Result (Reason when denied, Error when failed) in sunken
// frame_window boxes that wrap their text and scroll it, then ↑ ↓ and OK.

const STATUS: Record<LogEvent['status'], string> = { done: 'Done', running: 'Running', denied: 'Denied', error: 'Error' }
const OUTPUT_LABEL: Record<LogEvent['status'], string> = { done: 'Result', running: 'Result', denied: 'Reason', error: 'Error' }

// The panel's rows less its two boxes' lines: the bevel's two, the title, four
// of fields, and each box's label and two edges, and the buttons.
const PANEL_ROWS = 14
// Each box shows at least this many lines.
const MIN_LINES = 3
// Beside the log, from a body of this many columns, the panel takes this
// share of it, never less than this, and never so much that the log's
// tightened columns no longer fit.
const DOCK_FROM = 100
const PANEL_SHARE = 0.45
const PANEL_MIN = 40

type Act = {
  select: (id: string) => unknown
  step: (by: number) => unknown
  scroll: (box: 'input' | 'output', to: number) => unknown
}

// A sunken white box `lines` tall over the text's wrapped lines from `at`,
// with a scrollbar on its right while there is more than shows: ▲ and ▼ page
// it, over a dithered track with the thumb where the window is.
function scrollBox(key: string, text: string[], at: number, lines: number, w: number, scrollTo: (to: number) => unknown): Row[] {
  const inner = w - 3
  const { from, last } = windowOf(text.length, at, lines)
  const page = Math.max(1, lines - 1)
  const thumb = last === 0 ? -1 : 1 + Math.round((from / last) * (lines - 3))
  const bar = (i: number): Seg => {
    if (last === 0) return sg(' ', FRAME.frame_text, FRAME.frame_window)
    if (i === 0) return { ...sg('▲', FRAME.frame_text), press: () => scrollTo(Math.max(0, from - page)), key: `${key}-up` }
    if (i === lines - 1) return { ...sg('▼', FRAME.frame_text), press: () => scrollTo(Math.min(last, from + page)), key: `${key}-down` }
    return i === thumb ? sg('█', FRAME.frame_face) : sg('▒', FRAME.frame_highlight)
  }
  const rows = Array.from({ length: lines }, (_, i): Row => [
    ...fit([sg(` ${text[from + i] ?? ''}`, FRAME.frame_text, FRAME.frame_window)], inner, FRAME.frame_window),
    bar(i),
  ])
  return sunken(rows, w, FRAME.frame_window)
}

// A box's label, with which lines show while some don't.
function boxLabel(label: string, text: string[], at: number, lines: number, w: number): Row {
  const { from, last } = windowOf(text.length, at, lines)
  const range = last === 0 ? '' : `lines ${from + 1}-${from + lines} of ${text.length} `
  return fit([sg(` ${label}`), sg(' '.repeat(Math.max(1, w - label.length - 1 - range.length))), sg(range, FRAME.frame_gray_text)], w)
}

// The panel, w wide, its two boxes sharing `lines` lines: the Input as many
// as it needs up to half, the Result the rest.
function panel(ev: LogEvent, view: Inspect, w: number, lines: number, act: Act): Row[] {
  const iw = w - 2
  const textW = iw - 4
  const input = wrap(ev.input ?? '(not kept: this call was logged before its input was)', textW)
  const output = wrap(
    ev.status === 'running' ? '(still running: no result yet)' : ev.output ?? '(not kept: this call was logged before its result was)',
    textW,
  )
  const inputLines = Math.min(Math.max(MIN_LINES, input.length), Math.floor(lines / 2))
  const outputLines = Math.max(MIN_LINES, lines - inputLines)
  const field = (k: string, v: Seg, w2 = iw) => fit([sg(cut(` ${k}`, 11)), v], w2)
  const half = Math.floor(iw / 2)
  const dur = ev.endedAt === undefined ? 'running' : durationOf(ev.endedAt - ev.startedAt)
  const buttons = [
    ...pushButton('prev', '↑', () => act.step(-1), { hotkey: 'k' }),
    ...pushButton('next', '↓', () => act.step(1), { hotkey: 'j' }),
  ]
  const ok = pushButton('ok', 'OK', () => act.select(''), { bold: true })
  return raised([
    fit([sg(' Event Properties', FRAME.frame_text, FRAME.frame_face, true)], iw),
    field('Tool:', sg(categoryOf(ev.tool))),
    field('Target:', sg(ev.target)),
    [...field('Status:', sg(STATUS[ev.status], TYPE_FG[ev.status], FRAME.frame_face, true), half), ...field('Duration:', sg(dur), iw - half)],
    [...field('Started:', sg(timeOf(ev.startedAt)), half), ...field('Agent:', sg(ev.agent ?? 'main'), iw - half)],
    boxLabel('Input', input, view.input, inputLines, iw),
    ...scrollBox('input', input, view.input, inputLines, iw, to => act.scroll('input', to)),
    boxLabel(OUTPUT_LABEL[ev.status], output, view.output, outputLines, iw),
    ...scrollBox('output', output, view.output, outputLines, iw, to => act.scroll('output', to)),
    fit([sg(' '), ...buttons, sg(' '.repeat(Math.max(1, iw - 2 - width(buttons) - width(ok)))), ...ok], iw),
  ], w)
}

// Navy title bar with the caption buttons; only × does anything.
function titleBar(w: number, close: () => unknown): Row {
  const buttons = 11
  return [
    sg(cut(` ${TITLE}`, Math.max(0, w - buttons)), FRAME.frame_title_text, FRAME.frame_title, true),
    sg(' _ ', FRAME.frame_text, FRAME.frame_face, true),
    sg(' ', FRAME.frame_title_text, FRAME.frame_title),
    sg(' □ ', FRAME.frame_text, FRAME.frame_face, true),
    sg(' ', FRAME.frame_title_text, FRAME.frame_title),
    { ...sg(' × ', FRAME.frame_text, FRAME.frame_face, true), press: close, key: 'close' },
  ]
}

// The grey body: menu bar, the caption with the event count, the log filling
// the rest with the Summary under it, and the Display at the bottom. A
// selected row's Event Properties dock beside the log and its Summary in a
// wide body and sit under the Summary in a narrow one, so it stays put; the
// window grows to show them whole when the body is short.
function bodyRows(held: Log, usage: SessionUsage | undefined, view: Inspect, now: number, w: number, rows: number, act: Act): Row[] {
  const n = held.events.length
  const ev = held.events.find(x => x.id === view.id)
  const side = ev !== undefined && w + 2 >= DOCK_FROM
  // Less the menu bar, the caption and the Display's three rows.
  const area = Math.max(4, rows - 5)
  const inset = (r: Row) => fit([sg(' '), ...r], w)
  const lines = side ? Math.max(2 * MIN_LINES, area - PANEL_ROWS) : 4 * MIN_LINES
  // The log's tight columns, an Event column of 6, and the box's two edges.
  const logMin = Object.values(TIGHT).reduce((n, cw) => n + cw, 0) + 6 + 2
  const panelW = side ? Math.max(PANEL_MIN, Math.min(Math.floor(w * PANEL_SHARE), w - 3 - logMin)) : w - 2
  const props = ev === undefined ? [] : panel(ev, view, panelW, lines, act)
  // The list box's two edges and header aside, its rows show calls.
  const listRows = Math.max((side ? Math.max(area, props.length) : area - props.length) - SUMMARY_ROWS, 5)
  const logW = side ? w - 3 - panelW : w - 2
  const list = logBox(held.events, logW, listRows - 3, view.id, act.select)
  const summary = summaryBox(cw => summaryOf(held, usage, now, cw), logW)
  const middle = side
    ? [...list, ...summary].map((r, i) => fit([sg(' '), ...r, sg(' '), ...(props[i] ?? [])], w))
    : [...list.map(inset), ...summary.map(inset), ...props.map(inset)]
  return [
    menuBar(w),
    fit([sg(' Claude Session', FRAME.frame_text, FRAME.frame_face, true), sg(` - ${n} event(s)`, FRAME.frame_gray_text)], w),
    ...middle,
    ...display(held, now, w - 2).map(inset),
  ]
}

// Raised window: highlight on the left, dark shadow on the right and below,
// drawn with 1/8-cell lines so the bevel reads as one pixel.
function windowRows(w: number, body: Row[], close: () => unknown): Row[] {
  const iw = w - 2
  const edge = (r: Row): Row => [sg('▏', FRAME.frame_highlight), ...fit(r, iw), sg('▕', FRAME.frame_dark_shadow)]
  return [
    edge(titleBar(iw, close)),
    ...body.map(edge),
    [sg('▔'.repeat(w), FRAME.frame_dark_shadow, undefined)],
  ]
}

// The main loop's phase, kept beside the log as of now; the model stays the
// last one a step named until another does.
async function phaseTo($: EngineInterface, kind: Phase['kind'], model?: string) {
  const [session, since] = await Promise.all([$.session.id(), $.clock.now()])
  await update($, log, l => {
    const held = ofSession(l, session)
    const named = model ?? held.phase?.model
    return { ...held, phase: { kind, since, ...(named === undefined ? {} : { model: named }) } }
  })
}

// The Summary's counters, changed in the current session's log.
async function count($: EngineInterface, change: (s: Stats, now: number) => Stats) {
  const [session, now] = await Promise.all([$.session.id(), $.clock.now()])
  await update($, log, l => {
    const held = ofSession(l, session)
    return { ...held, stats: change(statsOf(held), now) }
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Open the Event Viewer: what Claude is doing in this session',
    })
    return next(e)
  })

  on('command.run', { command: COMMAND }, async $ => {
    await $.ui.open({ id: PANE, title: 'Event Viewer', focus: true, columns: 104, rows: 40 })
    return { text: 'Event Viewer opened.' }
  }).catch(() => ({ text: 'The Event Viewer could not open.' }))

  // Every tool call, the main loop's, subagents' and MCP tools' alike: a
  // running row as it starts, settled in place when it ends.
  on('tool.call', async ($, e, next) => {
    // A subagent's call names its type; one no list knows reads as Agent.
    const subagent = async (id: string) => (await $.agent.list()).find(a => a.id === id)?.type ?? 'Agent'
    const [session, startedAt, agent] = await Promise.all([
      $.session.id(),
      $.clock.now(),
      e.agentId === undefined ? undefined : subagent(e.agentId),
    ])
    const ev = { ...startEvent(e, startedAt, agent), input: inputOf(e) }
    await update($, log, l => {
      const held = ofSession(l, session)
      return { ...held, events: [...held.events, ev].slice(-MAX_EVENTS) }
    })
    // Settled inside the update: a read here would see the log as it stood
    // when this dispatch began, before tool.check kept the verdict on the row.
    const end = async (ran: Settled) => {
      const endedAt = await $.clock.now()
      // Counted even when the row has dropped off the top of the log.
      await update($, log, l => {
        if (l.session !== session) return l
        const row = l.events.find(x => x.id === ev.id)
        const status = statusOf(ran, row?.verdict)
        return {
          ...l,
          events: l.events.map(x => (x === row ? { ...x, status, endedAt, output: outputOf(ran, x) } : x)),
          stats: tally(statsOf(l), status),
        }
      })
    }
    try {
      const ran = await next(e)
      await end(ran)
      return ran
    } catch (err) {
      await end({ isError: true, text: err instanceof Error ? err.message : String(err) })
      throw err
    }
  })

  // The permission verdict, kept on the call's row: a deny there comes back
  // from the tool as an error, and the row shows it as denied, with the
  // rule's reason.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (e.tool_use_id !== undefined) {
      const id = e.tool_use_id
      const reason = verdict.decision === 'deny' && verdict.reason !== undefined ? { reason: verdict.reason } : {}
      await update($, log, l => ({ ...l, events: settle(l.events, id, { verdict: verdict.decision, ...reason }) }))
    }
    return verdict
  })

  // The main loop's phase for the Display: a turn works from its start,
  // thinks while thinking streams, works again once the rest of the step
  // streams, and goes idle as it ends. A subagent's turn is told on the
  // Display by its Agent call, so its steps change nothing here.
  // Busy time runs from a turn's start until it completes.
  on('turn.start', async ($, e, next) => {
    await phaseTo($, 'working')
    await count($, (s, now) => ({ ...s, turnSince: now }))
    return next(e)
  })

  // Every step's tokens count, a subagent's too.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) {
      const result = yield* next(e)
      await count($, s => spent(s, result.usage))
      return result
    }
    await phaseTo($, 'working', e.model)
    let kind: Phase['kind'] = 'working'
    const stream = next(e)
    for await (const chunk of stream) {
      const seen: Phase['kind'] = chunk.kind === 'thinking' ? 'thinking' : chunk.kind === 'engine' ? kind : 'working'
      if (seen !== kind) {
        kind = seen
        await phaseTo($, kind, e.model)
      }
      yield chunk
    }
    const result = await stream.result
    await count($, s => spent(s, result.usage))
    return result
  })

  // A main-loop turn ends, aborted or errored too: it counts, with its time.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await phaseTo($, 'idle')
      await count($, ({ turnSince: _, ...s }) => ({ ...s, turns: s.turns + 1, busyMs: s.busyMs + e.durationMs }))
    }
    return next(e)
  })

  // Every subagent, a background one or a subagent's own, counts as spawned.
  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    await count($, s => ({ ...s, subagents: s.subagents + 1 }))
    return spawned
  })

  // The window's clocks tick once a second while it is drawn: each draw asks
  // for the next at the turn of the soonest one's second.
  let tick: { cancel: () => void } | undefined

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    // Usage is read on every draw, and is not known until the engine has it.
    const [stored, view, session, now, usage] = await Promise.all([
      read($, log),
      read($, inspect),
      $.session.id(),
      $.clock.now(),
      $.session.usage().catch(() => undefined),
    ])
    const held = ofSession(stored, session)
    const w = Math.max(60, e.props.bodyColumns)
    // A docked window fills the dock less its title bar and bottom edge.
    const rowCount = e.props.placement === 'dock' ? Math.max(6, e.props.scroll.bodyRows - 2) : INLINE_BODY_ROWS
    // Opening a row, or stepping to another, shows its boxes from the top.
    const show = (id: string) => update($, inspect, () => ({ id, input: 0, output: 0 }))
    const act: Act = {
      select: show,
      step: by => {
        const at = held.events.findIndex(x => x.id === view.id)
        const to = held.events[Math.min(Math.max(0, at + by), held.events.length - 1)]
        return at < 0 || to === undefined ? undefined : show(to.id)
      },
      scroll: (box, to) => update($, inspect, v => ({ ...v, [box]: to })),
    }
    const rows = windowRows(w, bodyRows(held, usage, view, now, w - 2, rowCount, act), () => $.ui.close({ id: PANE }))

    // Each clock shown turns its second at its own start: the Display's step,
    // the current turn's Busy time and the Session age.
    const starts = [displayOf(held).since, statsOf(held).turnSince, usage?.startedAt].filter(t => t !== undefined)
    tick?.cancel()
    tick = starts.length === 0 ? undefined : $.clock.after(Math.min(...starts.map(t => 1000 - ((now - t) % 1000))), () => {
      tick = undefined
      $.ui.invalidate('ui.render')
    })

    const drawSeg = (g: Seg) => (
      <Text color={g.fg} backgroundColor={g.bg} bold={g.b}>{g.t}</Text>
    )
    // Neighbouring segs with one key draw as one Button.
    const runs = (r: Row) => r.reduce<Seg[][]>((out, g) => {
      const prev = out[out.length - 1]
      if (prev && g.press && prev[0]?.key === g.key) prev.push(g)
      else out.push([g])
      return out
    }, [])
    const drawRow = (r: Row) =>
      r.some(g => g.press)
        ? <Box flexDirection="row">
            {runs(r).map(([g, ...rest]) => g!.press
              ? <Button key={g!.key} plain hotkey={g!.hotkey} onPress={() => { void g!.press!() }}><Text>{[g!, ...rest].map(drawSeg)}</Text></Button>
              : <Text>{[g!, ...rest].map(drawSeg)}</Text>)}
          </Box>
        : <Text wrap="truncate">{r.map(drawSeg)}</Text>

    return <Box flexDirection="column">{rows.map(drawRow)}</Box>
  })
}
