# The Switch records the active Theme outside git, and tools load it over a committed default

A **Switch** is made with `theme <name>` (#133), which is `themes/theme.mjs` on PATH. It records the active **Theme** in `themes/active` and writes each tool's pointer to it, starting with Ghostty's `ghostty/active-theme` (`theme = <name>`). Both files are ignored by git. The committed configs still name the **Vintage theme** (`theme=vintage` in `ghostty/config`), so a fresh checkout works with no Switch made; `ghostty/config` loads `?active-theme` after itself, so the Switch's choice wins once it exists. Ghostty is reloaded with SIGUSR2, which recolors every open window.

ADR 0005 commits generated files so the repo works without running anything. The active Theme is different: it's a per-machine choice that changes often, not a change to any Theme. Committing it would turn every Switch into a diff.

## Considered options

- **Rewrite the `theme=` line in `ghostty/config`**: rejected; every Switch dirties a tracked file.
- **Commit `themes/active`**: rejected for the same reason, and two machines couldn't hold different Themes.
- **Read the active Theme back out of Ghostty's pointer**: rejected; the record would belong to one tool, and later tools join the same Switch.

## Consequences

- Until every themed tool has joined, a Switch to anything but Vintage mixes Themes: Ghostty shows the new one, the rest stay Vintage. That breaks ADR 0004's "tools never mix Themes" on purpose, for the tracer bullet; each later ticket adds a tool, and the rule holds again once the last one joins.
- `theme` with no name prints `themes/active`, or `vintage` before the first Switch, matching what the committed configs select.
- Each tool added to the Switch needs a committed default plus a git-ignored pointer the Switch writes, and a way to reload it live.
