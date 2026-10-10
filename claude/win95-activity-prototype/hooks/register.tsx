import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// PROTOTYPE for #87 (throwaway, fake data). Three Win95 looks for the
// activity window, switchable with `/activity-prototype a|b|c` or the bar
// under the window:
//   A  Task Manager: Display in a tab, Activity and Statistics as tabs,
//      Properties as a dialog over the window
//   B  Event Viewer: log on top, Summary stacked below, Display as the
//      status bar, Event Properties docked beside the log
//   C  CD Player: big Display up top with stat readouts, log as a
//      playlist, the row expands in place
// The real mod is built in #90-#94.

const NAME = 'win95-activity-prototype'
const PANE = 'activity-prototype'
const COMMAND = 'activity-prototype'
const variantState = atom({ plugin: 'win95-activity-prototype', key: 'variant' } as const, 'A')
const selectedState = atom({ plugin: 'win95-activity-prototype', key: 'selected' } as const, '')
const tabState = atom({ plugin: 'win95-activity-prototype', key: 'tab' } as const, 'log')
const tickState = atom({ plugin: 'win95-activity-prototype', key: 'tick' } as const, 0)

const VARIANTS = [
  { key: 'A', name: 'Task Manager' },
  { key: 'B', name: 'Event Viewer' },
  { key: 'C', name: 'CD Player' },
]

// Vintage theme roles (docs/theme-spec.md)
const C = {
  face: '#C0C0C0',
  hi: '#FFFFFF',
  light: '#E0E0E0',
  sh: '#808080',
  dk: '#000000',
  title: '#000080',
  titleText: '#FFFFFF',
  text: '#000000',
  gray: '#808080',
  win: '#FFFFFF',
  sel: '#000080',
  selText: '#FFFFFF',
  red: '#800000',
  green: '#008000',
  yellow: '#808000',
  blue: '#000080',
  lcd: '#000000',
  lit: '#00FFFF',
  ghost: '#008080',
}

// ---------------------------------------------------------------- fake data

type Status = 'done' | 'running' | 'denied' | 'error'
type Call = {
  id: string
  at: string
  tool: string
  target: string
  status: Status
  ms: number
  agent?: string
  input: string
  result: string
}

const BASE: Call[] = [
  { id: '1', at: '14:02:05', tool: 'Read', target: 'CONTEXT.md', status: 'done', ms: 12,
    input: '{\n  "file_path": "/Users/me/.config/CONTEXT.md"\n}',
    result: '1  # Dotfiles\n2\n3  Personal macOS configuration for the tools in ~/.config\n4  (plus VSCode, symlinked in).\n5\n6  ## Language\n... 48 lines' },
  { id: '2', at: '14:02:06', tool: 'Grep', target: '"Display" docs/', status: 'done', ms: 88,
    input: '{\n  "pattern": "Display",\n  "path": "docs/",\n  "output_mode": "files_with_matches"\n}',
    result: 'Found 3 files\ndocs/theme-spec.md\ndocs/adr/0002-display-surface.md\ndocs/web-theme.md' },
  { id: '3', at: '14:02:09', tool: 'Agent', target: 'Explore: find palette roles', status: 'done', ms: 41200,
    input: '{\n  "subagent_type": "Explore",\n  "description": "find palette roles",\n  "prompt": "Find every Frame role name used outside docs/theme-spec.md"\n}',
    result: 'frame_face, frame_title and frame_selection are used in sketchybar/color.sh,\nvscode/vintage-theme/themes/vintage.json and spicetify/Themes/Vintage/user.css.' },
  { id: '4', at: '14:02:11', tool: 'Read', target: 'docs/theme-spec.md', status: 'done', ms: 9, agent: 'Explore',
    input: '{\n  "file_path": "/Users/me/.config/docs/theme-spec.md"\n}',
    result: '1  # Theme spec\n2\n3  The locked Theme spec for the Vintage theme ...\n... 212 lines' },
  { id: '5', at: '14:02:14', tool: 'Grep', target: '"frame_" sketchybar/', status: 'done', ms: 61, agent: 'Explore',
    input: '{\n  "pattern": "frame_",\n  "path": "sketchybar/"\n}',
    result: 'sketchybar/color.sh:3:export frame_face=0xffc0c0c0\nsketchybar/color.sh:4:export frame_highlight=0xffffffff\n... 17 matches' },
  { id: '6', at: '14:02:51', tool: 'WebFetch', target: 'learn.microsoft.com/win95-colors', status: 'error', ms: 3100,
    input: '{\n  "url": "https://learn.microsoft.com/win95-colors",\n  "prompt": "List the system colors"\n}',
    result: 'Request failed with status code 404' },
  { id: '7', at: '14:03:02', tool: 'Edit', target: 'spicetify/user.css', status: 'done', ms: 25,
    input: '{\n  "file_path": "/Users/me/.config/spicetify/user.css",\n  "old_string": "--lcd: #00ffff;",\n  "new_string": "--lcd: #00FFFF; /* display_fg */"\n}',
    result: 'The file spicetify/user.css has been updated.' },
  { id: '8', at: '14:03:22', tool: 'Bash', target: 'git push --force', status: 'denied', ms: 1200,
    input: '{\n  "command": "git push --force",\n  "description": "Force-push the branch"\n}',
    result: 'Denied: the user answered No at the permission prompt.' },
  { id: '9', at: '14:03:40', tool: 'mcp__claude-in-chrome__navigate', target: 'localhost:5173', status: 'done', ms: 1400,
    input: '{\n  "url": "http://localhost:5173",\n  "tabId": 81234\n}',
    result: 'Navigated to http://localhost:5173 (Vite + React)' },
  { id: '10', at: '14:04:01', tool: 'Write', target: 'docs/research/lcd.md', status: 'done', ms: 14,
    input: '{\n  "file_path": "/Users/me/.config/docs/research/lcd.md",\n  "content": "# LCD research\\n..."\n}',
    result: 'File created successfully at: docs/research/lcd.md' },
  { id: '11', at: '14:04:10', tool: 'Bash', target: 'npm test --silent', status: 'running', ms: 0,
    input: '{\n  "command": "npm test --silent",\n  "description": "Run the test suite",\n  "timeout": 120000\n}',
    result: 'PASS  chrome/tests/vintage_test.mjs\nPASS  sketchybar/tests/color_test.sh\n\nTests: 41 passed, 41 total\nTime:  14.8 s' },
]

