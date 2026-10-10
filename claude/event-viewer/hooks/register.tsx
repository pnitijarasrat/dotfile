import type { Register } from 'claude-code'

// The Event Viewer (#83): a Win95 Frame window, opened by /event-viewer, that
// shows what Claude is doing in this session. Laid out as the prototype in
// #87 decided (variant B); this is the empty window: title bar, raised bevel,
// grey body.

const PANE = 'event-viewer'
const COMMAND = 'event-viewer'
const TITLE = 'Event Viewer - Claude Session'

// Frame roles (docs/theme-spec.md)
const C = {
  frame_face: '#C0C0C0',
  frame_highlight: '#FFFFFF',
  frame_dark_shadow: '#000000',
  frame_title: '#000080',
  frame_title_text: '#FFFFFF',
  frame_text: '#000000',
}

// Rows of an inline window's grey body; a docked one fills the dock.
const INLINE_BODY_ROWS = 12

// A Seg is a run of cells in one style; a Row is segs exactly one window wide.
type Seg = { t: string; fg: string; bg?: string; b?: boolean; press?: () => unknown; key?: string }
type Row = Seg[]

const sg = (t: string, fg = C.frame_text, bg: string | undefined = C.frame_face, b = false): Seg => ({ t, fg, bg, b })

function cut(t: string, n: number) {
  const chars = [...t]
  if (chars.length <= n) return t + ' '.repeat(n - chars.length)
  return chars.slice(0, Math.max(0, n - 1)).join('') + '…'
}

// Navy title bar with the caption buttons; only × does anything.
function titleBar(w: number, close: () => unknown): Row {
  const buttons = 10
  return [
    sg(cut(` ${TITLE}`, Math.max(0, w - buttons)), C.frame_title_text, C.frame_title, true),
    sg(' _ ', C.frame_text, C.frame_face, true),
    sg(' ', C.frame_title_text, C.frame_title),
    sg(' □ ', C.frame_text, C.frame_face, true),
    sg(' ', C.frame_title_text, C.frame_title),
    { ...sg(' × ', C.frame_text, C.frame_face, true), press: close, key: 'close' },
  ]
}

// Raised window: highlight on the left, dark shadow on the right and below,
// drawn with 1/8-cell lines so the bevel reads as one pixel.
function windowRows(w: number, bodyRows: number, close: () => unknown): Row[] {
  const iw = w - 2
  const edge = (r: Row): Row => [sg('▏', C.frame_highlight), ...r, sg('▕', C.frame_dark_shadow)]
  return [
    edge(titleBar(iw, close)),
    ...Array.from({ length: bodyRows }, () => edge([sg(' '.repeat(iw))])),
    [sg('▔'.repeat(w), C.frame_dark_shadow, undefined)],
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
    await $.ui.open({ id: PANE, title: 'Event Viewer', focus: true })
    return { text: 'Event Viewer opened.' }
  }).catch(() => ({ text: 'The Event Viewer could not open.' }))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const w = Math.max(40, e.props.bodyColumns)
    // A docked window fills the dock less its title bar and bottom edge.
    const bodyRows = e.props.placement === 'dock' ? Math.max(3, e.props.scroll.bodyRows - 2) : INLINE_BODY_ROWS
    const rows = windowRows(w, bodyRows, () => $.ui.close({ id: PANE }))

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
