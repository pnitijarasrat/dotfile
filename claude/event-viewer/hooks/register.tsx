import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { MAX_EVENTS, columnsOf, settle, startEvent, statusOf } from './log.ts'
import type { Settled } from './log.ts'
import type { Log, LogEvent } from '../types'

// The Event Viewer (#83): a Win95 Frame window, opened by /event-viewer, that
// shows what Claude is doing in this session. Laid out as the prototype in
// #87 decided (variant B): title bar, raised bevel, grey body holding the
// activity log of tool calls (#91).

const PANE = 'event-viewer'
const COMMAND = 'event-viewer'
const TITLE = 'Event Viewer - Claude Session'

// The log lives in session state, so it survives a reload of this module.
const log = atom({ plugin: 'event-viewer', key: 'log' } as const, { session: '', events: [] } as Log)

// Frame roles (docs/theme-spec.md)
const FRAME = {
  frame_face: '#C0C0C0',
  frame_highlight: '#FFFFFF',
  frame_dark_shadow: '#000000',
  frame_title: '#000080',
  frame_title_text: '#FFFFFF',
  frame_text: '#000000',
  frame_shadow: '#808080',
  frame_gray_text: '#808080',
  frame_window: '#FFFFFF',
  frame_data_red: '#800000',
  frame_data_yellow: '#808000',
  frame_data_blue: '#000080',
}

// Each Type in its Frame data color (#87); Done stays frame_text.
const TYPE_FG: Record<LogEvent['status'], string> = {
  done: FRAME.frame_text,
  running: FRAME.frame_data_blue,
  denied: FRAME.frame_data_yellow,
  error: FRAME.frame_data_red,
}

// Rows of an inline window's grey body; a docked one fills the dock.
const INLINE_BODY_ROWS = 16

// A Seg is a run of cells in one style; a Row is segs exactly one window wide.
type Seg = { t: string; fg: string; bg?: string; b?: boolean; press?: () => unknown; key?: string }
type Row = Seg[]

const sg = (t: string, fg = FRAME.frame_text, bg: string | undefined = FRAME.frame_face, b = false): Seg => ({ t, fg, bg, b })

function cut(t: string, n: number) {
  const chars = [...t]
  if (chars.length <= n) return t + ' '.repeat(n - chars.length)
  return chars.slice(0, Math.max(0, n - 1)).join('') + '…'
}

const width = (r: Row) => r.reduce((n, g) => n + [...g.t].length, 0)

// Pads or cuts a row to exactly w cells.
function fit(r: Row, w: number, bg = FRAME.frame_face): Row {
  const have = width(r)
  if (have <= w) return have === w ? r : [...r, sg(' '.repeat(w - have), FRAME.frame_text, bg)]
  const out: Row = []
  let room = w
  for (const g of r) {
    if (room <= 0) break
    const n = [...g.t].length
    out.push(n <= room ? g : { ...g, t: cut(g.t, room) })
    room -= n
  }
  return out
}

// A sunken box of w cells around rows: shadow above and left, highlight below
// and right, in 1/8-cell lines.
function sunken(rows: Row[], w: number, fill: string): Row[] {
  return [
    [sg(' '), sg('▁'.repeat(w - 2), FRAME.frame_shadow), sg(' ')],
    ...rows.map(r => [sg('▕', FRAME.frame_shadow), ...fit(r, w - 2, fill), sg('▏', FRAME.frame_highlight)]),
    [sg(' '), sg('▔'.repeat(w - 2), FRAME.frame_highlight), sg(' ')],
  ]
}

function menuBar(w: number): Row {
  const items = ['Log', 'View', 'Options', 'Help']
  return fit([sg(' '), ...items.flatMap(t => [sg(t), sg('  ')])], w)
}

// The log: a sunken white list box under raised column headers, newest call
// last; it shows the latest `room` calls.
const COLUMNS = [
  { title: 'Type', key: 'type', w: 13 },
  { title: 'Time', key: 'time', w: 10 },
  { title: 'Source', key: 'source', w: 9 },
  { title: 'Category', key: 'category', w: 14 },
  { title: 'Event', key: 'event', w: 0 },
  { title: 'Dur.', key: 'dur', w: 8 },
] as const