// The Display cycles through its three readings so you can see each one.
function phaseOf(tick: number) {
  const p = tick % 30
  if (p < 15) return { kind: 'RUNNING', secs: p + 3 }
  if (p < 22) return { kind: 'THINKING', secs: p - 15 }
  return { kind: 'IDLE', secs: p - 22 }
}

function callsAt(tick: number): Call[] {
  const phase = phaseOf(tick)
  return BASE.map(c =>
    c.status !== 'running' ? c
      : phase.kind === 'RUNNING' ? { ...c, ms: phase.secs * 1000 }
      : { ...c, status: 'done', ms: 17800 })
}

function statsAt(tick: number, calls: Call[]) {
  const n = (s: Status) => calls.filter(c => c.status === s).length
  return {
    calls: calls.length, done: n('done'), errors: n('error'), denied: n('denied'), running: n('running'),
    turns: 3, prompts: 3, subagents: 1, tokensIn: '182.4k', tokensOut: '12.1k',
    context: 42, cost: '$0.83', age: clock(23 * 60 + 41 + tick, true),
  }
}

// ---------------------------------------------------------------- text

function clock(secs: number, hours = false) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const two = (x: number) => String(x).padStart(2, '0')
  return hours ? `${two(h)}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`
}

function dur(c: Call) {
  if (c.ms < 1000) return `${c.ms}ms`
  if (c.ms < 60000) return `${(c.ms / 1000).toFixed(1)}s`
  return clock(Math.round(c.ms / 1000))
}

const STATUS_TEXT: Record<Status, string> = { done: 'Done', running: 'Running', denied: 'Denied', error: 'Error' }
const STATUS_FG: Record<Status, string> = { done: C.green, running: C.blue, denied: C.yellow, error: C.red }

function shortTool(t: string) {
  return t.startsWith('mcp__') ? t.split('__').slice(1).join(':') : t
}

function len(t: string) {
  return [...t].length
}

function cut(t: string, n: number) {
  if (n <= 0) return ''
  const chars = [...t]
  if (chars.length <= n) return t + ' '.repeat(n - chars.length)
  return chars.slice(0, Math.max(0, n - 1)).join('') + '…'
}

function right(t: string, n: number) {
  const l = len(t)
  return l >= n ? cut(t, n) : ' '.repeat(n - l) + t
}

function wrapLines(text: string, w: number, max: number) {
  const out: string[] = []
  for (const raw of text.split('\n')) {
    let line = raw
    while (len(line) > w) {
      out.push([...line].slice(0, w).join(''))
      line = [...line].slice(w).join('')
    }
    out.push(line)
  }
  if (out.length > max) return [...out.slice(0, max - 1), `… ${out.length - max + 1} more lines`]
  return out
}

