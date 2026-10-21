# dotfile

## Fonts

- **Work surface** (Ghostty, Neovim, VSCode): **JetBrains Mono NL**, Regular weight, installed into `~/Library/Fonts` (#78, `docs/adr/0003-jetbrains-mono-work-surface.md`). The fallback chain is JetBrains Mono NL → Menlo → Thonburi, written into each tool's config. Spotify (#80) is still being migrated.
- **Fixedsys Excelsior** (kika build, CC0), the old Work surface font, is kept in `fonts/` but unused once Spotify moves (#12). Run `./fonts/install.sh` to copy every font in `fonts/` into `~/Library/Fonts`. See `fonts/README.md` for its source and license.
- **SketchyBar** uses Microsoft Sans Serif and Tahoma Bold (for Start and the task button), both bundled with macOS. Its icons are PNGs in `sketchybar/icons/`, so it needs no Nerd Font.
- **Nerd Fonts:** none are needed. Hack, DejaVuSansM and Meslo were removed after #9. JetBrains Mono Nerd Font is still installed but unused (it was only for iTerm2, which is gone) and can be removed; keep the plain JetBrains Mono NL, which the Work surface uses.

## Themes

The **Vintage theme** is the first **Theme**. Its role values and fonts live in one place, the Vintage Theme source file `themes/vintage.json` (#131); `docs/theme-spec.md` names the roles and says where each goes. Every tool's Vintage test reads its expected values from the source file. Check the source file against the spec with `node themes/tests/vintage_test.mjs`.

## VSCode

VSCode's user settings live in `vscode/settings.json` (#18). Symlink them into place, moving any existing file aside first:

```sh
cd ~/Library/Application\ Support/Code/User
[ -e settings.json ] && [ ! -L settings.json ] && mv settings.json settings.json.pre-dotfile.bak
ln -sf ~/.config/vscode/settings.json settings.json
```

The editor font settings follow the Work surface fonts in `docs/theme-spec.md` and `themes/vintage.json`.

The color theme is a local extension, "Vintage", in `vscode/vintage-theme` (#19). Symlink it into VSCode's extensions folder, then reload VSCode (`Developer: Reload Window`). `settings.json` already selects it with `workbench.colorTheme`:

```sh
ln -sfn ~/.config/vscode/vintage-theme ~/.vscode/extensions/pnitijarasrat.vintage
```

Check the theme against `themes/vintage.json` and `docs/theme-spec.md` (palette, and the color keys the installed VSCode knows) with `node vscode/tests/vintage_test.mjs`.

## Ghostty

The terminal theme is a hand-written `vintage` theme in `ghostty/themes/vintage`, selected by `ghostty/config` (#13, #44). Starship, ccstatusline and ranger take their colors from it.

Check the theme and config against `themes/vintage.json` and `docs/theme-spec.md` with `node ghostty/tests/vintage_test.mjs`.

## Raycast

The launcher theme is "Vintage", in `raycast/vintage.rctheme.json` (#21). Raycast keeps its own copy of imported themes and can't read the file directly. Run `node raycast/import.mjs` to open the theme in Raycast (the same `raycast://theme` link as "Add to Raycast" on themes.ray.so), add it, then select **Vintage** in Settings → Appearance. Re-run it after changing the file. Custom themes need Raycast Pro.

Check the theme against `themes/vintage.json` and `docs/theme-spec.md` with `node raycast/tests/vintage_test.mjs`.

"Restart yabai" and "Restart skhd" are Script Commands in `raycast/scripts/` (#125). Check them with `node raycast/tests/scripts_test.mjs`.

## Chrome

The window theme is a local extension, "Vintage", in `chrome/vintage-theme` (#37). It also makes the New Tab page the flat teal Classic desktop (#38). Incognito windows keep Chrome's own dark look: Chrome doesn't apply themes there. Load it once: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick `~/.config/chrome/vintage-theme` (the file picker hides `.config`; press Cmd+Shift+. to show it, or Cmd+Shift+G to type the path). To reload after changing `manifest.json`, run **Load unpacked** on the same folder again. To go back to the default look, use **Reset to default** under Settings → Appearance → Theme.

Check the theme against `themes/vintage.json` and `docs/theme-spec.md` (palette, and the color keys the installed Chrome knows) with `node chrome/tests/vintage_test.mjs`.

## Claude Code

The **Event Viewer** mod lives in `claude/event-viewer` (#83, #90). `/event-viewer` opens it as a pane: a Win95 Frame window showing what Claude is doing in the session. Every terminal session (Ghostty, VS Code's integrated terminal) loads it from this folder, and saving a file reloads it. Name the folder once under `env` in `~/.claude/settings.json`, which isn't tracked here:

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.config/claude/event-viewer" }
```

Don't also copy or install it anywhere else (`~/.claude/dev-mods/`, a marketplace), or two copies load.

Check it with `claude plugin validate claude/event-viewer` and `claude plugin test claude/event-viewer`. Type-check it with `tsc -p claude/event-viewer` (TypeScript 5.4+) once a session has loaded it: the engine writes the types its `tsconfig.json` extends into `.claude-plugin/types/`, which git ignores.

## skhd and yabai

skhd reads `skhd/skhdrc` and yabai reads `yabai/yabairc` from their default search paths (`~/.config/skhd/skhdrc`, `~/.config/yabai/yabairc`), so neither needs a flag (#124). Don't keep a `~/.skhdrc` or `~/.yabairc`. Exactly one launchd agent runs each: `com.koekeishiya.skhd` and `com.asmvik.yabai`. skhd reloads its config on save. After changing `yabairc`, run `yabai --restart-service`. There are no restart Shortcuts: "Restart yabai" and "Restart skhd" are Raycast Script Commands in `raycast/scripts/` (#125). "Restart skhd" is also the fix when Shortcuts stop working under Secure Input.

The window Shortcuts follow the modifier scheme in #113:

| Verb | Chord |
|---|---|
| Focus window | ⌃⌘+hjkl |
| Swap window | ⌃⌥+hjkl |
| Resize window | ⌃⇧+hjkl |
| Zoom / float + center / balance | Hyper+F / T / E |
| Send the focused window to space N (you stay put) | ⇧⌘+1–0 |
| Finder: launch, focus or cycle | Hyper+D |

⇧⌘0 is space 10. Hyper+D runs `skhd/scripts/go.sh`: it opens Finder if it's closed, focuses it if it's open, and goes to its next window if it's already frontmost. There are no go-to-space Shortcuts and no apps pinned to spaces: switch spaces in Mission Control (#126), since the macOS Desktop N hotkeys always slide.

Check the bindings with `node skhd/tests/shortcuts_test.mjs`, and the script with `node skhd/tests/go_test.mjs` (stubbed, nothing on screen moves).

## macOS Shortcuts

`macos/hotkeys.sh` sets the Shortcuts macOS owns (#125). Do the Raycast checklist in `macos/README.md` first, then run it. `macos/README.md` lists the chords.
