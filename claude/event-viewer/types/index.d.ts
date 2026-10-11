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
  // tool.check's verdict for the call, when one was seen.
  verdict?: 'allow' | 'ask' | 'deny'
}

// The log of one session: a log whose session is not the current one is empty.
export type Log = { session: string; events: LogEvent[] }

declare module 'claude-code' {
  interface PluginState {
    'event-viewer': { log: Log }
  }
}