// ---------------------------------------------------------------- cells

// A Seg is a run of cells in one style; a Span is segs that press together;
// a Row is spans exactly one block wide.
type Seg = { t: string; fg?: string; bg?: string; b?: boolean; u?: boolean }
type Span = { segs: Seg[]; press?: () => unknown; key?: string; hotkey?: string }
type Row = Span[]

const sg = (t: string, fg = C.text, bg = C.face, b = false): Seg => ({ t, fg, bg, b })
const sp = (...segs: Seg[]): Span => ({ segs })
const btn = (key: string, press: () => unknown, segs: Seg[], hotkey?: string): Span => ({ segs, press, key, hotkey })

function rowWidth(r: Row) {
  return r.reduce((a, s) => a + s.segs.reduce((b, g) => b + len(g.t), 0), 0)
}

// Pads or cuts a row to exactly w cells.
function fit(r: Row, w: number, bg = C.face): Row {
  const have = rowWidth(r)
  if (have < w) return [...r, sp(sg(' '.repeat(w - have), C.text, bg))]
  if (have === w) return r
  let room = w
  const out: Row = []
  for (const s of r) {
    if (room <= 0) break
    const segs: Seg[] = []
    for (const g of s.segs) {
      if (room <= 0) break
      const l = len(g.t)
      if (l <= room) { segs.push(g); room -= l } else { segs.push({ ...g, t: cut(g.t, room) }); room = 0 }
    }
    out.push({ ...s, segs })
  }
  return out
}

const blank = (w: number, bg = C.face): Row => [sp(sg(' '.repeat(w), C.text, bg))]

// 1/8-cell lines make a 1px-looking bevel around a block of rows.
function bevel(rows: Row[], w: number, kind: 'sunken' | 'raised', fill = C.face): Row[] {
  const [tl, br] = kind === 'sunken' ? [C.sh, C.hi] : [C.hi, C.dk]
  const top: Row = [sp(sg(' '), sg('▁'.repeat(w - 2), tl), sg(' '))]
  const bottom: Row = [sp(sg(' '), sg('▔'.repeat(w - 2), br), sg(' '))]
  return [
    top,
    ...rows.map(r => [sp(sg('▕', tl)), ...fit(r, w - 2, fill), sp(sg('▏', br))]),
    bottom,
  ]
}

// One-row push button: side lines only.
function pushButton(key: string, label: string, press: () => unknown, opts: { hotkey?: string; pressed?: boolean; bold?: boolean } = {}): Span {
  const face = opts.pressed ? C.light : C.face
  return btn(key, press, [
    sg('▕', opts.pressed ? C.dk : C.hi),
    { t: ` ${label} `, fg: C.text, bg: face, b: opts.bold },
    sg('▏', opts.pressed ? C.hi : C.dk),
  ], opts.hotkey)
}

function titleBar(w: number, title: string, onClose?: () => unknown, key = 'close'): Row {
  const close: Span = onClose
    ? btn(key, onClose, [sg(' × ', C.text, C.face, true)])
    : sp(sg(' × ', C.text, C.face, true))
  return [
    sp(sg(cut(` ${title}`, w - 10), C.titleText, C.title, true)),
    sp(sg(' _ ', C.text, C.face, true), sg(' ', C.titleText, C.title), sg(' □ ', C.text, C.face, true), sg(' ', C.titleText, C.title)),
    close,
  ]
}

function menuBar(w: number, items: string[]): Row {
  const segs: Seg[] = [sg(' ')]
  for (const it of items) {
    segs.push({ t: it.slice(0, 1), fg: C.text, bg: C.face, u: true }, sg(it.slice(1) + '  '))
  }
  return fit([sp(...segs)], w)
}

// Etched group box (Win95 frame around a set of fields).
function groupBox(label: string, rows: Row[], w: number): Row[] {
  const head = `─ ${label} `
  return [
    [sp(sg('┌', C.sh), sg('─ ', C.sh), sg(label + ' '), sg('─'.repeat(Math.max(0, w - 2 - len(head))), C.sh), sg('┐', C.hi))],
    ...rows.map(r => [sp(sg('│', C.sh)), ...fit(r, w - 2), sp(sg('│', C.hi))]),
    [sp(sg('└', C.sh), sg('─'.repeat(w - 2), C.hi), sg('┘', C.hi))],
  ]
}

