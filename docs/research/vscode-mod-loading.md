# How Claude Code for VS Code loads a mod kept in this repo

Research for #86, part of map #83 (Win95 activity mod). Checked on 2026-10-10 against Claude Code **2.1.296** (CLI and the VS Code extension `anthropic.claude-code-2.1.296-darwin-arm64`, both installed on this machine).

## Short answer

- **The VS Code panel can't pass a flag**, so `--plugin-dir` is out unless you wrap the binary. The ways that do work are an env var (`CLAUDE_CODE_PLUGIN_DIRS`), a local directory marketplace plus an install, and a folder in `~/.claude/skills/`.
- **Recommended:** set `CLAUDE_CODE_PLUGIN_DIRS` (and `CLAUDE_CODE_PLUGIN_DIR_WATCH=1`) in `claudeCode.environmentVariables` in this repo's `vscode/settings.json`, which is already symlinked into VS Code. The mod then loads in place from `~/.config/<mod>` in every panel session. The setting is versioned here, and nothing outside VS Code is affected.
- **Blocker for #83:** in 2.1.296 the VS Code **chat panel** runs a mod's hooks but **draws nothing**. Panes, the band above the prompt and replaced rows don't appear. The mod's window only shows in the terminal: either `claudeCode.useTerminal: true` or `claude` in the integrated terminal. See "Drawing in VS Code" below. #83 needs a decision on this before any build work.

## Options

| Option | Works in the VS Code panel? | What it needs | Loads in place / hot reload | Versioned in this repo? |
| :- | :- | :- | :- | :- |
| **A. `CLAUDE_CODE_PLUGIN_DIRS` in `claudeCode.environmentVariables`** | Yes | One entry in `vscode/settings.json`: an absolute path to the mod folder. Claude Code 2.1.280 or later | In place. Hot reload needs `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` too (see below), otherwise `/reload-plugins` | Yes (`vscode/settings.json`) |
| **B. `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`** | Yes | One `env` entry in user Claude settings. It does **not** work from project or local settings | Same as A | No. `~/.claude/settings.json` isn't in this repo |
| **C. Local directory marketplace + install** | Yes. Install with `/plugins` in the panel or `claude plugin install` in a shell | `.claude-plugin/marketplace.json` in the repo with a relative `source`, then `claude plugin marketplace add ~/.config/<dir>` and `claude plugin install <mod>@<marketplace>` once. This writes `extraKnownMarketplaces` and `enabledPlugins` to `~/.claude/settings.json` | Read in place from the folder. Edits apply at the next session or on `/reload-plugins`. No file watching | Only the marketplace file. The install state lives in `~/.claude` |
| **D. Symlink into `~/.claude/skills/<mod>`** | Yes. It loads as `<mod>@skills-dir` in every session | `ln -sfn ~/.config/<mod> ~/.claude/skills/<mod>`, the same pattern as the README's Vintage theme symlink | In place. Watched in an interactive session. Unverified: that the skills dir follows a symlink, and how the headless panel session handles it | The link isn't. The folder is |
| **E. `--plugin-dir`** | No. The extension starts `claude` itself and has no setting for extra arguments. The only route is a `claudeCode.claudeProcessWrapper` script that adds the flag, which is a hack | A wrapper script | In place, watched | Wrapper could be |

All five load the same plugin folder. The folder needs `.claude-plugin/plugin.json`, `hooks/hooks.json` naming the module, and the hooks module.

### Evidence per option

