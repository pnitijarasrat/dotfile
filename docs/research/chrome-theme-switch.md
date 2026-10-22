# Can a Switch change Chrome's theme without manual steps?

Research for [#137](https://github.com/pnitijarasrat/dotfile/issues/137) (Chrome joins the Switch).
Researched 2026-10-22 on this Mac: Google Chrome 155.0.8059.85, macOS 14.1, the Vintage theme loaded unpacked in `Profile 1`.

## TL;DR

- **No.** No supported route outside Chrome can make it apply a theme, so `theme <name>` prints the manual step: in `chrome://extensions` with **Developer mode** on, **Load unpacked** the Theme's `chrome/<theme>-theme`.
- Chrome keeps one theme. Installing a theme disables the previous one, and Chrome later uninstalls disabled themes, so every Switch needs the step, a Switch back to Vintage included.

## The mechanisms

### 1. `--load-extension` on the command line

Chrome 137 removed `--load-extension` from Google Chrome-branded builds. It still works in Chromium and Chrome for Testing ([chromium-extensions PSA, 2025-04-04](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY/m/S0ET5wPjCAAJ)). This Mac runs 155, so it's gone. It would also need Chrome to be quit and relaunched.

### 2. The DevTools protocol (`Extensions.loadUnpacked`)

CDP has an experimental `Extensions.loadUnpacked`, which "installs an unpacked extension from the filesystem similar to --load-extension CLI flags" ([Extensions.pdl](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Extensions.pdl)). It needs Chrome started with remote debugging, and since Chrome 136 `--remote-debugging-port` and `--remote-debugging-pipe` "will no longer be respected if attempting to debug the default Chrome data directory" ([Chrome blog](https://developer.chrome.com/blog/remote-debugging-port)). It could only theme a separate profile, not the one in use, and Chrome would still have to be relaunched.

### 3. Editing Chrome's preferences

The active theme is in `Preferences` (`extensions.theme`: `{ "id": …, "pack": "~/.config/chrome/vintage-theme" }`, read on this Mac). Installed extensions are in `Secure Preferences`. On this Mac, `protection.macs.extensions` holds MACs for `install`, `settings` and `ui`, so Chrome would treat a hand edit as tampering and reset it. Chrome would also have to be closed. Rejected.

### 4. An extension that switches themes

Chrome has no theme API for extensions. `browser.theme` is Firefox only. [`chrome.management.setEnabled`](https://developer.chrome.com/docs/extensions/reference/api/management) can enable a disabled theme, and enabling a theme applies it ([`ThemeService::OnExtensionLoaded`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/themes/theme_service.cc): "a) installing a new theme, b) enabling a disabled theme"). But:

- it "must be called in the context of a user gesture" and "may present the user with a native confirmation UI", so it's still a click in Chrome;
- the CLI would need a helper extension plus native messaging to reach it;
- the theme must still be installed, and Chrome uninstalls unused themes (below).

No `chrome.management` method installs an extension from a path.

### 5. Enterprise policy (`ExtensionInstallForcelist`)

Force-installing needs an extension packed as a CRX and served from an update URL. Vendor docs (for example [UiPath](https://docs.uipath.com/zh-CN/studio/standalone/latest/user-guide/chrome-extension-on-mac.md)) deliver the policy as an MDM configuration profile. This isn't confirmed against Google's own policy reference. Not pursued: a CRX server and a managed Mac are far heavier than one click.

## Why Vintage needs the step too

From [`theme_service.cc`](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/themes/theme_service.cc):

- After a new theme is built, `OnThemeBuiltFromExtension` calls `DisableExtension(previous_theme_id)`.
- `RemoveUnusedThemes` uninstalls every theme that isn't current and is either enabled or "disabled with reason DISABLE_USER_ACTION" (`UNINSTALL_REASON_ORPHANED_THEME`). It runs a few seconds after startup, and when the "undo" infobar's reinstaller goes away.

For an unpacked theme, uninstalling only removes it from `chrome://extensions`; the folder stays. Until the cleanup runs, re-enabling the old theme's card would also switch back, but Load unpacked always works.

Read from source, not observed on this Mac.

## Unconfirmed

- How long a disabled unpacked theme stays listed before the cleanup removes it.
- Whether Chrome's AppleScript `execute javascript` can reach `chrome://extensions`. Not tried: it needs **Allow JavaScript from Apple Events** turned on, which lets any local app script every open tab.