// The Display: lit text over unlit ghost 8s, in a sunken bevel.
function lcdTime(secs: number): Seg[] {
  const t = clock(secs)
  const firstLit = t.search(/[1-9]/)
  const split = firstLit < 0 ? t.length - 1 : firstLit
  return [sg(t.slice(0, split).replace(/\d/g, '8'), C.ghost, C.lcd), sg(t.slice(split), C.lit, C.lcd, true)]
}

function displayStep(tick: number, calls: Call[]) {
  const phase = phaseOf(tick)
  const run = calls.find(c => c.status === 'running')
  if (phase.kind === 'RUNNING' && run) return { word: 'RUNNING', what: `${shortTool(run.tool)}  ${run.target}`, secs: phase.secs }
  if (phase.kind === 'THINKING') return { word: 'THINKING', what: 'claude-opus-5-5', secs: phase.secs }
  return { word: 'IDLE', what: 'waiting for a prompt', secs: phase.secs }
}

function lcdRow(w: number, left: Seg[], rightSegs: Seg[] = []): Row {
  const rw = rightSegs.reduce((a, g) => a + len(g.t), 0)
  const l = fit([sp(...left)], Math.max(0, w - rw - 1), C.lcd)
  return [...l, sp(...rightSegs), sp(sg(' ', C.lit, C.lcd))]
}

// ---------------------------------------------------------------- the log list

type Col = { title: string; w: number; get: (c: Call) => Seg }

function listBox(key: string, calls: Call[], cols: Col[], w: number, selected: string, select: (id: string) => unknown): Row[] {
  const inner = w - 2
  const fixed = cols.reduce((a, c) => a + c.w, 0)
  const flex = cols.map(c => (c.w === 0 ? Math.max(6, inner - fixed) : c.w))
  const fw = (i: number) => flex[i] ?? 6
  const header: Row = fit([sp(...cols.flatMap((c, i) => [sg(cut(` ${c.title}`, fw(i) - 1)), sg('▕', C.sh)]))], inner)
  const rows: Row[] = calls.map(call => {
    const isSel = call.id === selected
    const segs = cols.map((c, i) => {
      const g = c.get(call)
      return isSel ? sg(cut(` ${g.t}`, fw(i)), C.selText, C.sel) : { ...g, t: cut(` ${g.t}`, fw(i)), bg: C.win }
    })
    return fit([btn(`${key}-${call.id}`, () => select(isSel ? '' : call.id), segs)], inner, isSel ? C.sel : C.win)
  })
  return bevel([header, ...rows], w, 'sunken', C.win)
}

function treeTool(c: Call) {
  return c.agent ? `└ ${shortTool(c.tool)}` : shortTool(c.tool)
}

// ---------------------------------------------------------------- variants

type Ctx = {
  w: number
  tick: number
  calls: Call[]
  stats: ReturnType<typeof statsAt>
  selected: string
  tab: string
  select: (id: string) => unknown
  setTab: (t: string) => unknown
}

type Body = { rows: Row[]; overlay?: Row[] }

function statPairs(ctx: Ctx): [[string, string][], [string, string][], [string, string][]] {
  const s = ctx.stats
  return [
    [['Tool calls', String(s.calls)], ['Done', String(s.done)], ['Errors', String(s.errors)], ['Denied', String(s.denied)], ['Running', String(s.running)]],
    [['Turns', String(s.turns)], ['Prompts', String(s.prompts)], ['Subagents', String(s.subagents)], ['Tokens in', s.tokensIn], ['Tokens out', s.tokensOut]],
    [['Context', `${s.context}%`], ['Cost', s.cost], ['Session age', s.age]],
  ]
}

function pairRows(pairs: [string, string][], w: number): Row[] {
  return pairs.map(([k, v]) => fit([sp(sg(` ${k}:`), sg(right(v, Math.max(1, w - len(k) - 3))))], w))
}

function inspectorRows(call: Call, w: number, maxLines: number): Row[] {
  const field = (k: string, v: Seg) => fit([sp(sg(cut(` ${k}`, 12)), v)], w)
  const box = (text: string) => bevel(wrapLines(text, w - 4, maxLines).map(l => [sp(sg(` ${l}`, C.text, C.win))]), w, 'sunken', C.win)
  return [
    field('Tool:', sg(call.tool)),
    field('Target:', sg(call.target)),
    field('Status:', sg(STATUS_TEXT[call.status], STATUS_FG[call.status], C.face, true)),
    field('Started:', sg(call.at)),
    field('Duration:', sg(call.status === 'running' ? `${dur(call)} so far` : dur(call))),
    field('Agent:', sg(call.agent ?? 'main')),
    blank(w),
    fit([sp(sg(' Input'))], w),
    ...box(call.input),
    fit([sp(sg(call.status === 'denied' ? ' Reason' : call.status === 'error' ? ' Error' : ' Result'))], w),
    ...box(call.status === 'running' ? '(still running: no result yet)' : call.result),
  ]
}