**A/B, `CLAUDE_CODE_PLUGIN_DIRS`.**
- The bundled plugin-authoring reference says: "`CLAUDE_CODE_PLUGIN_DIRS` names the same folders where no flag can be given … one or more absolute paths (`~` allowed) separated by the platform's path-list separator, each loaded exactly as a `--plugin-dir`, taken from the process environment or the `env` block of `~/.claude/settings.json` (never a project's settings)". Source: `plugin-authoring/reference.md`, "Developing one".
- The docs agree and add "Requires Claude Code v2.1.280 or later". Sources: [env vars](https://code.claude.com/docs/en/env-vars), [Create a plugin → Load plugins from an environment variable](https://code.claude.com/docs/en/plugins/create#from-an-environment-variable), [Mods reference → Settings and environment variables](https://code.claude.com/docs/en/plugins/mods/reference#settings-and-environment-variables).
- The extension's `package.json` declares `claudeCode.environmentVariables` as `"type": "array"` of `{ name, value }`, `"scope": "machine"`, with the description "Environment variables to set when launching Claude".
  - Its `extension.js` copies each entry onto the env of the `claude` process it spawns, starting from `{...process.env}`.
  - `CLAUDE_CONFIG_DIR` is the only name it treats specially.
  - The docs' settings table says the same: "Set environment variables for the Claude process" ([VS Code → Extension settings](https://code.claude.com/docs/en/vs-code#extension-settings)).
- `~/.claude/settings.json` is "shared between the extension and CLI. Use it for … environment variables" ([VS Code → Configure settings](https://code.claude.com/docs/en/vs-code#configure-settings)). The `env` block applies "no matter how `claude` was launched" ([env vars](https://code.claude.com/docs/en/env-vars)). So B also reaches the panel, but it reaches every terminal session too.
- A plugin loaded this way has the id `<name>@inline`. If an installed copy has the same name, the inline one wins ([Plugin loading → Name conflicts](https://code.claude.com/docs/en/plugins/loading#name-conflicts)). Don't combine A with C or D.
- Its `userConfig` options are read from `pluginConfigs["<name>"]` or `pluginConfigs["<name>@inline"]` in settings (reference.md; types `PluginOptions`).

**Hot reload in the panel (A, B).**
- The extension runs `claude` headless over `--output-format stream-json --input-format stream-json` (seen in the 2.1.296 bundle).
- The reference says: "In an interactive session the folder is watched … a long-lived headless session (SDK, desktop) watches too when `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` is set the same way" ("Developing one").
- The env var docs: "Set to `1` to turn it on in non-interactive sessions as well" (2.1.287 or later).
- The extension doesn't set this variable itself. The name only appears in the bundle's env var tables.
- So add `CLAUDE_CODE_PLUGIN_DIR_WATCH=1` next to A to get reload-on-save in the panel. Otherwise run `/reload-plugins`. The panel behaviour is inferred from those sources and hasn't been tested.

**C, local directory marketplace.**
- "A plugin whose marketplace is a folder (`claude plugin marketplace add <folder>`) and whose entry there is a relative path … is read from that folder itself, never from the copy `claude plugin install` made: edit the folder, run `/reload-plugins`" (reference.md).
- The docs say the same: relative-path plugins "load in place … Your edits … take effect at the next session start or `/reload-plugins`, and you don't need to increase the version" ([Plugin loading → In-place and copied plugins](https://code.claude.com/docs/en/plugins/loading#in-place-and-copied-plugins)).
- `marketplace.json` needs `name`, `owner` and `plugins[{ name, source }]`. `source` is written from the marketplace root and can't contain `..` ([Create a marketplace](https://code.claude.com/docs/en/plugin-marketplaces)).
- The extension's **Manage plugins** dialog (`/plugins`) can add marketplaces and install: "Plugins and marketplaces you configure in the extension are also available in the CLI, and vice versa" ([VS Code → Manage plugins](https://code.claude.com/docs/en/vs-code#manage-plugins)).
- The `vscode://anthropic.claude-code/install-plugin` link doesn't accept a local path as `marketplace` (same page).
- This machine already uses the pattern: `~/.claude/plugins/known_marketplaces.json` has a `"source": "directory"` entry (`k12-teacher-skills`).

**D, skills directory.** "Claude Code loads any folder there that contains a `.claude-plugin/plugin.json` as a plugin in every session, with no flag and no install step" ([Create a plugin → Make a plugin load in every session](https://code.claude.com/docs/en/plugins/create#scaffold-a-plugin-that-loads-every-session)). The reference says such a plugin is watched like a `--plugin-dir` one. The only line about symlinks is "A plugin folder given as a link is watched at the folder the link names" (reference.md), which suggests links are followed. That isn't confirmed for `~/.claude/skills/` specifically.

**E, `--plugin-dir`.** The panel's launch arguments are built inside `extension.js`. The only setting that changes the command is `claudeCode.claudeProcessWrapper`: "Executable used to launch the Claude process. The bundled binary path is passed as an argument" ([VS Code → Extension settings](https://code.claude.com/docs/en/vs-code#extension-settings)).

## Drawing in VS Code (affects #83)

- The docs' **Where mods run** table has the row "The VS Code extension's chat panel | Hooks run: Yes | What the mod draws appears: **No**". The editor's integrated terminal is "Yes / Yes" ([Mods overview → Where mods run](https://code.claude.com/docs/en/plugins/mods/overview#where-mods-run)). The mods reference's render sites list only Terminal and Desktop.
- The types file for 2.1.296 does declare a `vscode` `RenderSurface` ("`vscode` Claude Code for VS Code. A remote surface asks over the wire (ui_render)") and a `vscode` element table (`Box`, `Text`, `Button`, `Input`, `Select`, `Svg`, `Link`, `Code`, `Markdown`; no `Client`).
- The installed extension 2.1.296 has no handler for that ask. Its `extension.js` and `webview/index.js` contain no `ui_render` or `ui_open`. The only `ui_*` requests it handles are `ui_copy`, `ui_prompt_fill`, `ui_prompt_read`, `ui_prompt_suggest` and `ui_read_selection`.
- Conclusion: the engine side exists, but the panel doesn't draw yet.
- Today the mod's window is visible in VS Code only through `claudeCode.useTerminal: true` (terminal mode runs the CLI in the integrated terminal, which is the `terminal` surface) or by running `claude` in the integrated terminal.
- Inferred and untested: whether terminal mode applies `claudeCode.environmentVariables`. The `claude` it starts reads `~/.claude/settings.json` either way.

## Recommendation

1. **Load it with option A.** Keep the mod at `~/.config/<mod>/` and add this to `vscode/settings.json`:

   ```jsonc
   "claudeCode.environmentVariables": [
     { "name": "CLAUDE_CODE_PLUGIN_DIRS", "value": "/Users/puriwat.n/.config/<mod>" },
     { "name": "CLAUDE_CODE_PLUGIN_DIR_WATCH", "value": "1" }
   ]
   ```

   Why A:
   - It fits the charting rule "VS Code surface only".
   - It lives in a file this repo already versions and symlinks.
   - It needs no install state in `~/.claude`.
   - It loads in place, so editing the repo is enough.

   Use an absolute path rather than `~`. The docs allow `~` in this variable, but an absolute path removes any doubt about the extension passing it through unexpanded. Reload the VS Code window after changing the setting.
2. **Fallback, if the mod should also load in terminal `claude`:** option C (a marketplace file in the repo plus a one-time install), or B. Don't combine any two of A, C and D, because same-named copies shadow each other.
3. **Before any build tickets, #83 has to settle where the window draws.** The panel draws nothing in 2.1.296, so either use terminal mode (`claudeCode.useTerminal: true`) or wait for the extension to answer `ui_render`.

## Not verified here

- Nothing was loaded or tested. This was a read-only investigation, with no config changes.
- Not confirmed: hot reload in the panel with `CLAUDE_CODE_PLUGIN_DIR_WATCH=1`, symlink following in `~/.claude/skills/`, and env passthrough in `useTerminal` mode.
- Each can be checked in about a minute once a mod folder exists. Run `claude plugin list` in a shell with the env var set, and `/plugin` in the session, which shows "1 mod active · <name>".
