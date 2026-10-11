import type { EventStatus, LogEvent } from '../types'

// The log's rows: what a tool call becomes, how it settles, and how each
// column reads it (#91, columns as #87 decided).

// The most calls a session's log keeps; older ones drop off the top.
export const MAX_EVENTS = 500

// What a tool's arguments are about, by the first of these it has: a file, a
// command, a pattern, a URL. Anything else shows its first string argument.
const TARGET_KEYS = ['file_path', 'notebook_path', 'command', 'pattern', 'url', 'query', 'skill', 'description', 'prompt']
export const ENVELOPE_KEYS = new Set(['tool', 'tool_use_id', 'agentId', 'requestMeta', 'consent'])

export function targetOf(e: Record<string, unknown>): string {
  const pick = (k: string) => (typeof e[k] === 'string' && e[k] !== '' ? (e[k] as string) : undefined)
  if (e.tool === 'Agent') {
    const type = pick('subagent_type') ?? 'general-purpose'
    return [type, pick('description')].filter(Boolean).join(': ')
  }
  const first = TARGET_KEYS.map(pick).find(Boolean)
    ?? Object.entries(e).find(([k, v]) => !ENVELOPE_KEYS.has(k) && typeof v === 'string')?.[1] as string | undefined
  return (first ?? '').replace(/\s+/g, ' ').trim()
}

export function startEvent(e: Record<string, unknown> & { tool: string; tool_use_id: string }, now: number, agent?: string): LogEvent {
  return {
    id: e.tool_use_id,
    tool: e.tool,
    target: targetOf(e),
    ...(agent === undefined ? {} : { agent }),
    status: 'running',
    startedAt: now,
  }
}

// Claude Code's error text for a call the person refused at the permission
// prompt; core hands that back as an errored result, not a deny.
const REFUSED = /doesn't want to proceed with this tool use/

export type Settled = { deny?: string; isError?: true; text?: string; result?: unknown }

// How a call settles: refused by a hook (deny), a permission rule (a deny
// verdict) or the person (their refusal), else failed or done.
export function statusOf(ran: Settled, verdict?: string): EventStatus {
  if (ran.deny !== undefined) return 'denied'
  if (ran.isError !== true) return 'done'
  if (verdict === 'deny' || REFUSED.test(ran.text ?? '')) return 'denied'
  return 'error'
}

export function settle(list: LogEvent[], id: string, patch: Partial<LogEvent>): LogEvent[] {
  return list.map(ev => (ev.id === id ? { ...ev, ...patch } : ev))
}

const TYPE: Record<EventStatus, string> = {
  done: '(i) Done',
  running: '(>) Running',
  denied: '(!) Denied',
  error: '(x) Error',
}

const two = (n: number) => String(n).padStart(2, '0')

export function timeOf(ms: number) {
  const d = new Date(ms)
  return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}

// Whole seconds as mm:ss, or hh:mm:ss from an hour.
export function clockOf(s: number) {
  return s < 3600 ? `${two(Math.floor(s / 60))}:${two(s % 60)}` : `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`
}

export function durationOf(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return clockOf(Math.round(ms / 1000))
}

// MCP tools read as `server:tool`.
export function categoryOf(tool: string) {
  return tool.startsWith('mcp__') ? tool.split('__').slice(1).join(':') : tool
}

// One row's cells, Type to Dur.; a running call has no duration yet.
export function columnsOf(ev: LogEvent) {
  return {
    type: TYPE[ev.status],
    time: timeOf(ev.startedAt),
    source: ev.agent ?? 'Claude',
    category: categoryOf(ev.tool),
    event: ev.target,
    dur: ev.endedAt === undefined ? '' : durationOf(ev.endedAt - ev.startedAt),
  }
}