// A: Task Manager
function variantA(ctx: Ctx): Body {
  const { w } = ctx
  const pw = w - 2
  const tabs: Row = fit([
    sp(sg(' ')),
    pushButton('tab-log', 'Activity', () => ctx.setTab('log'), { pressed: ctx.tab !== 'log', bold: ctx.tab === 'log', hotkey: 'a' }),
    pushButton('tab-stats', 'Statistics', () => ctx.setTab('stats'), { pressed: ctx.tab !== 'stats', bold: ctx.tab === 'stats', hotkey: 's' }),
  ], w)

  const step = displayStep(ctx.tick, ctx.calls)
  const display = bevel([
    lcdRow(pw - 4, [sg(` ${step.word.padEnd(9)}`, C.lit, C.lcd, true), sg(step.what, C.lit, C.lcd)], lcdTime(step.secs)),
    lcdRow(pw - 4, [sg(` TURN 03   CALLS ${String(ctx.stats.calls).padStart(2, '0')}   CTX ${ctx.stats.context}%`, C.ghost, C.lcd)], [sg(ctx.stats.cost, C.ghost, C.lcd)]),
  ], pw - 2, 'sunken', C.lcd)

  let panel: Row[]
  if (ctx.tab === 'log') {
    const list = listBox('a', ctx.calls, [
      { title: 'Tool', w: 18, get: c => sg(treeTool(c)) },
      { title: 'Target', w: 0, get: c => sg(c.target) },
      { title: 'Status', w: 10, get: c => sg(STATUS_TEXT[c.status], STATUS_FG[c.status]) },
      { title: 'Time', w: 9, get: c => sg(dur(c)) },
    ], pw - 2, ctx.selected, ctx.select)
    const props: Row = fit([
      sp(sg(' '.repeat(Math.max(0, pw - 2 - 30)))),
      pushButton('a-props', 'Properties...', () => ctx.select(ctx.selected || (ctx.calls[ctx.calls.length - 1]?.id ?? '')), { hotkey: 'o' }),
    ], pw - 2)
    panel = [...display, blank(pw - 2), ...list, blank(pw - 2), props]
  } else {
    const gw = Math.floor((pw - 2) / 2)
    const [a, b, c] = statPairs(ctx)
    const left = [...groupBox('Totals', pairRows(a, gw - 2), gw), ...groupBox('Session', pairRows(c, gw - 2), gw)]
    const rightRows = [...groupBox('Model', pairRows(b, gw - 2), gw)]
    // Task Manager's usage meter: the context bar as a Display.
    const meterW = gw - 6
    const lit = Math.round((meterW * ctx.stats.context) / 100)
    const meter = bevel([
      [sp(sg(' ', C.lit, C.lcd), sg('█'.repeat(lit), C.green, C.lcd), sg('▒'.repeat(meterW - lit), C.ghost, C.lcd))],
      fit([sp(sg(` CONTEXT ${ctx.stats.context}%`, C.lit, C.lcd, true))], meterW + 1, C.lcd),
    ], gw - 2, 'sunken', C.lcd)
    rightRows.push(blank(gw), [sp(sg(' Context usage'))], ...meter.map(r => fit([sp(sg(' ')), ...r], gw)))
    const h = Math.max(left.length, rightRows.length)
    const merged: Row[] = []
    for (let i = 0; i < h; i++) merged.push(fit([...(left[i] ?? blank(gw)), ...(rightRows[i] ?? blank(gw))], pw - 2))
    panel = [...display, blank(pw - 2), ...merged]
  }

  const statusField = (t: string, fw: number): Span[] => [sp(sg('▕', C.sh), sg(cut(` ${t}`, fw)), sg('▏', C.hi))]
  const status: Row = fit([
    ...statusField(`Calls: ${ctx.stats.calls}`, 12),
    ...statusField(`Errors: ${ctx.stats.errors}`, 12),
    ...statusField(`Context: ${ctx.stats.context}%`, 15),
    ...statusField(`Cost: ${ctx.stats.cost}`, 13),
  ], w)

  const rows: Row[] = [
    menuBar(w, ['File', 'Options', 'View', 'Help']),
    blank(w),
    tabs,
    ...bevel(panel, pw, 'raised').map(r => fit([sp(sg(' ')), ...r], w)),
    status,
  ]

  const call = ctx.calls.find(c => c.id === ctx.selected)
  if (!call) return { rows }
  const dw = Math.min(w - 6, 72)
  const close = () => ctx.select('')
  const dialog: Row[] = [
    titleBar(dw - 2, `${shortTool(call.tool)} Properties`, close, 'a-close'),
    ...inspectorRows(call, dw - 2, 8),
    fit([sp(sg(' '.repeat(dw - 2 - 9))), pushButton('a-ok', 'OK', close, { bold: true })], dw - 2),
  ]
  return { rows, overlay: bevel(dialog, dw, 'raised') }
}

