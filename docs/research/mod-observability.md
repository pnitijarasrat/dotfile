# What a mod can observe about Claude's activity

Research for #84 (map #83, Win95 activity mod). Question: which mod-API events let a
mod see what Claude is doing, what each carries, and which of them can feed the
**Display** (current step + elapsed), the tool-call log (full input and result) and
session stats on the `vscode` surface, for the live session only.

## Sources

All from the `plugin-authoring` skill bundled with Claude Code **2.1.296**
(`/private/tmp/claude-501/bundled-skills/2.1.296/3f3f2ab6284fd040f2ee240c50353c99/plugin-authoring/`):

- `d.ts` = `types/claude-code.d.ts`, the build's own declaration of the API. The
  reference calls it the authority: "the declaration file is the authority, this
  note the map" (`reference.md:5`).
- `ref` = `reference.md`
- `examples/tool-call.ts`

The API is early access and changes between releases (`ref:5`). Line numbers below
are for this build. Regenerate and re-check them when the CLI updates.

## Short answer

- **Tool calls**: `tool.call` wraps every engine-run tool call: built-in, MCP, and
  calls made inside subagents (`agentId`). The hook gets the full input. Awaiting
  `next(e)` gives the full result, error or deny. It carries no duration, so
  elapsed time comes from `$.clock.now()` taken around `next`.
- **Model activity**: `turn.start` / `turn.step` (streaming: text, thinking,
  tool-call start and argument chunks, stop with usage) / `turn.complete`
  (`durationMs`, `usage`, `reason`).
- **Subagents**: `agent.spawn` (start, with type, description, prompt, model) and
  `turn.complete` with `agentId` (end). `$.agent.list()` gives status.
- **Prompts**: `prompt.submit`.
- **Stats**: `session.measure` (pushed) and `$.session.usage()` (pulled) give
  context fill, cost in USD and rate limits.
- **Not observable**: tool progress or partial output while a tool runs. Also
  missing: permission-wait time split from run time on `tool.call`, server-side
  tools as `tool.call`s, a `turn.start` for subagent runs, remote workflow agents,
  and anything that happened before the mod loaded except what the transcript
  read-back provides.

## How hooks observe

- A hook is `($, e, next)`. `next(e)` continues the chain and resolves to the
  event's result. An observer passes `e` through unchanged and returns what
  `next` resolved to (`ref:16-22`).
- The hook budget does not count a `next` or `$` call in flight (`ref:154`). An
  observer can therefore await a long tool call or a whole model response at no
  cost.
- A hook that throws is skipped and the chain continues (`ref:78`). A broken
  observer never blocks Claude. `claude plugin validate` will still list a
  `tool.call` / `prompt.submit` hook as a "gating hook" (`ref:66`). That is
  expected and not a warning.
- Hooks fire whether or not the pane is open. Collect events into `$.state`
  from the hooks, and let the pane read `$.state` while drawing. A read
  subscribes the pane, so `$.state.set` redraws it with no `$.ui.invalidate`
  (`ref:118`). `$.state` lasts for the session, which matches "live session
  only". Module variables are lost on hot reload (`ref:118`).
- Streaming events (`turn.step`, `process.spawn`) must be hooked with an async
  generator. `yield* next(e)` forwards the stream and evaluates to the result
  (`ref:28-30`, `d.ts:12179`).

## Event by event

### `tool.call`: every engine-run tool call

Declared at `d.ts:3962`. The doc comment says it "fires when the engine is about
to run a tool. Each `next(e)` runs the hooks beneath, then core (the permission
prompt, the tool itself)" (`d.ts:3951-3961`).

**Input**: `ToolCallInput = ToolCallEnvelope & AgentLoop & ToolRequestMeta` (`d.ts:12673`).

