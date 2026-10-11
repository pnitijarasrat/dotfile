import type { Log } from '../types'
import { categoryOf, clockOf } from './log.ts'

// The Display (#92): what Claude is doing now, read from the log's own state
// as #87 placed it: `RUNNING <tool>  <target>`, `THINKING <model>` or `IDLE`,
// and `WORKING <model>` for the rest of a model step, with the time that step
// has been going.

export type Readout = { word: 'RUNNING' | 'THINKING' | 'WORKING' | 'IDLE'; what: string; since?: number }

// A running call is the step, the latest one when several run at once; else
// the turn's phase; else idle. A step is timed from when it came on: when it
// began, or when the last call that outranked it settled, whichever is later.
export function displayOf(log: Log): Readout {
  const at = log.events.findLastIndex(ev => ev.status === 'running')
  // Calls after the running one outranked it; any call outranks the phase.
  const settled = Math.max(...log.events.slice(at + 1).map(ev => ev.endedAt ?? -Infinity))
  const from = (began: number) => Math.max(began, settled)
  const run = log.events[at]
  if (run) return { word: 'RUNNING', what: `${categoryOf(run.tool)}  ${run.target}`, since: from(run.startedAt) }
  const phase = log.phase
  if (phase?.kind === 'thinking') return { word: 'THINKING', what: phase.model ?? '', since: from(phase.since) }
  if (phase?.kind === 'working') return { word: 'WORKING', what: phase.model ?? '', since: from(phase.since) }
  return { word: 'IDLE', what: 'waiting for a prompt', since: phase && from(phase.since) }
}

// mm:ss, or hh:mm:ss from an hour; the leading digits up to the first that
// is not zero stay unlit, drawn as ghost 8s, and the last digit always lights.
export function elapsedOf(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000)
  const t = clockOf(s)
  const first = t.search(/[1-9]/)
  const split = first < 0 ? t.length - 1 : first
  return { ghost: t.slice(0, split).replace(/\d/g, '8'), lit: t.slice(split) }
}