// B: Event Viewer
function variantB(ctx: Ctx): Body {
  const { w } = ctx
  const call = ctx.calls.find(c => c.id === ctx.selected)
  const side = call && w >= 100
  const lw = side ? w - 46 : w
  const type = (c: Call): Seg =>
    c.status === 'error' ? sg('(x) Error', C.red)
      : c.status === 'denied' ? sg('(!) Denied', C.yellow)
      : c.status === 'running' ? sg('(>) Running', C.blue)
      : sg('(i) Done', C.text)
  const list = listBox('b', ctx.calls, [
    { title: 'Type', w: 13, get: type },
    { title: 'Time', w: 10, get: c => sg(c.at) },
    { title: 'Source', w: 9, get: c => sg(c.agent ?? 'Claude') },
    { title: 'Category', w: 14, get: c => sg(shortTool(c.tool)) },
    { title: 'Event', w: 0, get: c => sg(c.target) },
    { title: 'Dur.', w: 8, get: c => sg(dur(c)) },
  ], lw - 2, ctx.selected, ctx.select)

  const [a, b, c] = statPairs(ctx)
  const cw = Math.floor((lw - 4) / 3)
  const cols = [pairRows(a, cw), pairRows(b, cw), pairRows(c, cw)] as const
  const summaryRows: Row[] = []
  for (let i = 0; i < 5; i++) summaryRows.push(fit([...(cols[0][i] ?? blank(cw)), ...(cols[1][i] ?? blank(cw)), ...(cols[2][i] ?? blank(cw))], lw - 4))
  const summary = groupBox('Summary', summaryRows, lw - 2)

  const left: Row[] = [
    ...list.map(r => fit([sp(sg(' ')), ...r], lw)),
    ...summary.map(r => fit([sp(sg(' ')), ...r], lw)),
  ]

  let body: Row[] = left
  if (call) {
    const iw = side ? 45 : w - 2
    const idx = ctx.calls.findIndex(x => x.id === call.id)
    const go = (d: number) => ctx.select(ctx.calls[(idx + d + ctx.calls.length) % ctx.calls.length]?.id ?? '')
    const detail: Row[] = [
      [sp(sg(cut(' Event Properties', iw - 2), C.text, C.face, true))],
      ...inspectorRows(call, iw - 2, side ? 10 : 6),
      fit([
        sp(sg(' ')),
        pushButton('b-up', '↑', () => go(-1), { hotkey: 'k' }),
        pushButton('b-down', '↓', () => go(1), { hotkey: 'j' }),
        sp(sg(' '.repeat(Math.max(0, iw - 2 - 22)))),
        pushButton('b-ok', 'OK', () => ctx.select(''), { bold: true }),
      ], iw - 2),
    ]
    const panel = bevel(detail, iw, 'raised')
    if (side) {
      const h = Math.max(left.length, panel.length)
      body = []
      for (let i = 0; i < h; i++) body.push(fit([...(left[i] ?? blank(lw)), sp(sg(' ')), ...(panel[i] ?? blank(iw))], w))
    } else {
      body = [...left, ...panel.map(r => fit([sp(sg(' ')), ...r], w))]
    }
  }

  // Display as the status bar.
  const step = displayStep(ctx.tick, ctx.calls)
  const display = bevel([
    lcdRow(w - 4, [sg(` ${step.word.padEnd(9)}`, C.lit, C.lcd, true), sg(step.what, C.lit, C.lcd), sg(`   ${ctx.stats.calls} events`, C.ghost, C.lcd)], lcdTime(step.secs)),
  ], w - 2, 'sunken', C.lcd)

  return {
    rows: [
      menuBar(w, ['Log', 'View', 'Options', 'Help']),
      fit([sp(sg(' Claude Session', C.text, C.face, true), sg(`  -  ${ctx.stats.calls} event(s)`, C.gray))], w),
      ...body,
      ...display.map(r => fit([sp(sg(' ')), ...r], w)),
    ],
  }
}