| Field | Meaning | Source |
|---|---|---|
| `tool` | Tool name: `Read`, `Bash`, `mcp__<server>__<tool>`. Discriminates the union, so `e.command` is typed after `e.tool === 'Bash'`. | `d.ts:12655-12661` |
| `tool_use_id` | The call's id, "the same at every event of the call". Use it as the log row key. | `d.ts:5995-5998` |
| *tool's own arguments* | Spread beside the fields above, e.g. `e.command`, `e.file_path`. This is the full input. | `d.ts:12655-12672` |
| `agentId?` | The loop the call runs in: a subagent's or teammate's id, absent on main. | `d.ts:194-204` |
| `requestMeta?` | Hook-settable MCP `_meta`. Not an input, so leave it out of the log. | `d.ts:13056-13073` |

- **MCP tools**: covered. `McpToolCallInput` is `tool: mcp__<server>__<tool>`,
  `tool_use_id`, plus loose arguments (`d.ts:5974-5999`). A mod reloaded from its
  folder also gets typed MCP inputs in `.claude-plugin/types/claude-code-mcp/`
  (`ref:44-47`).
- **Subagent tool calls**: covered. They raise their own `tool.call` with
  `agentId` (`d.ts:12763-12764`, "a subagent's tools raise their own
  `tool.call`"; `d.ts:194-204`).

**Result**: `ToolCallResult` (`d.ts:12709-12795`). Awaiting `next(e)` yields one of three arms:

- `{ deny }`: refused by a hook or managed policy. The model gets the text as an error.
- `{ result, text, ref, isReadOnly?, context? }`: answered. `result` is the tool's
  structured record, typed per built-in tool once `e.tool` is narrowed. `text` is
  "the result as the model reads it (text blocks joined), present whatever the
  tool" (`d.ts:12752-12758`).
- `{ isError: true, result, text }`: "the tool reported an error (it threw, was
  interrupted, or answered an error)" (`d.ts:12771-12775`).

For the log row, `text` is the uniform display string and `result` the structured
detail. `examples/tool-call.ts:229-236` shows the observe pattern: `await next(...)`,
inspect `ran.deny` / `ran.isError`, return `ran`.

**Start, end and duration**:

- Start is when the hook is entered.
- End is when `next(e)` resolves.
- There is no duration field. Take `await $.clock.now()` (`d.ts:3434-3440`)
  before and after `next`.
- That span includes the permission prompt, because `next` runs it
  (`d.ts:3953`). In VS Code a call waiting for approval therefore shows as "in
  progress". That is honest for a Display, but it is not pure execution time.

**Pure execution time** comes from a classic hook. `classic.PostToolUse` carries
`duration_ms`, documented as "Tool execution time in milliseconds. Excludes
permission-prompt and hook time" (`d.ts:7873-7884`). `classic.PostToolUseFailure`
carries the same plus `error` and `is_interrupt` (`d.ts:7859-7871`). Both have
`tool_use_id`, so they join to the `tool.call` row. Classic events fire "whether
or not any settings hook is configured" (`d.ts:1238-1244`). Base fields include
`agent_id` / `agent_type` inside subagents (`d.ts:832-860`).

**Denials**:

- A hook or managed deny shows up as the `{ deny }` arm.
- `classic.PermissionDenied` carries `tool_name`, `tool_input`, `tool_use_id`
  and `reason` (`d.ts:7487-7494`).
- The types do not say which result arm a *user* rejection at the permission
  prompt produces (`deny` or `isError`). **Unverified.** Check it empirically in
  the prototype.

### `turn.start`: a main-loop model turn begins

`d.ts:4453`. The input is `TurnStartInput { text, turnId }` (`d.ts:13382-13395`):

- `text` is the user's prompt as the turn proceeds, `""` for a continuation.
- `turnId` is the same id every `turn.step` and the `turn.complete` carry.

Observe only: "a different return changes nothing" (`d.ts:4453` comment).

Subagent runs raise **no** `turn.start`. Their steps and completion carry the id
(`d.ts:13302-13304`). Use `agent.spawn` as the subagent's start.

### `turn.step`: one model request, streaming

`d.ts:4462`. "Fires when the engine is about to send a model request of a turn,
main's or a subagent's (`e.agentId`); `next(e)` resolves to the whole response."

**Input** `TurnStepInput` (`d.ts:13438-13485`):

