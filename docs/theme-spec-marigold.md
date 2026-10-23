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
| `frame_highlight` | hairline borders: the lit edge of bars, panels and popups |
| `frame_light` | hover and selected rows (sidebar, completion list, Raycast) |
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

None. Wherever Vintage draws a Display, Marigold uses Frame roles: the background is `frame_window`, lit text `frame_text`, and ghost segments and dim lines `frame_gray_text`. That covers Spotify's player bar and the Event Viewer's status bar.

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
- **Translucency and blur** on the surfaces seen most: Ghostty, the SketchyBar bar, and Raycast (its own). Every other tool stays opaque, VSCode included: it can't do this without patching. Role values are opaque; translucency is applied by `opacity` and `blur`. The SketchyBar bar is the exception: it's more see-through, with its own values in the source file's `bar` block, `opacity` 0.5 and `blur` 40 (Vintage's `1` and `0`).
- **Drop shadows** on (`"shadows": true`).
- **Icons** allowed: SF Symbols for SketchyBar's status items, `sketchybar-app-font` for its spaces and front app, Nerd Font icons in the prompt. No emoji.
- No SIP-disabling or patching system files, as Vintage.

### Where popups go

As Vintage: menus and pickers are Frame (`frame_face`, `frame_text`, `frame_light` for the hovered row); inline code popups are Work surface (`work_bg` with a 1px `work_popup_border`), rounded and shadowed.

## Per tool

Which tools get a design of their own under Marigold, beyond colors, and which only take its colors. Nothing here is built yet, except where a row says so.