// C: CD Player
function variantC(ctx: Ctx): Body {
  const { w } = ctx
  const step = displayStep(ctx.tick, ctx.calls)
  const runIdx = ctx.calls.findIndex(c => c.status === 'running')
  const track = String(runIdx >= 0 ? runIdx + 1 : ctx.calls.length).padStart(2, '0')
  const rw = 26
  const dw = w - rw - 3
  const big = bevel([
    lcdRow(dw - 2, [sg(` [${track}]`, C.lit, C.lcd, true)], [...lcdTime(step.secs), sg('  ', C.lit, C.lcd)]),
    lcdRow(dw - 2, [sg(` ${step.word}`, C.lit, C.lcd, true)]),
    lcdRow(dw - 2, [sg(` ${step.what}`, C.lit, C.lcd)]),
    lcdRow(dw - 2, [sg(` ${'8'.repeat(Math.max(0, dw - 6))}`, '#003838', C.lcd)]),
  ], dw, 'sunken', C.lcd)
  const readout = (k: string, v: string) =>
    bevel([lcdRow(rw - 2, [sg(` ${k}`, C.ghost, C.lcd)], [sg(v, C.lit, C.lcd, true)])], rw, 'sunken', C.lcd)
  const r1 = readout('CALLS', String(ctx.stats.calls).padStart(2, '0'))
  const r2 = readout('ERR/DENY', `${ctx.stats.errors}/${ctx.stats.denied}`)
  // Readouts are 3 rows each; drop the shared bevel rows so two stack in 4+2.
  const rightCol: Row[] = [...r1, ...r2]
  const top: Row[] = []
  for (let i = 0; i < Math.max(big.length, rightCol.length); i++) {
    top.push(fit([sp(sg(' ')), ...(big[i] ?? blank(dw)), sp(sg(' ')), ...(rightCol[i] ?? blank(rw))], w))
  }

  const disc: Row = fit([
    sp(sg(' Turns: ', C.gray), sg(String(ctx.stats.turns)), sg('   Subagents: ', C.gray), sg(String(ctx.stats.subagents)),
      sg('   Tokens: ', C.gray), sg(`${ctx.stats.tokensIn} / ${ctx.stats.tokensOut}`), sg('   Context: ', C.gray), sg(`${ctx.stats.context}%`),
      sg('   Cost: ', C.gray), sg(ctx.stats.cost), sg('   Age: ', C.gray), sg(ctx.stats.age)),
  ], w)

  // Playlist: the selected track opens in place.
  const lw = w - 4
  const listRows: Row[] = []
  ctx.calls.forEach((c, i) => {
    const isSel = c.id === ctx.selected
    const fg = isSel ? C.selText : C.text
    const bg = isSel ? C.sel : C.win
    const marker = c.status === 'running' ? '>' : ' '
    const segs: Seg[] = [
      sg(` ${marker}${String(i + 1).padStart(2, '0')}  `, isSel ? fg : C.blue, bg, true),
      sg(cut(treeTool(c), 16), fg, bg),
      sg(cut(` ${c.target}`, Math.max(6, lw - 2 - 6 - 16 - 10 - 9)), fg, bg),
      sg(right(dur(c), 8) + ' ', fg, bg),
      sg(cut(STATUS_TEXT[c.status], 9), isSel ? fg : STATUS_FG[c.status], bg),
    ]
    listRows.push(fit([btn(`c-${c.id}`, () => ctx.select(isSel ? '' : c.id), segs)], lw - 2, bg))
    if (isSel) {
      const pad = (r: Row) => fit([sp(sg('    ', C.text, C.win)), ...r], lw - 2, C.win)
      const sub = inspectorRows(c, lw - 8, 6).map(r => fit([sp(sg(' ', C.text, C.face)), ...r, sp(sg(' ', C.text, C.face))], lw - 6))
      for (const r of sub) listRows.push(pad(r))
      listRows.push(pad(fit([sp(sg(' '.repeat(Math.max(0, lw - 6 - 11)), C.text, C.win)), pushButton('c-close', 'Close', () => ctx.select(''))], lw - 6, C.win)))
    }
  })
  const playlist = bevel(listRows, lw, 'sunken', C.win)

  return {
    rows: [
      menuBar(w, ['Disc', 'View', 'Options', 'Help']),
      ...top,
      disc,
      fit([sp(sg(' Track:', C.text, C.face, true), sg(`  ${ctx.calls.length} calls this session`, C.gray))], w),
      ...playlist.map(r => fit([sp(sg('  ')), ...r], w)),
    ],
  }
}