- `turnId` and `index`: the step's position in the turn, from 0.
- `model`: the resolved model.
- `effort?`
- `messageCount`: the size of the request. The messages themselves are not on
  the event (`d.ts:13431-13437`).
- `agentId?`: set inside a subagent's loop.

**Chunks** `TurnStepChunk` (`d.ts:13411`), yielded while the response streams:

| kind | Carries | Source |
|---|---|---|
| `text` | `index`, `text`: visible answer text as it arrives | `d.ts:13594-13605` |
| `thinking` | `index`, `text`: thinking "what the person sees of it live" | `d.ts:13611-13618` |
| `tool` | `index`, `id` (= `tool_use_id`), `name`: the model **begins** a tool call | `d.ts:13624-13636` |
| `input` | `index`, `json`: partial argument JSON for that tool block | `d.ts:13474-13489` |
| `stop` | `stopReason`, `usage` (tokens + model) | `d.ts:13581-13585` |
| `engine` | opaque. Pass it on unread. | `d.ts:13413-13426` |

**Result** `TurnStepResult` (`d.ts:13491-13539`):

- `answer`
- `toolUses[] { name, input }` (`d.ts:13641-13652`)
- `serverToolUses?`: tools the API ran itself, such as `advisor`
- `stopReason`
- `usage: TurnUsage | null`. `TurnUsage` is the four `ModelUsage` token counts
  plus `model` (`d.ts:13664-13669`, `d.ts:6431-6455`).

What this gives the Display:

- A model step "Thinking" or "Writing" phase, from the first chunk kind seen.
- The moment the model *starts* writing a tool call: `tool` chunk, before
  `tool.call` fires.
- Per-step token usage for stats.

To observe without altering the stream, use `async function* ($, e, next) { const
r = yield* next(e); ...; return r }`, or `for await` over `next(e)` to peek at
each chunk and `yield` it unchanged (`ref:30`).

### `turn.complete`: a turn ends (main or subagent)

`d.ts:4471`. The input is `TurnCompleteInput` (`d.ts:13284-13340`):

- `answer`
- `durationMs`: "Wall-clock length of the turn in milliseconds"
- `isAborted`
- `reason`: `'answer' | 'aborted' | 'refusal' | 'error'` (`d.ts:13338`)
- `refusal?`
- `turnId`
- `agentId?`: set for a subagent run. Each run of a subagent's loop is one turn.
- `usage?`: summed token counts plus the last model

This is the end of a subagent and the end of the main turn, which returns the
Display to idle.

### `agent.spawn`: a subagent is about to start

`d.ts:4098`. Input `AgentSpawnInput` (`d.ts:264-395`):

- `tool_use_id`: the Agent tool call. It joins to that call's `tool.call` row.
- `prompt` and `description`
- `subagentType`
- `model?` and `parentModel`
- `parentAgentId?`: nested spawns
- `background`, `fork`, `isTeammate?`, `name?`, `cwd?`
- `workflow?`

Result `AgentSpawnResult { model, agentId? }` (`d.ts:401-425`). `agentId` is "the
same string its loop's `tool.call` events carry as `agentId`".

Related sources:

- `$.agent.list()` returns `AgentInfo { id, description, type, status,
  parentId?, name? }` (`d.ts:3185-3194`, `d.ts:125-183`).
- `classic.SubagentStart { agent_id, agent_type }` and `classic.SubagentStop {
  agent_id, agent_type, last_assistant_message?, ... }` (`d.ts:12246-12265`).

The Agent tool call itself also goes through `tool.call` (`tool: 'Agent'`).

### `prompt.submit`: the user (or a plugin) submits a prompt

`d.ts:4110`. Input `PromptSubmitInput` (`d.ts:9059-9104`):

- `text`: pastes already expanded
- `attachments?`
- `context?`
- `turnId?`: present when typed over a running turn
- `wait`
- `origin`: user Enter, notification, peer or plugin

`next(e)` resolves once the prompt has entered and its turn has started, not
when the turn ends.

### `session.start` / `session.end`