| Tool | Under Marigold | Status |
|---|---|---|
| **SketchyBar** | **own design** (prototype and decision: #165). One floating bar at the top, 28 high, 8 from the top and sides of the screen (yabai's `window_gap`), so windows sit 8 below it. `frame_face` at the bar's own `opacity` 0.5 with `blur` 40 (the source file's `bar`, not `rules`), `radius` corners (10, the same as macOS Sonoma's window corners) and a 1px `frame_highlight` border; no gap between items. Left: the spaces, each its number and its windows' app icons (`sketchybar-app-font`), the active one marigold (`frame_selection` with `frame_selection_text`), the others `frame_gray_text`; then the front app, its icon and name. Center: now playing. Right, left to right: CPU, memory, weather, language, volume, Wi-Fi, battery, clock. Every status item has an SF Symbol at 13 in its own **Frame data color** (now playing magenta, CPU cyan, memory orange, weather yellow, language cyan, volume magenta, Wi-Fi blue, battery green, `frame_data_red` below 20% unless charging, clock yellow) and a label in JetBrainsMonoNL Nerd Font 13. Hovering any item highlights it `frame_light`. Clicking a status item opens its popup (Frame, as [Where popups go](#where-popups-go)); Wi-Fi's is the Wi-Fi menu. Clicking a space focuses it; clicking the front app does nothing. The bar hides while the front window is full screen; the auto-hidden macOS menu bar slides down over it; each display has its own bar showing its own spaces. yabai's padding is per-Theme, set by the layout: under Marigold top 44 (8 + 28 + 8) and bottom 8, Vintage keeps top 8 and bottom 38. Its layout is per-Theme: Vintage keeps the XP taskbar | first bar **built** in `sketchybar/layouts/marigold.sh` (#156), on the per-Theme layout (#155), with its plugins in `sketchybar/plugins/marigold/`: height 32, Nerd Font icons in `frame_selection`, SF Pro labels, no popups. The #165 design is to build: SF Symbols characters, generated into `sketchybar/sf_symbols.sh` by matching each symbol AppKit draws by name against SF Pro's characters (#168); the shape above (#170); now playing, CPU, memory, weather, language and every popup (#171); full screen and per-display (#172). yabai's padding is **built** (#166): each layout sets it through `sketchybar/yabai_padding.sh`. The bar's own opacity and blur are **built** (#169): `bar_alpha` and `bar_blur` generated into `sketchybar/themes/marigold.sh` from the source file's `bar`, `bar_radius` from `rules.radius` |
| **Ghostty** | **own design.** `background-opacity` from `opacity`, `background-blur` from `blur`, `macos-titlebar-style = hidden` (rounded window corners, no title bar) in place of Vintage's `window-decoration = none` | theme and window settings generated (`ghostty/themes/marigold`, #151). A Switch recolors open windows and gives them the new blur, but Ghostty only applies a new `background-opacity` after a full restart (Cmd+Q), and a new `macos-titlebar-style` only to windows opened after the Switch |
| **VSCode** | **own design.** The Switch's settings rewrite (`docs/adr/0008-vscode-switch-rewrites-its-tracked-settings.md`) sets `workbench.experimental.modernUI: true` (floating, rounded parts) and the native title bar, in place of Vintage's custom one, from the source file's `vscode.modern_ui` and `vscode.title_bar`. The modern UI changes live; the title bar needs a VSCode restart, which VSCode offers when the setting changes. Opaque. The editor selection, and the match highlights and matched completion letters Vintage paints `ansi_11`, use `work_selection` instead: under Marigold `ansi_11` is pale yellow, and light token colors can't be read on it | color theme generated, its selection `work_selection` from the source file's `vscode.selection` (#150); modern UI and title bar set by the Switch (#153) |
| **JankyBorders** | **own design.** `style=round`, width 2, active `frame_selection` (marigold), inactive `frame_shadow` (near-black) | style, width and colors generated into `sketchybar/themes/marigold.sh` from the Theme source file's `borders` and `rules.radius` (#152); a Switch hands them to the running `borders` |
| **Starship** | **own design.** The same segments, with Nerd Font icons (directory, branch, runtime). Starship joins the Switch with one config per Theme; Vintage's keeps `>` and no icons | **built**: `starship/themes/<theme>.toml` generated from the Theme source file's `rules.icons`; `starship/init.zsh` reads the Switch's `starship/active-theme` before each prompt (#154) |
| **Spotify** | colors only. Spotify's own layout, which is already rounded and modern: `color.ini` plus minimal CSS, no Media Rack, no bevels and no Win95 window. The player bar is Frame (no Display). The lyrics view stays a Work surface | to build |
| **Claude Code** (Event Viewer) | colors only. Its layout stays; with flat bevel roles it reads as a flat panel. The status bar is Frame instead of a Display (see [Display](#display)). A modern layout of its own is a possible follow-up | to build |
| **Raycast** | colors only. A hand-written dark "Marigold" theme on the same slots as Vintage's; its corners, blur and font are its own | to build |
| **Chrome** | colors only. The generated "Marigold" extension, with the New Tab page `frame_desktop` black | generated (`chrome/marigold-theme/manifest.json`) |
| **macOS** | dark, yellow accent, yellow highlight | follows the Switch already |
| **ccstatusline**, **ranger**, **litecli** | no change: they inherit Ghostty's ANSI colors | nothing to build |
| **Neovim** | stays out of the Switch (`docs/adr/0007-neovim-stays-out-of-the-switch.md`): it shows Vintage's dark colorscheme whatever Theme is active | nothing to build |

## Deviations

None yet. As in the Vintage theme's spec, every place where a tool departs from this spec gets a row here and an inline comment at that spot in the tool's file.

## Known exceptions

- **Deepvue**: stays out of Marigold. Its chart settings are typed in by hand and stay Vintage's.
- **Raycast**, **Chrome** and **VSCode** keep their own corners where a theme can't set them, as under Vintage. Under Marigold most of them are rounded already.

## Open

- **Wallpaper**: undecided, as for Vintage. Translucency and blur only show over a wallpaper with something in it; over a solid black desktop they're invisible (the mockup's stand-in wallpaper toggle shows the difference).

## Out of scope

- Deepvue (see [Known exceptions](#known-exceptions)).
- Neovim.