const TITLES: Record<string, string> = {
  A: 'Claude Task Manager',
  B: 'Event Viewer - Claude Session',
  C: 'Claude Player',
}

// ---------------------------------------------------------------- hooks

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'PROTOTYPE #87: Win95 activity window looks (a, b or c)',
      argumentHint: 'a|b|c',
    })
    $.clock.every(1000, () => {
      void update($, tickState, n => (n ?? 0) + 1)
    })
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const want = e.args.trim().toUpperCase()
    if (VARIANTS.some(v => v.key === want)) {
      await update($, variantState, () => want)
      await update($, selectedState, () => '')
    }
    await $.ui.open({ id: PANE, title: 'Activity (prototype)', focus: true, columns: 104, rows: 40 })
    return { text: `Activity window prototype opened (variant ${want || 'as last shown'}).` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const [variant, selected, tab, tick] = await Promise.all([
      read($, variantState), read($, selectedState), read($, tabState), read($, tickState),
    ])
    const W = Math.max(60, e.props.bodyColumns)
    const iw = W - 2
    const calls = callsAt(tick)
    const ctx: Ctx = {
      w: iw, tick, calls, stats: statsAt(tick, calls), selected, tab,
      select: id => update($, selectedState, () => id),
      setTab: t => update($, tabState, () => t),
    }
    const body = variant === 'B' ? variantB(ctx) : variant === 'C' ? variantC(ctx) : variantA(ctx)

    // Window chrome: raised edges around the title bar and body.
    const edge = (r: Row): Row => [sp(sg('▏', C.hi)), ...fit(r, iw), sp(sg('▕', C.dk))]
    const windowRows: Row[] = [
      edge(titleBar(iw, TITLES[variant] ?? 'Claude Task Manager')),
      ...body.rows.map(edge),
      edge(blank(iw)),
      [sp(sg('▔'.repeat(W), C.dk, 'transparent'))],
    ]

    const drawSeg = (g: Seg) => (
      <Text color={g.fg} backgroundColor={g.bg === 'transparent' ? undefined : g.bg} bold={g.b} underline={g.u}>{g.t}</Text>
    )
    const drawRow = (r: Row) =>
      r.some(s => s.press)
        ? <Box flexDirection="row">
            {r.map(s => s.press
              ? <Button key={s.key} plain hotkey={s.hotkey} onPress={() => { void s.press!() }}>{s.segs.map(drawSeg)}</Button>
              : <Text>{s.segs.map(drawSeg)}</Text>)}
          </Box>
        : <Text wrap="truncate">{r.flatMap(s => s.segs).map(drawSeg)}</Text>

    const idx = Math.max(0, VARIANTS.findIndex(v => v.key === variant))
    const cur = VARIANTS[idx] ?? { key: "A", name: "Task Manager" }
    const setVariant = (k: string) => Promise.all([update($, variantState, () => k), update($, selectedState, () => '')])
    const step = (d: number) => setVariant(VARIANTS[(idx + d + VARIANTS.length) % VARIANTS.length]?.key ?? "A")

    return (
      <Box flexDirection="column">
        <Box flexDirection="column">
          {windowRows.map(drawRow)}
          {body.overlay && (
            <Box position="absolute" top={3} left={Math.max(2, Math.floor((W - (body.overlay[0] ? rowWidth(body.overlay[0]) : 0)) / 2))} flexDirection="column">
              {body.overlay.map(drawRow)}
            </Box>
          )}
        </Box>
        <Box flexDirection="row" marginTop={1} gap={1}>
          <Text inverse bold> PROTOTYPE #87 </Text>
          <Button key="proto-prev" hotkey="p" onPress={() => { void step(-1) }}>{'<'}</Button>
          <Text bold>{`${cur.key}  ${cur.name}`}</Text>
          <Button key="proto-next" hotkey="n" onPress={() => { void step(1) }}>{'>'}</Button>
          <Text dimColor>{`p/n or 1-3 to switch · /${COMMAND} a|b|c`}</Text>
          {VARIANTS.map((v, i) => (
            <Button key={`proto-${v.key}`} hotkey={String(i + 1)} plain onPress={() => { void setVariant(v.key) }}>
              <Text dimColor={v.key !== variant}>{String(i + 1)}</Text>
            </Button>
          ))}
        </Box>
      </Box>
    )
  })
}