- `session.start` (`d.ts:4341`, input `d.ts:11679-11694`): `{ cwd, surface,
  isInteractive }`. It fires once and is awaited before the first prompt, so it
  is the place to register the slash command and initialise state (`ref:157-162`).
- `session.end` (`d.ts:4434`, input `d.ts:11057-11075`): `{ reason, sessionId,
  resume }`.
- A `/clear` raises `session.end` with `reason: 'clear'` and **no**
  `session.start` (`ref:27`, `d.ts:11061-11064`). Reset the session's stats there.

### `session.measure` and `$.session.usage()`: usage figures

- `session.measure` (`d.ts:4422`, input `d.ts:11103-11130`) is pushed when
  something moves. It carries:
  - `context: { tokens?, window, percent? }` (`d.ts:10958-10985`)
  - `rateLimits[]`
  - `cost?: { usd }` (`d.ts:10988-10993`)
  - `changed: ('context'|'rateLimits'|'cost')[]` (`d.ts:14602`)
- `$.session.usage()` (`d.ts:2853`, `SessionUsage` `d.ts:11712-11741`) reads the
  same figures on demand. It adds `startedAt`, the session's start in
  `$.clock.now()` ms, which `/clear` resets. That gives the "session elapsed"
  stat directly.
- Also on demand: `$.session.model()`, `$.session.turns()` and `$.session.id()`
  (`d.ts:2794-2803`).

### `session.append`: every row the conversation keeps

`d.ts:4366`, input `d.ts:10574-10601`. It is raised once per stored row, in the
main conversation and every subagent's (`agentId`). Each row has:

- `door`: `prompt`, `response`, `tool-result`, `compaction`, `notice`, and others
- `origin`
- `message` in Messages-API blocks (`ref:137-141`)

The activity mod does not need it, because `tool.call` and `turn.*` are more
direct. It is the catch-all for compaction boundaries and notices. It never sees
progress rows (`ref:137`).

### `$.session.messages()`: read-back of the transcript

`d.ts:2778`. It returns `SessionMessage { role, text, toolUses, toolResults? }`
(`d.ts:11142-11160`). Each `ToolUseSummary` is `{ tool_use_id, tool, input,
result?, text?, isError? }` (`d.ts:13155-13185`). Pass `{ agentId }` for a
subagent's loop (`d.ts:13431-13437`).

There are no timestamps. It can backfill the log, without durations, for calls
made before the mod loaded or across a hot reload.

## What feeds what

### Display (current step + elapsed)

Keep a `current` value in `$.state` as `{ label, startedAt }`, plus a
`$.clock.every(1000, ...)` ticker started in `session.start` (`d.ts:3462-3471`)
so the elapsed seconds advance while nothing else changes. Possible labels, from
most to least specific:

1. A tool is running: `tool.call` entry to `next` resolution. Label: tool name
   plus a key argument (`Bash: <command>`, `Read <file_path>`). Prefix with the
   agent type when `agentId` is set.
2. The model is writing a tool call: `turn.step` `tool` chunk (`name`). This is
   optional and shows a brief "Preparing Edit…".
3. The model is thinking or writing: `turn.step` entry. The first `thinking` or
   `text` chunk refines it.
4. A subagent is running: between `agent.spawn` and that `agentId`'s
   `turn.complete`, labelled from `description` / `subagentType`.
5. Idle: after the main loop's `turn.complete` (no `agentId`). Optionally show
   the last `durationMs`.

Parallel tool calls and parallel subagents are possible, so "current" should be
a stack or set keyed by `tool_use_id` / `agentId`. The Display shows the most
recent entry.

### Tool-call log (rows with full input and result)

A single `tool.call` hook does it:

1. On entry, append a row `{ id: tool_use_id, tool, agentId, input: e minus
   reserved keys, startedAt }`.
2. Await `next(e)`.
3. Patch the row with `{ endedAt, outcome: deny | error | ok, text, result }`.
4. Return the result unchanged.

Optionally enrich it from `classic.PostToolUse` / `PostToolUseFailure`
(`duration_ms`, `is_interrupt`), joined on `tool_use_id`.

