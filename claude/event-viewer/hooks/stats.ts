import type { SessionUsage, TurnUsage } from 'claude-code'

import { cells } from './cells.ts'
import { clockOf } from './log.ts'
import type { EventStatus, Log, Stats } from '../types'

// The Summary (#94): the session stats #88 agreed, in three columns of
// Tool calls, Model and Session. The counters are kept on the log, so they
// reset with it and outlast its row limit; Context, Cost and Session age are
// read from the session's usage on every draw and never stored.

export const NO_STATS: Stats = { done: 0, error: 0, denied: 0, turns: 0, busyMs: 0, subagents: 0, tokensIn: 0, tokensOut: 0 }

export const statsOf = (log: Log): Stats => log.stats ?? NO_STATS

// A call settling counts once, by its status; a running one is not settled.
export function tally(s: Stats, status: EventStatus): Stats {
  return status === 'running' ? s : { ...s, [status]: s[status] + 1 }
}

// What a step's response cost: cache reads are left out of Tokens in.
export function spent(s: Stats, usage: TurnUsage | null | undefined): Stats {
  if (!usage) return s
  return {
    ...s,
    tokensIn: s.tokensIn + usage.input_tokens + usage.cache_creation_input_tokens,
    tokensOut: s.tokensOut + usage.output_tokens,
  }
}

// A plain count under 1,000, then 182.4k, then 1.2M.
export function tokensOf(n: number) {
  if (n < 1000) return String(n)
  const k = (n / 1000).toFixed(1)
  return Number(k) < 1000 ? `${k}k` : `${(n / 1_000_000).toFixed(1)}M`
}

export const costOf = (usd: number) => `$${usd.toFixed(2)}`
export const percentOf = (p: number) => `${Math.round(p)}%`
const spanOf = (ms: number) => clockOf(Math.floor(Math.max(0, ms) / 1000))

// One figure: its label, and its value; undefined is not known yet.
export type Figure = { label: string; value?: string }

// Below this many cells a column takes the short labels, as it does when a
// long one would leave its value no room (` Label: value `).
const SHORT_BELOW = 18
const fits = (w: number) => (f: Figure) => cells(f.label) + cells(f.value ?? '-') + 4 <= w

// The three columns of figures, each column `w` cells wide.
export function summaryOf(log: Log, usage: SessionUsage | undefined, now: number, w: number): Figure[][] {
  const s = statsOf(log)
  const running = log.events.filter(ev => ev.status === 'running').length
  const busy = s.busyMs + (s.turnSince === undefined ? 0 : now - s.turnSince)
  const f = (label: string, short: string, value?: string) => ({ label, short, value })
  const percent = usage?.context.percent
  const cost = usage?.cost?.usd
  const columns = [
    [
      f('Tool calls', 'Calls', String(s.done + s.error + s.denied + running)),
      f('Done', 'Done', String(s.done)),
      f('Errors', 'Errors', String(s.error)),
      f('Denied', 'Denied', String(s.denied)),
      f('Running', 'Running', String(running)),
    ],
    [
      f('Turns', 'Turns', String(s.turns)),
      f('Busy time', 'Busy', spanOf(busy)),
      f('Subagents', 'Agents', String(s.subagents)),
      f('Tokens in', 'In', tokensOf(s.tokensIn)),
      f('Tokens out', 'Out', tokensOf(s.tokensOut)),
    ],
    [
      f('Context', 'Context', percent === undefined ? undefined : percentOf(percent)),
      f('Cost', 'Cost', cost === undefined ? undefined : costOf(cost)),
      f('Session age', 'Age', usage === undefined ? undefined : spanOf(now - usage.startedAt)),
    ],
  ]
  return columns.map(col => {
    const long = col.map(({ label, value }): Figure => ({ label, value }))
    return w >= SHORT_BELOW && long.every(fits(w)) ? long : col.map(({ short, value }): Figure => ({ label: short, value }))
  })
}
