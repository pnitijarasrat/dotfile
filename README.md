# dotfile

## Fonts

- **Work surface** (Ghostty, Neovim, VSCode): **JetBrains Mono NL**, Regular weight, installed into `~/Library/Fonts` (#78, `docs/adr/0003-jetbrains-mono-work-surface.md`). The fallback chain is JetBrains Mono NL → Menlo → Thonburi, written into each tool's config. Spotify (#80) is still being migrated.
- **Fixedsys Excelsior** (kika build, CC0), the old Work surface font, is kept in `fonts/` but unused once Spotify moves (#12). Run `./fonts/install.sh` to copy every font in `fonts/` into `~/Library/Fonts`. See `fonts/README.md` for its source and license.
- **SketchyBar** uses Microsoft Sans Serif and Tahoma Bold (for Start and the task button), both bundled with macOS. Its icons are PNGs in `sketchybar/icons/`, so Vintage's taskbar needs no Nerd Font. Marigold's bar uses SF Pro's SF Symbols for its status icons, JetBrainsMonoNL Nerd Font for its labels, and `sketchybar-app-font` for its app icons (`fonts/sketchybar-app-font.ttf`, v3.0.13, which `fonts/install.sh` installs), with that release's `icon_map.sh` vendored as `sketchybar/icon_map.sh`.
- **Nerd Fonts:** only JetBrainsMonoNL Nerd Font, which the Marigold theme's Work surface and SketchyBar labels use. Hack, DejaVuSansM and Meslo were removed after #9. JetBrains Mono Nerd Font (not NL) is still installed but unused (it was only for iTerm2, which is gone) and can be removed; keep the plain JetBrains Mono NL, which Vintage's Work surface uses.

## Themes

The **Vintage theme** is the first **Theme**. Its role values and fonts live in one place, the Vintage Theme source file `themes/vintage.json` (#131); `docs/theme-spec.md` names the roles and says where each goes. Every tool's Vintage test reads its expected values from the source file. Check the source file against the spec with `node themes/tests/vintage_test.mjs`.

`node themes/generate.mjs` generates each tool's theme files from every Theme source file in `themes/` (#132); so far that's Ghostty's, VSCode's (#135), SketchyBar's Frame palette (#136), Chrome's theme extension (#137) and Starship's prompt (#154). Generated files are committed: don't edit them by hand. `node themes/tests/generate_test.mjs` fails if one is stale, and checks the generator against a small fixture Theme.

`theme <name>` makes a **Switch** (#133): `<name>` becomes the active Theme, and open Ghostty and VSCode windows, SketchyBar and JankyBorders recolor in place. Ghostty, VSCode (#135), SketchyBar, JankyBorders (#136) and the Starship prompt (#154) switch, the bar running the Theme's own layout or else Vintage's taskbar (#155), along with macOS's own appearance (#138). Chrome is a manual step (below), and Spotify, Raycast and the Claude Code Event Viewer stay Vintage under every Theme (#158, `docs/adr/0012-raycast-and-the-event-viewer-stay-vintage.md`, `docs/adr/0013-spotify-stays-vintage.md`). Each Theme's source file says whether macOS is light or dark and which accent and highlight color it uses (Vintage: light, Graphite, Blue), and the Switch sets all three in System Settings → Appearance. The first Switch asks to let your terminal control System Events; without it, the appearance doesn't change and the Switch says so (`docs/adr/0010-switch-sets-macos-settings-directly.md`). Neovim never joins: it keeps its own hand-written colorscheme (`docs/adr/0007-neovim-stays-out-of-the-switch.md`). `theme` with no name prints the active Theme; an unknown name changes nothing and lists the Themes in `themes/`. Put it on PATH once with `ln -sf ~/.config/themes/theme.mjs ~/.local/bin/theme`. It records the active Theme in `themes/active`, Ghostty's pointer in `ghostty/active-theme` and SketchyBar's (which JankyBorders shares) in `sketchybar/active-theme`, and Starship's in `starship/active-theme`, all ignored by git (`docs/adr/0006-switch-records-the-active-theme-outside-git.md`). VSCode has no include, so the Switch rewrites the `workbench.colorTheme`, `window.titleBarStyle` and `workbench.experimental.modernUI` lines of the tracked `vscode/settings.json` (#153), which shows as modified until you switch back to Vintage (`docs/adr/0008-vscode-switch-rewrites-its-tracked-settings.md`). Switching to any Theme but Vintage reminds you that VSCode needs `Developer: Reload Window` once if the Theme is new. A changed title bar shows after VSCode restarts, which it offers to do. Ghostty gives open windows a new shape (corners, title bar, opacity) only after it restarts, so a Switch while it runs says so; it never quits Ghostty itself (#184). No supported route outside Chrome can change its theme, so every Switch prints the step that does: Load unpacked the Theme's `chrome/<name>-theme` in `chrome://extensions` (`docs/adr/0009-chrome-switch-is-a-manual-step.md`). Check it with `node themes/tests/theme_test.mjs`, which also switches a copy of the repo to Marigold and back and checks every tool both ways (#158); the Marigold spec's Manual checklist (`docs/theme-spec-marigold.md`) covers what the real apps show.

`theme marigold` and `theme vintage` switch between the two real Themes. To watch a Switch to a Theme with nothing at stake, add the test fixture as a Theme for a moment:

```sh
cp ~/.config/themes/tests/fixtures/tiny.json ~/.config/themes/tiny.json
node ~/.config/themes/generate.mjs
# In VSCode, run Developer: Reload Window once so it sees the new Theme
theme tiny      # Ghostty, VSCode, SketchyBar and JankyBorders turn the fixture's cream and dark grey, a new prompt has icons; it prints Chrome's step
theme vintage
rm ~/.config/themes/tiny.json ~/.config/ghostty/themes/tiny ~/.config/sketchybar/themes/tiny.sh ~/.config/vscode/vintage-theme/themes/tiny-color-theme.json ~/.config/starship/themes/tiny.toml
rm -r ~/.config/chrome/tiny-theme
node ~/.config/themes/generate.mjs
```

## VSCode

VSCode's user settings live in `vscode/settings.json` (#18). Symlink them into place, moving any existing file aside first:

```sh
cd ~/Library/Application\ Support/Code/User
[ -e settings.json ] && [ ! -L settings.json ] && mv settings.json settings.json.pre-dotfile.bak
ln -sf ~/.config/vscode/settings.json settings.json
```

The editor font settings follow the Work surface fonts in `docs/theme-spec.md` and `themes/vintage.json`.

The color theme is a local extension, "Vintage", in `vscode/vintage-theme` (#19). It holds one color theme per Theme, generated by `themes/generate.mjs` (#135). Symlink it into VSCode's extensions folder, then reload VSCode (`Developer: Reload Window`). `settings.json` already selects it with `workbench.colorTheme`:

```sh
ln -sfn ~/.config/vscode/vintage-theme ~/.vscode/extensions/pnitijarasrat.vintage
```

Check each Theme's color theme against its Theme source file and `docs/theme-spec.md` (palette, and the color keys the installed VSCode knows) with `node vscode/tests/vintage_test.mjs`.

## Ghostty

The terminal theme is `ghostty/themes/vintage`, generated from `themes/vintage.json` (#132) and selected by `ghostty/config` (#13, #44) until the first Switch, which overrides it through `ghostty/active-theme` (#133). Each Theme gets its own `ghostty/themes/<name>`, which also sets the window's shape from the Theme's `rules` (#151): Vintage's is opaque and square, Marigold's translucent, blurred and rounded with no title bar. A Switch recolors open windows, but a new opacity needs Ghostty quit and reopened, and a new title bar style only reaches new windows. Starship, ccstatusline and ranger take their colors from it.

## Starship

Each Theme's prompt is `starship/themes/<name>.toml`, generated from its source file (#154): the same segments for every Theme, in named ANSI colors from Ghostty, with Nerd Font icons on the directory, branch and runtimes when the Theme's `rules.icons` allows them. Vintage's keeps `>` and words; Marigold's has icons. `starship.toml` is a link to Vintage's, so Starship shows it with no Switch made. To follow the Switch, start Starship from `~/.zshrc` with `source ~/.config/starship/init.zsh` in place of `eval "$(starship init zsh)"`: before each prompt it reads `starship/active-theme`, so a new prompt after `theme <name>` is that Theme's in every open shell.

Check each Theme's prompt, drawn by the installed Starship, with `node starship/tests/vintage_test.mjs`.

Check each Theme's Ghostty theme against its source file, and the config against `themes/vintage.json` and `docs/theme-spec.md`, with `node ghostty/tests/vintage_test.mjs`.

## SketchyBar and JankyBorders

The bar's Frame palette is `sketchybar/themes/vintage.sh`, generated from `themes/vintage.json` (#136) and loaded by `sketchybar/color.sh`, which JankyBorders' `borders/bordersrc` also sources. A Switch overrides it through `sketchybar/active-theme`; if that Theme's palette was never generated, the bar stays Vintage. Each Theme gets its own `sketchybar/themes/<name>.sh`, which ends with JankyBorders' style, width and colors from the Theme's `borders` and `rules` (#152): Vintage's square and 4 wide, Marigold's rounded and 2 wide with a marigold active border. A Switch reshapes the borders live.

The bar's layout is per-Theme too (#155, `docs/adr/0011-themes-can-reshape-a-tool.md`): `sketchybar/sketchybarrc` runs the active Theme's `sketchybar/layouts/<name>.sh`, or Vintage's XP taskbar, `sketchybar/layouts/vintage.sh`, when the Theme has no layout of its own or the bar stays Vintage. Marigold has its own (#156), `sketchybar/layouts/marigold.sh`: a floating, translucent bar at the top, its opacity and blur from the Theme's `bar` (#169) and its corners from its `rules` (generated into its palette as `bar_alpha`, `bar_blur` and `bar_radius`), its height and fonts from the `bar` too (#177: `bar_height` and the `bar_*_font`s), a window gap from the top and sides, in the shape chosen in #165 (#170): the spaces with their windows' app icons, the front app's icon and name, and SF Symbols in a Frame data color per status item, each item drawn by its own plugin in `sketchybar/plugins/marigold/` and highlighted under the mouse. Now playing sits in the center and CPU, memory, weather and language join the right (#171); clicking any status item opens its popup, one at a time, and moving the mouse off the bar and the popup closes it (SketchyBar can't see clicks elsewhere). Now playing's popup controls playback through `nowplaying-cli` and the volume popup switches outputs through `SwitchAudioSource` (both from Homebrew: `brew install nowplaying-cli switchaudio-osx`); the language popup lists and switches input sources through `sketchybar/plugins/marigold/input_sources.js`. Each display gets its own Marigold bar, listing only that display's spaces, and a bar hides while its display shows a full-screen window (#172): `sketchybar/plugins/marigold/spaces.sh` keeps an item for each of yabai's spaces on its display's bar, run again whenever yabai signals that spaces or displays changed. The layout adds those signals through `sketchybar/yabai_signals.sh`, and Vintage's removes them. Every other Theme runs the taskbar. A Switch's `sketchybar --reload` brings up the new Theme's layout. Each layout also sets yabai's top and bottom padding to clear its bar, through `sketchybar/yabai_padding.sh` (#166): Vintage's top 8 and bottom 38, Marigold's top 44 (its `y_offset` and height plus yabai's `window_gap`) and bottom 8. So the padding follows a Switch live, and `yabai/yabairc` sets only the left and right padding and the gap, then reloads the bar so a restarted yabai gets its padding back. If yabai isn't running, the bar still loads.

Check each Theme's palette against its source file, that it holds every role the bar and JankyBorders use, and each Theme's border options against its spec, with `node sketchybar/tests/vintage_test.mjs`. Check which layout the bar runs, that Vintage's taskbar makes the same calls as before layouts were per-Theme (`sketchybar/tests/fixtures/before.sketchybarrc`), and each layout's yabai padding against a stub `yabai`, with `node sketchybar/tests/layout_test.mjs`. Check Marigold's bar, its layout, colors and plugins, against its spec with `node sketchybar/tests/marigold_test.mjs`. Check that `sketchybar/icon_map.sh` and `fonts/sketchybar-app-font.ttf` come from the same release with `node sketchybar/tests/app_font_test.mjs` (#175).

## Raycast

The launcher theme is "Vintage", in `raycast/vintage.rctheme.json` (#21). Raycast keeps its own copy of imported themes and can't read the file directly. Run `node raycast/import.mjs` to open the theme in Raycast (the same `raycast://theme` link as "Add to Raycast" on themes.ray.so), add it, then select **Vintage** in Settings → Appearance. Re-run it after changing the file. Custom themes need Raycast Pro.

Check the theme against `themes/vintage.json` and `docs/theme-spec.md` with `node raycast/tests/vintage_test.mjs`.

"Restart yabai" and "Restart skhd" are Script Commands in `raycast/scripts/` (#125). Check them with `node raycast/tests/scripts_test.mjs`.

## Chrome

The window theme is a local extension, "Vintage", in `chrome/vintage-theme` (#37), generated from `themes/vintage.json` (#137); each Theme gets its own `chrome/<name>-theme`. It also makes the New Tab page the flat teal Classic desktop (#38). Incognito windows keep Chrome's own dark look: Chrome doesn't apply themes there. Load it once: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick `~/.config/chrome/vintage-theme` (the file picker hides `.config`; press Cmd+Shift+. to show it, or Cmd+Shift+G to type the path). To reload after regenerating `manifest.json`, run **Load unpacked** on the same folder again. A Switch can't change Chrome's theme: `theme <name>` prints the Load unpacked step for the Theme's folder, and you need it on every Switch, because Chrome uninstalls the theme it replaces. To go back to the default look, use **Reset to default** under Settings → Appearance → Theme.

Check each Theme's extension against its source file and `docs/theme-spec.md` (palette, and the color keys the installed Chrome knows) with `node chrome/tests/vintage_test.mjs`.

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

⇧⌘0 is space 10. Hyper+D runs `skhd/scripts/go.sh`: it opens Finder if it's closed, focuses it if it's open, and goes to its next window if it's already frontmost. Switching to space N is macOS's own Switch to Desktop N on ⌘1–0, set by hand in System Settings; nothing in this repo touches it. No apps are pinned to spaces.

Check the bindings with `node skhd/tests/shortcuts_test.mjs`, and the script with `node skhd/tests/go_test.mjs` (stubbed, nothing on screen moves).

## macOS Shortcuts

`macos/hotkeys.sh` sets the Shortcuts macOS owns (#125). Do the Raycast checklist in `macos/README.md` first, then run it. `macos/README.md` lists the chords.