function logBox(events: LogEvent[], w: number, room: number): Row[] {
  const inner = w - 2
  const fixed = COLUMNS.reduce((n, c) => n + c.w, 0)
  // The Event column takes what the others leave.
  const cols = COLUMNS.map(c => ({ ...c, w: c.w === 0 ? Math.max(6, inner - fixed) : c.w }))
  const header = fit(cols.flatMap(c => [sg(cut(` ${c.title}`, c.w - 1)), sg('▕', FRAME.frame_shadow)]), inner)
  const rows = events.slice(-room).map(ev => {
    const cells = columnsOf(ev)
    const fg = (key: string) => (key === 'type' ? TYPE_FG[ev.status] : FRAME.frame_text)
    return fit(cols.map(c => sg(cut(` ${cells[c.key]}`, c.w), fg(c.key), FRAME.frame_window)), inner, FRAME.frame_window)
  })
  const blank = Array.from({ length: Math.max(0, room - rows.length) }, (): Row => [])
  return sunken([header, ...rows, ...blank], w, FRAME.frame_window)
}

// Navy title bar with the caption buttons; only × does anything.
function titleBar(w: number, close: () => unknown): Row {
  const buttons = 10
  return [
    sg(cut(` ${TITLE}`, Math.max(0, w - buttons)), FRAME.frame_title_text, FRAME.frame_title, true),
    sg(' _ ', FRAME.frame_text, FRAME.frame_face, true),
    sg(' ', FRAME.frame_title_text, FRAME.frame_title),
    sg(' □ ', FRAME.frame_text, FRAME.frame_face, true),
    sg(' ', FRAME.frame_title_text, FRAME.frame_title),
    { ...sg(' × ', FRAME.frame_text, FRAME.frame_face, true), press: close, key: 'close' },
  ]
}

// The grey body: menu bar, the caption with the event count, then the log
// filling the rest.
function bodyRows(events: LogEvent[], w: number, rows: number): Row[] {
  const n = events.length
  // Less the menu bar, the caption, and the list box's two edges and header.
  const room = Math.max(1, rows - 5)
  return [
    menuBar(w),
    fit([sg(' Claude Session', FRAME.frame_text, FRAME.frame_face, true), sg(` - ${n} event(s)`, FRAME.frame_gray_text)], w),
    ...logBox(events, w - 2, room).map(r => fit([sg(' '), ...r], w)),
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
    const ev = startEvent(e, startedAt, agent)
    await update($, log, l => {
      const events = l.session === session ? l.events : []
      return { session, events: [...events, ev].slice(-MAX_EVENTS) }
    })
    // Settled inside the update: a read here would see the log as it stood
    // when this dispatch began, before tool.check kept the verdict on the row.
    const end = async (ran: Settled) => {
      const endedAt = await $.clock.now()
      await update($, log, l => l.session !== session ? l : {
        ...l,
        events: l.events.map(x => (x.id === ev.id ? { ...x, status: statusOf(ran, x.verdict), endedAt } : x)),
      })
    }
    try {
      const ran = await next(e)
      await end(ran)
      return ran
    } catch (err) {
      await end({ isError: true })
      throw err
    }
  })

  // The permission verdict, kept on the call's row: a deny there comes back
  // from the tool as an error, and the row shows it as denied.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (e.tool_use_id !== undefined) {
      const id = e.tool_use_id
      await update($, log, l => ({ ...l, events: settle(l.events, id, { verdict: verdict.decision }) }))
    }
    return verdict
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const [held, session] = await Promise.all([read($, log), $.session.id()])
    const events = held.session === session ? held.events : []
    const w = Math.max(60, e.props.bodyColumns)
    // A docked window fills the dock less its title bar and bottom edge.
    const rowCount = e.props.placement === 'dock' ? Math.max(6, e.props.scroll.bodyRows - 2) : INLINE_BODY_ROWS
    const rows = windowRows(w, bodyRows(events, w - 2, rowCount), () => $.ui.close({ id: PANE }))

    const drawSeg = (g: Seg) => (
      <Text color={g.fg} backgroundColor={g.bg} bold={g.b}>{g.t}</Text>
    )
    const drawRow = (r: Row) =>
      r.some(g => g.press)
        ? <Box flexDirection="row">
            {r.map(g => g.press
              ? <Button key={g.key} plain onPress={() => { void g.press!() }}>{drawSeg(g)}</Button>
              : drawSeg(g))}
          </Box>
        : <Text wrap="truncate">{r.map(drawSeg)}</Text>

    return <Box flexDirection="column">{rows.map(drawRow)}</Box>
  })
}
