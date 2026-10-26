# Theme spec: Marigold theme

The locked **Theme spec** for the **Marigold theme**, the second **Theme**: a dark look, black with a marigold accent, where the **Frame** and **Work surface** are one family and the Frame sits one step above the Work surface. It has no **Display**. Vocabulary follows `CONTEXT.md`.

This is the hand-off document for giving a tool its Marigold look. Role names, and what each role is for, are the ones in the Vintage theme's spec (`docs/theme-spec.md`); this file says how Marigold fills them and what each tool does differently under Marigold. To build one tool, read this file and that tool's ticket.

Sources: design [#139](https://github.com/pnitijarasrat/dotfile/issues/139), mockup `docs/mockups/marigold.html`, Themes and the Switch `docs/adr/0004-themes-and-switching.md`, Themes that reshape a tool `docs/adr/0011-themes-can-reshape-a-tool.md`.

## Values

Every role's hex value lives in the Marigold **Theme source file**, `themes/marigold.json`. It has the same palettes and roles as `themes/vintage.json` except the Display palette, which Marigold doesn't have. Take values from the source file, not this spec. `docs/mockups/marigold.html` paints a mock desktop from the same values (copied, not read), with each role's contrast ratio.

The colors come from a reference image: its black fabric (`work_bg`), pale flower yellow (`ansi_11`, `syntax_string`), rose (`ansi_1`, `syntax_keyword`), pink hair tips (`ansi_9`), lavender shadows (`ansi_5`, `syntax_number`), golden hair (`syntax_constant`, `frame_data_orange`) and peach-white light (`work_fg`, `frame_text`). The accent, `frame_selection`, is the flower yellow pushed to a saturated marigold. The image has no green, cyan or blue, so sage (`ansi_2`), dusty teal (`ansi_6`) and periwinkle (`ansi_4`) are invented in the same soft, warm-leaning style. The image itself isn't kept in the repo.

## Frame palette

Flat, not bevelled: the Frame is one step lighter than the Work surface, and the roles Vintage uses for 3D bevels and title bars take flat equivalents, so every generator and tool works unchanged.

| Role | Marigold |
|---|---|
| `frame_face` | Frame surface, one step above `work_bg` |
| `frame_highlight` | hairline borders: the lit edge of panels and popups |
| `frame_light` | hover and selected rows (sidebar, completion list, menus) |
| `frame_shadow` | inactive window border, near-black, almost invisible |
| `frame_dark_shadow` | pure black, the deepest edge |
| `frame_title`, `frame_title_inactive` | the same as `frame_face`: title bars blend into the Frame |
| `frame_title_text` | active title text, `frame_text` |
| `frame_title_inactive_text` | inactive title text, dimmer than `frame_gray_text` |
| `frame_text` | warm peach-white |
| `frame_gray_text` | warm grey for secondary and disabled text |
| `frame_window` | fields and lists, sunk to `work_bg` |
| `frame_selection` | **marigold**, the accent: selected items, active space, focus ring, active window border |
| `frame_selection_text` | black on marigold |
| `frame_tooltip` | tooltips, the same as `frame_light` |
| `frame_desktop` | black: Chrome's New Tab page |
| `frame_desktop_text` | `frame_text` |

## Work surface palette

Dark: warm peach-white text on the image's black, with a marigold cursor. There's no light variant.

| Role | Marigold |
|---|---|
| `work_bg` | black |
| `work_fg` | warm peach-white |
| `work_cursor`, `work_cursor_text` | marigold block, black text |
| `work_cursorline` | barely warmer than `work_bg` |
| `work_selection`, `work_selection_text` | dark marigold-tinted background, `work_fg` text. Light text stays readable on it, so it's also VSCode's editor selection (see [Per tool](#per-tool)) |
| `work_line_number` | dim warm grey |
| `work_grid` | a step above `work_bg` |
| `work_popup_border` | `frame_highlight` |

### ANSI

`ansi_0` is a dark grey, not `work_bg`, so black text stays visible. Normal colors are the image's hues and the invented sage, teal and periwinkle. Brights are lighter versions of the same hues. `ansi_15` is a brighter white than `work_fg`. Every ANSI color except `ansi_0` and `ansi_8` reads as text on `work_bg`.

### Syntax roles

| Role | Marigold |
|---|---|
| `syntax_comment` | warm grey (not italic) |
| `syntax_keyword` | rose |
| `syntax_string` | flower yellow |
| `syntax_number` | lavender |
| `syntax_function` | marigold |
| `syntax_type` | periwinkle |
| `syntax_constant` | hair gold |
| `syntax_operator` | light warm grey |
| `syntax_error` | bright rose-red |
| `syntax_warning` | marigold |

## Frame data colors

The ANSI normal hues, which read on `frame_face` as well as on `work_bg`; `frame_data_orange` is hair gold.

## Display

None. Wherever Vintage draws a Display, Marigold uses Frame roles: the background is `frame_window`, lit text `frame_text`, and ghost segments and dim lines `frame_gray_text`. Spotify and the Event Viewer keep their Vintage Display: they stay out of Marigold (see [Out of scope](#out-of-scope)).

## Fonts

### Work surface

| Setting | Value |
|---|---|
| Font | **JetBrainsMonoNL Nerd Font**, the same face as Vintage's JetBrains Mono NL plus Nerd Font icons, installed into `~/Library/Fonts`. Fallback → Menlo → Thonburi |
| Ghostty | `font-size = 14` |
| VSCode | editor and terminal size 11, as Vintage |
| Ligatures | off, as Vintage |

### Frame

| Setting | Value |
|---|---|
| Font | **SF Pro** Regular 13, the macOS system font (installed) |
| Bold | **SF Pro Text Semibold** |

## macOS

From the source file's `macos`. A Switch sets them (`docs/adr/0010-switch-sets-macos-settings-directly.md`).

- `appearance`: `dark`.
- `accent`: `yellow`. macOS's yellow is the nearest preset to marigold, not an exact match.
- `highlight`: `yellow`.

## Theme rules

Marigold's own rules, in place of the Vintage theme's **Purist fidelity**. The source file's `rules` holds the values generators read: `opacity` 0.85, `blur` 20, `radius` 10, `icons` true (Vintage's are `1`, `0`, `0`, `false`).

- **Rounded corners** wherever the tool allows, at `radius`.
- **Translucency and blur** on the surfaces seen most: Ghostty and the SketchyBar bar. Every other tool stays opaque, VSCode included: it can't do this without patching. Role values are opaque; translucency is applied by `opacity` and `blur`. The SketchyBar bar takes its values from the source file's own `bar` block, set to match Ghostty's: `opacity` 0.85 and `blur` 20 (Vintage's `1` and `0`).
- **Drop shadows** on (`"shadows": true`).
- **Icons** allowed: SF Symbols for SketchyBar's status items, `sketchybar-app-font` for its spaces and front app, Nerd Font icons in the prompt. No emoji.
- No SIP-disabling or patching system files, as Vintage.

### Where popups go

As Vintage: menus and pickers are Frame (`frame_face`, `frame_text`, `frame_light` for the hovered row); inline code popups are Work surface (`work_bg` with a 1px `work_popup_border`), rounded and shadowed.

## Per tool

Which tools get a design of their own under Marigold, beyond colors, and which only take its colors. Nothing here is built yet, except where a row says so.

| Tool | Under Marigold | Status |
|---|---|---|
| **SketchyBar** | **own design** (prototype and decision: #165). One floating bar at the top, 28 high, 8 from the top and sides of the screen (yabai's `window_gap`), so windows sit 8 below it. `frame_face` at the bar's own `opacity` 0.85 with `blur` 20, matching Ghostty (the source file's `bar`, not `rules`), and the active window's ring (#183): a 1px border in JankyBorders' active color from the source file's `borders` (`frame_selection`), always that color whatever has focus, a hairline because a border as wide as the ring (2) reads heavier than it, with corners curved like the ring's outline, `rules.radius` plus `borders.width` (12: the windows' 10, the same as macOS Sonoma's window corners, plus the ring); no gap between items. Every highlight on the bar, the active space and the `frame_light` hover on the front app and status items, is one pill concentric with the bar (#186): 18 high, 5 in from the bar's edge so a dark gap shows inside its border, its corners the bar's radius less that inset (7), so it stays concentric if either changes. Left: the spaces, each its number and its windows' app icons (`sketchybar-app-font`), the active one marigold (`frame_selection` with `frame_selection_text`), the others `frame_gray_text`; then the front app, its icon and name. Center: now playing. Right, left to right: CPU, memory, weather, language, volume, Wi-Fi, battery, clock. Every status item has an SF Symbol at 13 in its own **Frame data color** (now playing magenta, CPU cyan, memory orange, weather yellow, language cyan, volume magenta, Wi-Fi blue, battery green, `frame_data_red` below 20% unless charging, clock yellow) and a label in JetBrainsMonoNL Nerd Font 13. Hovering any item highlights it `frame_light`. Clicking a status item opens its popup (Frame, as [Where popups go](#where-popups-go), with a grey 1px `frame_highlight` hairline and the bar's radius; its rows highlight in the pill's radius); Wi-Fi's is the Wi-Fi menu. Clicking a space focuses it; clicking the front app does nothing. The bar hides while the front window is full screen; the auto-hidden macOS menu bar slides down over it; each display has its own bar showing its own spaces. yabai's padding is per-Theme, set by the layout: under Marigold top 44 (8 + 28 + 8) and bottom 8, Vintage keeps top 8 and bottom 38. Its layout is per-Theme: Vintage keeps the XP taskbar | first bar **built** in `sketchybar/layouts/marigold.sh` (#156), on the per-Theme layout (#155), with its plugins in `sketchybar/plugins/marigold/`. The #165 design is partly built: SF Symbols characters, generated into `sketchybar/sf_symbols.sh` by matching each symbol AppKit draws by name against SF Pro's characters (#168); the shape above for spaces, front app, clock, battery, Wi-Fi and volume (#170), the app icons from `sketchybar/icon_map.sh`, vendored from the release of `sketchybar-app-font` in `fonts/` (v3.0.13, #175, which has Ghostty's and Raycast's own glyphs, so no app is special-cased), and each plugin highlighting its item through `plugins/marigold/hover.sh`. Now playing, CPU, memory, weather and language, and every status item's popup, are **built** (#171): `plugins/marigold/popup.sh` opens one popup at a time, filled by `plugins/marigold/popups/<item>.sh` as it opens, from rows in `plugins/marigold/popup_rows.sh`; moving the mouse off the bar and the popup closes it, as SketchyBar can't see clicks outside its own windows. Wi-Fi's popup is rebuilt in the background by `plugins/marigold/wifi_scan.sh`, as Vintage's is, from the scan both share in `plugins/wifi_networks.sh`; weather and language share Vintage's fetch and input source (`plugins/weather_data.sh`, `plugins/input_source.sh`). Full screen and per-display are **built** (#172): the bar is `display=all` with `show_in_fullscreen=off`, so SketchyBar hides a display's bar while that display shows a native full-screen space and shows it again after; a yabai zoom-fullscreen window (hyper-f) stays clear of the bar, so the bar stays (see [Deviations](#deviations)). `topmost=window` is the floating window level, under the menu bar's. `plugins/marigold/spaces.sh` keeps an item for each yabai space that isn't full screen, set to that space's display, adding, removing and moving items when yabai signals (through `sketchybar/yabai_signals.sh`) that spaces or displays changed; spaces past the tenth show their whole number. Without yabai it shows spaces 1 to 10, as before. A Switch to Vintage removes the signals. yabai's padding is **built** (#166): each layout sets it through `sketchybar/yabai_padding.sh`. The bar's own opacity and blur are **built** (#169): `bar_alpha` and `bar_blur` generated into `sketchybar/themes/marigold.sh` from the source file's `bar`. The ring is **built** (#183): `bar_border_color` generated from `borders.active`, and `bar_radius` from `rules.radius` plus `borders.width` (0 for a square Theme). The pill is **built** (#186): `plugins/marigold/pill.sh` holds its inset and works out its radius from `bar_radius` (0 for a square bar), for the layout's items and the popups' rows, and the layout its height from the bar's |
| **Ghostty** | **own design.** `background-opacity` from `opacity`, `background-blur` from `blur`, `macos-titlebar-style = hidden` (rounded window corners, no title bar) in place of Vintage's `window-decoration = none` | theme and window settings generated (`ghostty/themes/marigold`, #151). A Switch recolors open windows and gives them the new blur, but Ghostty only applies a new `background-opacity` after a full restart (Cmd+Q), and a new `macos-titlebar-style` only to windows opened after the Switch. A Switch while Ghostty is running prints a note that open windows keep their old corners, title bar and opacity until Ghostty is quit (Cmd+Q) and reopened; it never quits Ghostty itself, so no session is lost (#184) |
| **VSCode** | **own design.** The Switch's settings rewrite (`docs/adr/0008-vscode-switch-rewrites-its-tracked-settings.md`) sets `workbench.experimental.modernUI: true` (floating, rounded parts) and the native title bar, in place of Vintage's custom one, from the source file's `vscode.modern_ui` and `vscode.title_bar`. The modern UI changes live; the title bar needs a VSCode restart, which VSCode offers when the setting changes. Opaque. The editor selection Vintage paints `ansi_11` uses `work_selection` instead: under Marigold `ansi_11` is pale yellow, and light token colors can't be read on it. Matches on a selected row must stand out from `work_selection`, so the matched letters on the selected completion row are `frame_selection` (marigold, about 7.5:1 on `work_selection`), and the match highlights in the peek view's results list are `frame_dark_shadow` (black: about 1.7:1 against `work_selection`, and every token color and `work_selection_text` reads on it at 4.4:1 or better) | color theme generated, its selection `work_selection` from the source file's `vscode.selection` (#150), its matched completion letters `frame_selection` from `vscode.completion_match` and its peek result match highlights `frame_dark_shadow` from `vscode.peek_match` (#160); modern UI and title bar set by the Switch (#153) |
| **JankyBorders** | **own design.** `style=round`, width 2, active `frame_selection` (marigold), inactive `frame_shadow` (near-black) | style, width and colors generated into `sketchybar/themes/marigold.sh` from the Theme source file's `borders` and `rules.radius` (#152); a Switch hands them to the running `borders` |
| **Starship** | **own design.** The same segments, with Nerd Font icons (directory, branch, runtime). Starship joins the Switch with one config per Theme; Vintage's keeps `>` and no icons | **built**: `starship/themes/<theme>.toml` generated from the Theme source file's `rules.icons`; `starship/init.zsh` reads the Switch's `starship/active-theme` before each prompt (#154) |
| **Spotify** | stays Vintage, out of the Switch (#158, `docs/adr/0013-spotify-stays-vintage.md`): its Spicetify "Vintage" theme, Media Rack and Display under every Theme | nothing to build |
| **Claude Code** (Event Viewer) | stays Vintage, out of the Switch (#158, `docs/adr/0012-raycast-and-the-event-viewer-stay-vintage.md`): its Win95 window and Display under every Theme | nothing to build |
| **Raycast** | stays Vintage, out of the Switch (#158, `docs/adr/0012-raycast-and-the-event-viewer-stay-vintage.md`): its "Vintage" theme stays selected under every Theme | nothing to build |
| **Chrome** | colors only. The generated "Marigold" extension, with the New Tab page `frame_desktop` black | generated (`chrome/marigold-theme/manifest.json`) |
| **macOS** | dark, yellow accent, yellow highlight | follows the Switch already |
| **ccstatusline**, **ranger**, **litecli** | no change: they inherit Ghostty's ANSI colors | nothing to build |
| **Neovim** | stays out of the Switch (`docs/adr/0007-neovim-stays-out-of-the-switch.md`): it shows Vintage's dark colorscheme whatever Theme is active | nothing to build |

## Manual checklist

Things the tests can't see, checked by hand on the Mac (#158). `node themes/tests/theme_test.mjs` checks what each tool reads after a Switch, both ways, and that a round trip leaves the repo as committed; this checks that each real app shows it. Start on Vintage with Ghostty, VSCode and Chrome open, then run `theme marigold` in Ghostty.

### `theme marigold`

- **The Switch**: it exits without an error, prints Chrome's Load unpacked step for `chrome/marigold-theme`, and the first time, VSCode's Reload Window reminder
- **Ghostty**: open windows turn black with peach-white text and a marigold block cursor. Quit (⌘Q) and reopen: the window is translucent and blurred, rounded, with no title bar
- **Starship**: the next prompt in every open shell has Nerd Font icons on the directory and branch
- **ccstatusline**, **ranger**, **litecli**: their colors are Ghostty's new ANSI colors (rose, sage, flower yellow), with no change of their own
- **SketchyBar**: the XP taskbar is gone and one floating, translucent bar sits 8 from the top and sides, with a 1px marigold border whose corners match the active window's ring, with the shape in [Per tool](#per-tool): spaces with app icons and the active one marigold, the front app, now playing in the center, the status items on the right each in its own color. Hovering an item highlights it; clicking a status item opens its popup; clicking a space focuses it
- **SketchyBar, full screen**: make a window full screen (green button or ⌃⌘F); the bar on that display hides, and a bar on any other display stays. Leave full screen and the bar comes back
- **SketchyBar, menu bar**: with the macOS menu bar set to auto-hide, move the mouse to the top edge; the menu bar slides down over the bar and the bar doesn't move
- **SketchyBar, second display**: plug in a second display; each display has a bar, listing only its own spaces, and both show the status items. Move a space to the other display in Mission Control; it leaves one bar and joins the other
- **yabai**: tiled windows sit 8 below the bar and 8 above the bottom of the screen
- **JankyBorders**: the focused window's border is rounded, 2 wide and marigold; other windows' are near-black
- **VSCode**: after Reload Window if reminded, the Marigold color theme and the modern UI's floating, rounded parts; it offers a restart, and after it the title bar is macOS's own. A selection, and the matched letters in a completion list, can be read
- **Chrome**: after the printed step, the window frame is dark and a New Tab page is black
- **macOS**: System Settings → Appearance shows Dark, accent Yellow, highlight Yellow; menus and Finder are dark
- **Out of the Switch**: Spotify, Raycast, the Event Viewer, Neovim, Deepvue and the wallpaper look as they did on Vintage

### `theme vintage`

- **Every tool above** is back to its Vintage look: Ghostty light and square (after ⌘Q for opacity), Starship's `>` prompt, the XP taskbar at the bottom with windows 38 above it, square grey borders 4 wide, VSCode's classic layout and custom title bar (after its restart), Chrome's Vintage frame after its printed step, macOS light with Graphite accent and Blue highlight
- **SketchyBar**: `yabai -m signal --list` shows no `sketchybar_` signals
- **The repo**: `git status` shows no change to `vscode/settings.json` or any other tracked file

### Runs

Each run on the Mac, and what didn't match: filed as an issue or recorded in [Deviations](#deviations).

| Date | Result |
|---|---|

## Deviations

As in the Vintage theme's spec, every place where a tool departs from this spec gets a row here and an inline comment at that spot in the tool's file.

| Tool | Departure | Why |
|---|---|---|
| **SketchyBar** | Popups' headings are JetBrainsMonoNL Nerd Font Bold 11 and their large readings (the battery's percent, the weather now, the date) Bold 20, beside the bar's 13 (`sketchybar/plugins/marigold/popup_rows.sh`) | as the #165 mockup's popups: small headings over rows, one large reading at the top |
| **SketchyBar** | The bar hides only for macOS's own full screen; a window yabai zooms to full screen (hyper-f) keeps the bar (`sketchybar/layouts/marigold.sh`) | SketchyBar can only tell a native full-screen space; a zoomed window stops at yabai's padding, below the bar, so the bar covers nothing |

## Known exceptions

- **Deepvue**: stays out of Marigold. Its chart settings are typed in by hand and stay Vintage's.
- **Chrome** and **VSCode** keep their own corners where a theme can't set them, as under Vintage. Under Marigold both are rounded already.

## Open

- **Wallpaper**: undecided, as for Vintage. Translucency and blur only show over a wallpaper with something in it; over a solid black desktop they're invisible (the mockup's stand-in wallpaper toggle shows the difference).

## Out of scope

These stay Vintage whatever Theme is active, and a Switch doesn't touch them (#140, #158):

- Deepvue (see [Known exceptions](#known-exceptions)).
- Neovim (`docs/adr/0007-neovim-stays-out-of-the-switch.md`).
- Spotify: its Spicetify "Vintage" theme, with the Media Rack and its Display (`docs/adr/0013-spotify-stays-vintage.md`).
- Raycast: its "Vintage" theme stays selected (`docs/adr/0012-raycast-and-the-event-viewer-stay-vintage.md`).
- The Claude Code Event Viewer: its Win95 window and Display (`docs/adr/0012-raycast-and-the-event-viewer-stay-vintage.md`).
- The wallpaper (see [Open](#open)).
