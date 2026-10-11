import type { LogEvent } from '../types'
import { cellsOf } from './cells.ts'
import { ENVELOPE_KEYS } from './log.ts'
import type { Settled } from './log.ts'

// What the Event Properties panel shows of a call (#93): its input and its
// result, denial or error, kept on the call's row as text and wrapped to the
// panel's boxes, which scroll rather than cut it.

// The most of an input or result a row keeps: the log lives in session state
// and is written whole on every change. Past it the text says how much went.
export const MAX_TEXT = 20_000

export function keep(text: string) {
  if (text.length <= MAX_TEXT) return text
  return `${text.slice(0, MAX_TEXT)}\n… ${(text.length - MAX_TEXT).toLocaleString('en-US')} more characters not kept`
}

const json = (v: unknown) => {
  try {
    return JSON.stringify(v) ?? String(v)
  } catch {
    return String(v)
  }
}

// A call's arguments, one per line as `key: value`; a string of several lines
// goes under its key, indented.
export function inputOf(e: Record<string, unknown>) {
  return keep(Object.entries(e)
    .filter(([k]) => !ENVELOPE_KEYS.has(k))
    .map(([k, v]) => {
      if (typeof v !== 'string') return `${k}: ${json(v)}`
      if (!v.includes('\n')) return `${k}: ${v}`
      return `${k}:\n${v.split('\n').map(l => `  ${l}`).join('\n')}`
    })
    .join('\n'))
}

// What a settled call answered, by its status: the tool's result as the model
// read it; a denial's reason (the hook's, the rule's, else core's text); a
// failure's error.
export function outputOf(ran: Settled, ev: Pick<LogEvent, 'reason'>) {
  if (ran.deny !== undefined) return keep(ran.deny)
  const told = ran.text ?? (ran.result === undefined ? undefined : json(ran.result))
  if (ran.isError === true) return keep(ev.reason ?? told ?? 'The call failed.')
  return keep(told ?? '')
}

// The window a box of `lines` shows over `count` wrapped lines, asked to
// start at `at`: its first line and the last it can start at.
export function windowOf(count: number, at: number, lines: number) {
  const last = Math.max(0, count - lines)
  return { from: Math.min(Math.max(0, at), last), last }
}

// Lines of at most w cells: each line of the text, broken where it runs out.
export function wrap(text: string, w: number) {
  const out: string[] = []
  for (const line of text.replace(/\r/g, '').replace(/\t/g, '  ').split('\n')) {
    let at = ''
    let used = 0
    for (const ch of line) {
      const cw = cellsOf(ch)
      if (used + cw > w && at !== '') {
        out.push(at)
        at = ''
        used = 0
      }
      at += ch
      used += cw
    }
    out.push(at)
  }
  return out
}
