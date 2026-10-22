# VSCode's Switch rewrites one line of its tracked settings.json

ADR 0006 has each tool load the active **Theme** from a git-ignored pointer over a committed default. VSCode can't: `settings.json` has no include, and it's tracked in the repo and symlinked into place. So `theme <name>` (#135) rewrites the one `workbench.colorTheme` line of `vscode/settings.json` to the Theme's name, and nothing else. The committed value is `Vintage`, so `theme vintage` leaves the file as committed.

The local extension in `vscode/vintage-theme` contributes every Theme's color theme under the Theme's name. `themes/generate.mjs` writes each color theme from `themes/templates/vscode-color-theme.jsonc`, which is Vintage's with each value a role name, and the extension's `package.json` from `themes/templates/vscode-package.json`.

Checked on VSCode 1.141 (#135): a running VSCode applies the `settings.json` change to open windows, so the Switch is live. A Theme newly added to `package.json` isn't seen until `Developer: Reload Window`; until then switching to it does nothing visible.

## Considered options

- **A git-ignored color theme file the extension always points at**: rejected; a fresh checkout has no such file until the first Switch, so VSCode would show no theme.
- **Keep VSCode out of the Switch**: rejected; VSCode is used every day, unlike Neovim (ADR 0007).

## Consequences

- Narrows ADR 0006's "each tool added to the Switch needs a committed default plus a git-ignored pointer": VSCode's committed default is its pointer.
- After a Switch away from Vintage, `git status` shows `vscode/settings.json` modified. Switch back to Vintage before committing other settings changes, or commit only the other hunks.
- After generating a new Theme, reload VSCode once before switching to it. The Switch can't tell what VSCode has loaded, so `theme <name>` prints that reminder for every Theme but Vintage, which is always there.
- The template's prose comments describe Vintage; other Themes reuse the same role mapping.
