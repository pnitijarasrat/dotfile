// Running until the call settles; then done, denied (a hook, a rule or the
// person refused it) or error (the tool failed or was interrupted).
export type EventStatus = 'running' | 'done' | 'denied' | 'error'

// One tool call in the log. Times are $.clock.now() milliseconds: the call
// carries no duration of its own.
export type LogEvent = {
  id: string
  tool: string
  target: string
  // The subagent's type, for a call made in a subagent's loop.
  agent?: string
  status: EventStatus
  startedAt: number
  endedAt?: number
  // tool.check's verdict for the call, when one was seen, and a deny's reason.
  verdict?: 'allow' | 'ask' | 'deny'
  reason?: string
  // The call's arguments as text, and once it settles what it answered: its
  // result, a denial's reason or the error (#93). Absent on rows kept before.
  input?: string
  output?: string
}

// What the main loop's turn is doing outside its tool calls, since when:
// thinking while thinking streams, working on the rest of a model step, idle
// between turns. A running call in the log outranks it on the Display (#92).
export type Phase = { kind: 'idle' | 'thinking' | 'working'; since: number; model?: string }

// The Summary's counters for one session (#94), kept beside the log so its
// row limit can't cap them: settled calls by status (Total and Running come
// from these and the running rows), the main loop's completed turns and their
// time, with when the current one started, every subagent spawned, and every
// step's tokens.
export type Stats = {
  done: number
  error: number
  denied: number
  turns: number
  busyMs: number
  turnSince?: number
  subagents: number
  tokensIn: number
  tokensOut: number
}

// The log of one session: a log whose session is not the current one is empty.
// Absent stats are all zero.
export type Log = { session: string; events: LogEvent[]; phase?: Phase; stats?: Stats }

// The row whose Event Properties are open ('' for none), and how far its
// Input and Result boxes are scrolled.
export type Inspect = { id: string; input: number; output: number }

declare module 'claude-code' {
  interface PluginState {
    'event-viewer': { log: Log; inspect: Inspect }
  }
}