Size caveat for the inspector: a tree draws only the first 100,000 characters of
its texts and cuts the rest (`ref:130`). Large inputs and results (file reads,
diffs) should be shown in part, or held to a limit in `$.state`.

### Session stats

| Stat | Source |
|---|---|
| Tool calls total / by tool / errors / denials | counted in the `tool.call` hook |
| Time in tools | sum of `tool.call` spans, or of `PostToolUse.duration_ms` |
| Turns, and turn durations | `turn.complete` (`durationMs`, no `agentId`), or `$.session.turns()` |
| Model requests and tokens (in / out / cache read / cache write) | `turn.step` stop chunk or result `usage`, or `turn.complete.usage` |
| Model(s) used | `turn.step` `model`, `TurnUsage.model` |
| Subagents spawned / running | `agent.spawn`, `turn.complete` with `agentId`, `$.agent.list()` |
| Context fill %, cost USD, rate limits | `session.measure` / `$.session.usage()` |
| Session elapsed | `$.session.usage().startedAt` |
| Prompts submitted | `prompt.submit` |

## What is NOT observable (or only partly)

- **Tool progress.** There is no event for a running tool's interim output
  (Bash stdout as it streams, a subagent's live progress rows). `session.append`
  explicitly excludes progress rows (`ref:137`). Between `tool.call` entry and
  resolution a mod only knows the call is running.
- **Execution time vs. permission-wait time on `tool.call`.** The span from
  `tool.call` includes the permission prompt (`d.ts:3953`). Pure execution time
  comes only from `classic.PostToolUse(Failure).duration_ms` (`d.ts:7867`,
  `d.ts:7880`). There is no explicit "waiting for approval" event on the hook
  path; `tool.check` gives the verdict, not the wait.
- **User rejection vs. hook deny.** The `tool.call` result types do not say
  which arm a person's "No" at the permission prompt produces. This is
  unverified and needs to be checked empirically.
- **Server-side tools** (e.g. `advisor`) raise no `tool.call`, `tool.check` or
  classic hooks. They are visible only after the fact in
  `TurnStepResult.serverToolUses`, with start and end times (`d.ts:13515-13528, 13541-13570`).
  `WebSearch` is engine-run and does go through `tool.call` (`d.ts:13547`).
- **Subagent turn starts.** A subagent run raises no `turn.start`
  (`d.ts:13302-13304`). Use `agent.spawn` instead.
- **Remote / workflow agents.** A remote workflow agent has no local loop: "no
  `turn.complete`, loop event or `$.agent.list()` row carries its `agentId`"
  (`d.ts:350-356`, `d.ts:411-414`). Workflow agents are not in `$.agent.list()`
  (`d.ts:3190-3192`).
- **Subagents spawned by another plugin's `$.agent.spawn`** step past *that*
  plugin's hooks but are seen by every other hook (`d.ts:13466-13470`). They are
  fine for this mod.
- **The request body.** `turn.step` carries `messageCount`, not the messages or
  the system prompt (`d.ts:13431-13437`). The messages are reachable through
  `$.session.messages()`; the system prompt only through the `prompt.section` hooks.
- **History before the mod loaded.** Hooks do not replay. The only read-back is
  `$.session.messages()`, which has no timings and stores no `result` for a
  subagent's transcript (`d.ts:13170-13176`). History from other sessions is out
  of scope anyway (no `$.store`).
- **Redacted thinking.** `thinking` chunks are "what the person sees of it
  live" (`d.ts:13611-13618`). When the person sees no thinking, the mod sees none.

## Open items for the prototype

1. Confirm which `ToolCallResult` arm a user rejection at the VS Code permission
   prompt yields, and whether `classic.PermissionDenied` fires for it or only
   for auto-mode denials.
2. Confirm that `$.clock.every(1000)` writing `$.state` redraws the VS Code
   pane without visible cost (ticks redraw only the readers, `ref:118`).
3. Decide whether the Display needs the `turn.step` `tool` chunk ("preparing")
   at all, or whether `tool.call` alone is enough.
