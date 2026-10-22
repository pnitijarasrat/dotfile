# Chrome's Switch is a manual step the Switch prints

ADR 0006 has each tool load the active **Theme** from a pointer the Switch writes, and reloads it live. Chrome can't do either. A theme is an extension, and no supported route outside Chrome can install or apply one: `--load-extension` is gone from branded Chrome, the DevTools protocol's `Extensions.loadUnpacked` can't reach the real profile, extension settings in `Secure Preferences` are MAC-protected, and `chrome.management.setEnabled` needs a click in Chrome (`docs/research/chrome-theme-switch.md`, #137).

So `themes/generate.mjs` writes one theme extension per Theme, `chrome/<theme>-theme/manifest.json`, from `themes/templates/chrome-manifest.json`. Vintage's stays at `chrome/vintage-theme`, the folder already loaded, and is unchanged byte for byte. `theme <name>` prints the step that finishes the Switch: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick that folder. Chrome disables the theme it replaces and later uninstalls it, so the step is printed for every Theme, Vintage included.

## Considered options

- **One folder whose manifest the Switch rewrites**, then **Reload** on its card: one click instead of a file picker. Rejected: the folder is the loaded Vintage extension, so either a tracked file is dirtied on every Switch (ADR 0006's reason against rewriting configs) or a fresh checkout has no folder until the first Switch (ADR 0008's reason against a git-ignored file).
- **A helper extension with native messaging** that calls `chrome.management.setEnabled`: rejected; still a click in Chrome, a native host to install, and Chrome uninstalls the disabled themes it would enable.
- **Keep Chrome out of the Switch**, like Neovim (ADR 0007): rejected; Chrome is used every day and its Frame would clash with the other tools'.

## Consequences

- Each Switch leaves Chrome on the old Theme until the printed step is done. Chrome is the one tool that can mix Themes after a Switch (ADR 0004).
- The template's description describes Vintage, as VSCode's template does (ADR 0008).
- Chrome writes `Cached Theme.pak` into each loaded folder; git ignores it for every `chrome/*-theme`.
