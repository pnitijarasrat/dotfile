# Theme spec: Vintage theme

The locked **Theme spec** for the **Vintage theme**: a Windows 95 Classic **Frame** around light, K-95-style **Work surfaces** in Windows VGA colors, plus the odd black LCD **Display**. Vocabulary follows `CONTEXT.md`.

This is the hand-off document for re-theming. To theme one tool, read this file and that tool's ticket. To theme a web app, follow `docs/web-theme.md`. Where an earlier decision was later changed, this file gives only the final value. If the built SketchyBar code and an issue disagree, this file follows the code.

Sources: palettes [#5](https://github.com/pnitijarasrat/dotfile/issues/5), light Work surface [#43](https://github.com/pnitijarasrat/dotfile/issues/43) / `docs/adr/0001-light-k95-work-surface.md`, Display [#63](https://github.com/pnitijarasrat/dotfile/issues/63) / `docs/adr/0002-display-surface.md`, fonts [#6](https://github.com/pnitijarasrat/dotfile/issues/6) / JetBrains Mono [#78](https://github.com/pnitijarasrat/dotfile/issues/78) / `docs/adr/0003-jetbrains-mono-work-surface.md`, per-tool decisions and popups [#7](https://github.com/pnitijarasrat/dotfile/issues/7), role names and palette sources [#8](https://github.com/pnitijarasrat/dotfile/issues/8), SketchyBar taskbar [#9](https://github.com/pnitijarasrat/dotfile/issues/9) / [#11](https://github.com/pnitijarasrat/dotfile/pull/11). Map: [#2](https://github.com/pnitijarasrat/dotfile/issues/2).

## Role names

Every color has a snake_case role name. Use it as the variable name where the tool's format has variables, and as a comment where it only allows comments. Variables are lowercase (`frame_face`, not `FRAME_FACE`), as in `sketchybar/color.sh`.

One hex value can play several roles. For example, `#000080` is `frame_title`, `frame_selection`, `work_selection` and `frame_data_blue`. Choose the role by what the element means, not by its color.

## Frame palette

Win95 Classic greys with a flat navy title bar (no gradient). Used by menu bars, borders, the launcher, app chrome, menus and pickers.

| Role | Hex | Use |
|---|---|---|
| `frame_face` | `#C0C0C0` | face of windows, bars, menus, scrollbars; menu bar background |
| `frame_highlight` | `#FFFFFF` | outer top-left bevel |
| `frame_light` | `#E0E0E0` | inner top-left bevel; pushed-in button face |
| `frame_shadow` | `#808080` | inner bottom-right bevel |
| `frame_dark_shadow` | `#000000` | outer bottom-right bevel |
| `frame_title` | `#000080` | active title bar |
| `frame_title_text` | `#FFFFFF` | active title text |
| `frame_title_inactive` | `#808080` | inactive title bar |
| `frame_title_inactive_text` | `#C0C0C0` | inactive title text |
| `frame_text` | `#000000` | text on Frame; menu bar text |
| `frame_gray_text` | `#808080` | disabled and secondary text |
| `frame_window` | `#FFFFFF` | edit fields and lists inside the Frame |
| `frame_selection` | `#000080` | selected item |
| `frame_selection_text` | `#FFFFFF` | selected item text |
| `frame_tooltip` | `#FFFFE1` | tooltips |
| `frame_desktop` | `#008080` | desktop (teal) |
| `frame_desktop_text` | `#FFFFFF` | text on the desktop (icon labels) |

## Work surface palette

A light, K-95-style canvas: navy text on white with Windows VGA colors, as in Kermit 95 on Windows. Used by terminals, editors, TUI apps and inline code popups. It's always light: there's no dark variant, and it doesn't follow macOS appearance.

| Role | Hex | Use |
|---|---|---|
| `work_bg` | `#FFFFFF` | background |
| `work_fg` | `#000080` | foreground |
| `work_cursor` | `#000000` | cursor |
| `work_cursor_text` | `#FFFFFF` | text under the cursor |
| `work_cursorline` | `#FFFFE1` | current line |
| `work_selection` | `#000080` | selection background |
| `work_selection_text` | `#FFFFFF` | selection text |
| `work_line_number` | `#808080` | line numbers |
| `work_grid` | `#C0C0C0` | gridlines, rulers, split lines |
| `work_popup_border` | `#808080` | 1px border of inline code popups |

### ANSI (Windows VGA)

| | black | red | green | yellow | blue | magenta | cyan | white |
|---|---|---|---|---|---|---|---|---|
| normal | `ansi_0` `#000000` | `ansi_1` `#800000` | `ansi_2` `#008000` | `ansi_3` `#808000` | `ansi_4` `#000080` | `ansi_5` `#800080` | `ansi_6` `#008080` | `ansi_7` `#C0C0C0` |
| bright | `ansi_8` `#808080` | `ansi_9` `#FF0000` | `ansi_10` `#00FF00` | `ansi_11` `#FFFF00` | `ansi_12` `#0000FF` | `ansi_13` `#FF00FF` | `ansi_14` `#00FFFF` | `ansi_15` `#FFFFFF` |

Bright yellow, green, cyan and white can't be read as text on white, so the brights mostly show up as backgrounds (K-95's yellow-on-blue bar). Bold isn't bright (see [Fonts](#fonts)).

### Syntax roles

| Role | Hex |
|---|---|
| `syntax_comment` | `#808080` (**not** italic) |
| `syntax_keyword` | `#808000` |
| `syntax_string` | `#008000` |
| `syntax_number` | `#800080` |
| `syntax_function` | `#008080` |
| `syntax_type` | `#000000` |
| `syntax_constant` | `#804000` |
| `syntax_operator` | `#000080` |
| `syntax_error` | `#800000` |
| `syntax_warning` | `#808000` |

Syntax roles use dark VGA shades (plus `#804000` for constants, the same as `frame_data_orange`), which read on white. Nothing is italic, including comments. Emphasis comes from color only.

## Frame data colors

Win95 dark VGA. Use these wherever red, green, yellow and so on appear on Frame grey. Examples: status bar diagnostics in Neovim and VSCode, Raycast data slots, SketchyBar.

| Role | Hex |
|---|---|
| `frame_data_red` | `#800000` |
| `frame_data_green` | `#008000` |
| `frame_data_yellow` | `#808000` |
| `frame_data_blue` | `#000080` |
| `frame_data_magenta` | `#800080` |
| `frame_data_cyan` | `#008080` |
| `frame_data_orange` | `#804000` |

## Display palette

A black LCD readout in the **Frame**, like the time and track displays in Windows' Media Rack: lit cyan text over unlit "ghost" segments, inside a sunken bevel. Every value is a VGA color already in the ANSI table. Text is the Work surface font (still Fixedsys Excelsior at 16px until [#80](https://github.com/pnitijarasrat/dotfile/issues/80)); there's no seven-segment font. Used by Spotify's player bar (#63) and Claude Code's Event Viewer (#92).

| Role | Hex | Use |
|---|---|---|
| `display_bg` | `#000000` | LCD background (same as `ansi_0`) |
| `display_fg` | `#00FFFF` | lit text (same as `ansi_14`) |
| `display_ghost` | `#008080` | unlit ghost segments (`88:88`) and dim lines (same as `ansi_6`) |

## Fonts

### Work surface

| Setting | Value |
|---|---|
| Font | **JetBrains Mono NL** (the build with no ligatures, OFL), Regular weight, installed into `~/Library/Fonts` ([#78](https://github.com/pnitijarasrat/dotfile/issues/78)). It replaced Fixedsys Excelsior ([#12](https://github.com/pnitijarasrat/dotfile/issues/12)), which stays in `fonts/` but is unused once every tool has moved. Sizes are plain readable sizes, not whole bitmap pixels. |
| Fallback | JetBrains Mono NL → **Menlo** → **Thonburi**, written out in Ghostty and VSCode. Still being migrated: Spotify's lyrics and Display ([#80](https://github.com/pnitijarasrat/dotfile/issues/80)) keep Fixedsys Excelsior → Menlo → Thonburi until then |
| Ghostty | `font-size = 14`; `font-style-bold`, `font-style-italic` and `font-style-bold-italic` are `false`, so every style uses the Regular face. Neovim and Starship draw in Ghostty, so they follow it |
| VSCode editor | `editor.fontFamily` as above, `editor.fontSize: 11`, `editor.lineHeight: 0` (automatic), `window.zoomLevel: 1` ([#79](https://github.com/pnitijarasrat/dotfile/issues/79)). Zoom 1 scales everything by 1.2, so code renders at about 13 and the chrome stays the size it is |
| VSCode terminal | same font and size as the editor: `terminal.integrated.fontFamily` as above, `fontSize: 11`, `lineHeight: 1` (a multiple of the font's own cell height) ([#79](https://github.com/pnitijarasrat/dotfile/issues/79)) |
| Italics | none; synthetic italic off, and the font's own italic face isn't used |
| Bold | bold is **not** bright (Ghostty `bold-color` unset); synthetic bold off and the font's own bold face isn't used, so bold text looks the same as normal text; VSCode `editor.fontWeight`, `terminal.integrated.fontWeight` and `terminal.integrated.fontWeightBold` normal |
| Ligatures | off (`font-feature = -calt, -liga` in Ghostty; `editor.fontLigatures: false` and `terminal.integrated.fontLigatures.enabled: false` in VSCode) |

Neovim's statusline belongs to the Frame, but it's drawn by the terminal, so it uses the Work surface font.

### Frame

| Setting | Value |
|---|---|
| Font | **Microsoft Sans Serif** Regular 14 (ships with macOS) |
| Bold | Microsoft Sans Serif has no bold. Where bold is needed, use **Tahoma Bold** (ships with macOS). |
| VSCode chrome | unchanged: keeps the system font, and only its colors follow the Frame. Changing the font needs the custom-CSS extension (see [Open](#open)). |
| Raycast | has no font setting |
| Chrome | has no font setting: the tab strip, toolbar and bookmarks keep the macOS system font (see [Known exceptions](#known-exceptions)) |

## Purist fidelity

- Opaque everywhere: no transparency, no blur.
- Square corners everywhere the tool allows it.
- No Nerd Font icons and no emoji. Use plain characters or pixel icons instead.
- Fonts are vector faces chosen to read well on Retina at plain sizes, not bitmap fonts. Spotify still uses Fixedsys Excelsior until [#80](https://github.com/pnitijarasrat/dotfile/issues/80).
- No SIP-disabling or patching system files.

### Where popups go

- **Frame** (`frame_face` background, `frame_text`, `frame_selection` / `frame_selection_text`): menus and pickers. VSCode: command palette, quick open, context menus, notifications. Neovim: which-key, telescope, snacks pickers, and the tab line (bufferline).
- **Work surface** (`work_bg`, 1px `work_popup_border`): inline popups that show code. Completion, hover, signature help, diagnostics floats.

## Per tool

| Tool | Ticket | Approach | Palette source | Non-color changes | Status |
|---|---|---|---|---|---|
| **Ghostty** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13), [#44](https://github.com/pnitijarasrat/dotfile/issues/44) | custom `vintage` theme: `work_*` + `ansi_0`–`ansi_15` | hand-written; raw hex, each line commented with its role name | `background-opacity = 1`, no blur, `window-decoration = none` (square corners; visible tabs are lost, splits stay); fonts as above | light Work surface **built** (#44) |
| **Neovim** (LazyVim) | [#16](https://github.com/pnitijarasrat/dotfile/issues/16), [#17](https://github.com/pnitijarasrat/dotfile/issues/17), [#45](https://github.com/pnitijarasrat/dotfile/issues/45) | custom colorscheme `vintage`: Work surface roles on standard groups (Treesitter/LSP link to them), plus groups for plugins in use (snacks, telescope, which-key, oil, org). `MatchParen` is `work_fg` on `work_grid` (white text can't be read on `work_grid`) | hand-written; starts with a `local p = { work_bg = "#FFFFFF", ... }` role table | native statusline (lualine is disabled) and tab line are Frame grey with Frame data colors; `winborder = "single"` and square borders in snacks, telescope, which-key; delete `github.lua`, `tokyonight.lua` and the transparent groups | Work surface **to do again**: light Work surface [#45](https://github.com/pnitijarasrat/dotfile/issues/45); Frame to do |
| **VSCode** | [#18](https://github.com/pnitijarasrat/dotfile/issues/18), [#19](https://github.com/pnitijarasrat/dotfile/issues/19), [#20](https://github.com/pnitijarasrat/dotfile/issues/20), [#33](https://github.com/pnitijarasrat/dotfile/issues/33), [#46](https://github.com/pnitijarasrat/dotfile/issues/46), [#79](https://github.com/pnitijarasrat/dotfile/issues/79) | custom local theme extension "Vintage", symlinked into `~/.vscode/extensions`; workbench is Frame, token colors are Work surface | hand-written JSONC; raw hex with role-name comments | `settings.json` tracked in the repo and symlinked; `window.titleBarStyle: custom` with title bar active `frame_title`/`frame_title_text`, inactive `frame_title_inactive`/`frame_title_inactive_text`; `window.menuStyle: custom` so context menus are Frame; `workbench.experimental.modernUI: false` (the modern UI floats rounded parts and ignores the active tab color); status bar data in Frame data colors; fonts as above | Frame **built** (#20); light Work surface **built** (#46) |
| **SketchyBar** | [#9](https://github.com/pnitijarasrat/dotfile/issues/9) / [#11](https://github.com/pnitijarasrat/dotfile/pull/11) | custom XP taskbar | shared `sketchybar/color.sh` (Frame role-name variables) | docked edge to edge at the bottom (`topmost=window`); raised Start button, spaces as taskbar buttons, front app as a pressed task button, sunken tray; `blur_radius=0`, `corner_radius=0` on bar and popups; 16px pixel icons instead of Nerd Font glyphs | **built** |
| **Claude Code** | [#83](https://github.com/pnitijarasrat/dotfile/issues/83), [#90](https://github.com/pnitijarasrat/dotfile/issues/90) | the **Event Viewer** mod (`claude/event-viewer`), a pane on the terminal surface drawn as a Win95 **Frame** window: `frame_title` title bar with `frame_title_text`, `frame_face` body holding the activity log: a sunken `frame_window` list box with `frame_text` rows, the Type column in Frame data colors (Running `frame_data_blue`, Denied `frame_data_yellow`, Error `frame_data_red`, Done `frame_text`) and the caption's event count in `frame_gray_text`; a **Display** as the status bar (#92): a sunken `display_bg` LCD row, the step (`RUNNING <tool>  <target>`, `THINKING <model>`, `WORKING <model>` or `IDLE`) in `display_fg`, the event count in `display_ghost`, and the elapsed time on the right with its unlit leading digits as `display_ghost` `8`s; the selected row in `frame_selection` with `frame_selection_text`, and its **Event Properties** (#93): a raised `frame_face` panel of the call's fields, the Status in its Type's color, over sunken `frame_window` Input and Result (Reason, Error) boxes with a scrollbar (`▲` `▼` in `frame_text`, a `▒` track in `frame_highlight` and a `█` thumb in `frame_face`) and a `frame_gray_text` line range; under the log, the **Summary** (#94): an etched group box of `frame_text` labels and values in three columns, a figure not known yet as `-` in `frame_gray_text` | hand-written; a `FRAME` table and a `DISPLAY` table in `hooks/register.tsx` keyed by role name | the terminal draws cells, not pixels: the window's bevel is 1/8-cell lines (`▏▕▔`) in `frame_highlight` and `frame_dark_shadow`, with no top bevel; the list box's, the Display's and the Input and Result boxes' sunken bevel is `▁▕` in `frame_shadow` and `▔▏` in `frame_highlight`; the Event Properties panel's and its push buttons' raised bevel is `▁▕` in `frame_highlight` and `▔▏` in `frame_dark_shadow`; the Summary's etched group box is box-drawing lines (`┌─` `│` `└` in `frame_shadow`, `┐` `┘` and the bottom `─` in `frame_highlight`), as a 1/8-cell line can't hold its caption; caption buttons `_ □ ×`, push buttons `↑ ↓ OK`, the scrollbar's `▲ ▼` and the Type glyphs `(i) (>) (!) (x)` are plain characters (no emoji, no Nerd Font icons) | empty window **built** (#90); activity log **built** (#91); Display **built** (#92); Event Properties **built** (#93); Summary **built** (#94) |
| **JankyBorders** | [#15](https://github.com/pnitijarasrat/dotfile/issues/15) | custom: active `frame_face`, inactive `frame_shadow` | shared: `bordersrc` sources `$HOME/.config/sketchybar/color.sh` | `style=square`, width 4 | **built** |
| **Raycast** | [#21](https://github.com/pnitijarasrat/dotfile/issues/21) | custom light theme "Vintage" (`appearance: light`): background and backgroundSecondary `frame_face` (flat, no gradient), text `frame_text`, selection `frame_selection`, data slots use Frame data colors, `loader` is `frame_selection` (Win95 progress-bar navy) | hand-written strict JSON; raw hex (no comments allowed) | none possible (see [Known exceptions](#known-exceptions)) | **built**; import into Raycast not yet checked |
| **Chrome** | [#37](https://github.com/pnitijarasrat/dotfile/issues/37), [#38](https://github.com/pnitijarasrat/dotfile/issues/38) | custom local theme extension "Vintage" (MV3), loaded once with Load unpacked; the whole window is Frame (web pages can't be themed). On macOS the tab strip is the title bar: `frame` and `background_tab` `frame_title`, `tab_background_text` `frame_title_text`; inactive window `frame_inactive` and `background_tab_inactive` `frame_title_inactive`, `tab_background_text_inactive` `frame_title_inactive_text`. Active tab and toolbar `frame_face`; `tab_text`, `toolbar_text`, `toolbar_button_icon`, `bookmark_text` `frame_text`; omnibox `frame_window` with `frame_text`. New Tab page is the Classic desktop: flat `frame_desktop` teal (`ntp_background`) with `frame_desktop_text` text and links ([#38](https://github.com/pnitijarasrat/dotfile/issues/38)). Incognito windows aren't themed (see [Known exceptions](#known-exceptions)) | hand-written strict JSON; Chrome only takes `[r, g, b]` arrays, so no hex and no role comments: the key-to-role mapping is this row and `chrome/tests/vintage_test.mjs` | colors only: no `images`, `tints` or `properties` (opaque, no gradients; the New Tab page has no background image) | **built** (#37, #38) |
| **Deepvue** | [#50](https://github.com/pnitijarasrat/dotfile/issues/50) | chart settings only, typed in by hand: the chart pane is a **Work surface** (not Frame grey as `docs/web-theme.md` puts chart series, since candles on `frame_face` are low-contrast). Background `work_bg`, grid lines `work_grid`, scale text and crosshair `work_line_number`; candles and volume up `frame_data_green`, down `frame_data_red`, flat (wick and border match the body); EMA 10 `work_fg`, EMA 21 `syntax_function`, SMA 50 `syntax_number`, SMA 200 `ansi_0`, RS line `syntax_constant`. The rest of the app stays Deepvue's light mode; a whole-app Frame stylesheet is [#51](https://github.com/pnitijarasrat/dotfile/issues/51) | hand-entered; checklist in `deepvue/README.md` | none possible (see [Known exceptions](#known-exceptions)) | **built** (#50) |
| **Spotify** | [#53](https://github.com/pnitijarasrat/dotfile/issues/53), [#61](https://github.com/pnitijarasrat/dotfile/issues/61), [#54](https://github.com/pnitijarasrat/dotfile/issues/54), [#55](https://github.com/pnitijarasrat/dotfile/issues/55), [#56](https://github.com/pnitijarasrat/dotfile/issues/56), [#57](https://github.com/pnitijarasrat/dotfile/issues/57), [#58](https://github.com/pnitijarasrat/dotfile/issues/58), [#59](https://github.com/pnitijarasrat/dotfile/issues/59), [#63](https://github.com/pnitijarasrat/dotfile/issues/63) | custom local Spicetify theme "Vintage" (no Marketplace, extensions or custom apps); Spotify is one maximized Win95 window, so the palette is **Frame** (the lyrics view is a **Work surface**, #59, and the player bar's LCDs a **Display**, #63). Color scheme slots: `main`, `main-elevated`, `sidebar`, `player`, `card` and `notification` → `frame_face`; `highlight` and `highlight-elevated` → `frame_face` (no hover highlight); `text` → `frame_text`; `subtext` and `misc` → `frame_gray_text`; `shadow` → `frame_shadow`; `selected-row` → `frame_selection`; `button` and `button-active` → `frame_selection` (Spotify green becomes Win95 navy, as Raycast's `loader`); `button-disabled` → `frame_light` (the track of progress bars outside the player bar); `tab-active` → `frame_light` (active filter chip, a pushed-in toggle); `notification-error` → `frame_data_red` | hand-written: `spicetify/Themes/Vintage/color.ini` (raw hex, each line commented with its role name) and `user.css` (a `:root` block of role-named tokens plus `--raised` and `--sunken`; hex only there; it also remaps Spotify's `.encore-*-set` color variables and the surfaces they miss, see [#64](https://github.com/pnitijarasrat/dotfile/issues/64)); `theme.js`, which marks the window inactive (`html.vintage-window-inactive`) since CSS can't see window focus; `spicetify/config-xpui.ini` tracked, with theme.js injection on; apply steps and checklist in `spicetify/README.md` | square corners on every element, cover art included; no blur, filters, drop shadows, gradients or fade-out masks; headers, Now Playing, the sticky page header and the Home band lose their cover-colored tint and are flat `frame_face`; cover art and photos stay in full color ([#54](https://github.com/pnitijarasrat/dotfile/issues/54)). Fonts as above on every element; bold is Tahoma Bold through an `@font-face` that gives Microsoft Sans Serif a bold face from the installed Tahoma Bold (`local()`, no font files), so every weight Spotify sets bold picks it; big titles Tahoma Bold 24 (see [Deviations](#deviations)) ([#55](https://github.com/pnitijarasrat/dotfile/issues/55)). Buttons (Spotify's encore buttons, Play included) are raised `frame_face` push buttons with `frame_text` glyphs, sunken with a `frame_light` face while pressed; disabled glyphs `frame_gray_text` on an opaque face; icons `frame_text` (in list rows they keep the row's color); the bright accent (the playing track, on states) `frame_selection`; the player bar is the Media Rack below ([#56](https://github.com/pnitijarasrat/dotfile/issues/56)). Track lists in the main view are sunken `frame_window` list boxes; the selected row `frame_selection` with `frame_selection_text`; no hover highlight on rows or cards (the play-on-hover button still appears); context menus and dropdowns raised `frame_face` with the hovered item `frame_selection`, checked items `frame_text`; tooltips `frame_tooltip` with a 1px `frame_dark_shadow` border; scrollbars 16px and always shown, track `frame_light` and a raised `frame_face` thumb (no arrow buttons); keyboard focus a 1px dotted `frame_text` outline inside the control (`frame_selection_text` on navy) ([#57](https://github.com/pnitijarasrat/dotfile/issues/57)). The top bar is the title bar: `frame_title` with `frame_title_text` while Spotify has focus, `frame_title_inactive` with `frame_title_inactive_text` when it doesn't; its buttons stay raised push buttons, the search box is a sunken `frame_window` edit field, and the traffic lights keep their system colors, as in Chrome ([#58](https://github.com/pnitijarasrat/dotfile/issues/58)). The lyrics view (the full page and the Now Playing panel) is a **Work surface**: `work_bg` in place of the cover color Spotify passes in as `--lyrics-color-*`; Fixedsys Excelsior → Menlo → Thonburi at 16px, ligatures, synthesis and italics off (its buttons stay Frame push buttons); the current line `work_fg` on a `work_cursorline` band, past lines `work_line_number` (opaque, not Spotify's 50% fade), upcoming lines `work_fg`. Spotify marks line states only with hashed classes, so they need checking after an update ([#59](https://github.com/pnitijarasrat/dotfile/issues/59)). The player bar is a Media Rack unit, the CD unit of Windows' multimedia app: a raised `frame_face` rack with the cover art (full color, sunken) beside two rows. On top, sunken **Display** LCDs: the elapsed time over `88:88` ghost segments with the seek bar under it (a sunken track with a `frame_selection` fill, so click-to-seek still works; no duration readout), the track title in `display_fg` and the artist in `display_ghost`, then like. Below, shuffle, previous, play/pause, next and repeat as square-cornered raised push buttons, all one size (disabled ones gray and unpressable, as above), and the volume slider (a raised `frame_face` thumb in a sunken `frame_window` slot). Shuffle, repeat and liked show a square LED, `frame_data_green` when on and `frame_shadow` when off, in place of the navy on state. The parts are found by test id and, where they have none, by DOM order and English labels, so they need checking after an update ([#63](https://github.com/pnitijarasrat/dotfile/issues/63)) | palette **in progress** (#61); Purist fidelity **built**, visual check in [#60](https://github.com/pnitijarasrat/dotfile/issues/60) (#54); fonts **built** (#55); controls **built** (#56); lists, menus, scrollbars and focus **built** (#57); title bar **built** (#58); lyrics Work surface **built** (#59); Media Rack player bar **built** (#63) |
| **Starship** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep | none: named ANSI colors, inherited from Ghostty | `➤` → `>` for success and error (not in JetBrains Mono NL); vim mode stays `<` | **built** |
| **ccstatusline** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep | none: named ANSI colors, inherited from Ghostty | `colorLevel: 1` (see [Deviations](#deviations)) | **built** |
| **ranger** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep default scheme | none: ANSI colors, inherited from Ghostty | none | **built** |
| **litecli** | [#14](https://github.com/pnitijarasrat/dotfile/issues/14) | small rewrite | none: `[colors]` uses prompt_toolkit ANSI names (`ansigreen`, `bg:ansiblue`, ...), `syntax_style = native`, which is a dark Pygments style: needs a light one for the light Work surface | none | to do |

Starship, ccstatusline, ranger and litecli take no hex values. They follow the palette by inheriting Ghostty's ANSI colors.

## Deviations

Every place where a tool departs from this spec gets **both** a row here **and** an inline comment at that spot in the tool's file. Add the row in the same change as the deviation.

| Tool | What departs | Value used | Why |
|---|---|---|---|
| SketchyBar | Frame bold font for Start and the task button | Tahoma Bold **13** (not 14) | Microsoft Sans Serif has no bold (#9); size 13 set when built in #11 |
| SketchyBar | Wi-Fi popup section headers | Tahoma Bold **10**, `frame_gray_text` | smaller section headings inside the popup, set when built in #11 |
| ccstatusline | color level | `colorLevel: 1` (was 2) | at level 2 named colors are sent as 256-color codes (`38;5;30`), which bypass Ghostty's palette; level 1 sends the 16 ANSI codes. No inline comment: the file is strict JSON (#13) |
| VSCode | editor selection | `ansi_11` background, `frame_light` when the editor isn't focused; selected text keeps its token colors (not `work_selection` with `work_selection_text`). Peek match highlights are `ansi_11` too, and so are the matched letters on the completion list's selected row | VSCode only applies `editor.selectionForeground` in high-contrast themes (#19), and the dark syntax colors can't be read on navy (#46). The terminal and the completion list, which honor their selection foreground, keep `work_selection` |
| VSCode | panel body | `work_bg` with `work_fg` titles (not `frame_face`) | the panel's lists (problems, terminal tabs) use the global `foreground`, which is `frame_text` (it reads on both Frame grey and the white `work_bg`); editor text stays `work_fg`. VSCode has no `panel.foreground`. The panel mostly holds the terminal (#20, #46) |
| VSCode | status bar problems counter | `frame_text` (not Frame data colors) | VSCode has no color key for it; Frame data colors apply to the items VSCode marks as error or warning (#20) |
| Raycast | purple data slot | `frame_data_magenta` `#800080` (same as the magenta slot) | Raycast has separate purple and magenta slots, but the Frame data colors have no purple; magenta is the nearest. No inline comment: the file is strict JSON (#21) |
| Neovim | `winborder = "single"` | set only on Neovim 0.11+; on 0.10 the hover, signature help and diagnostic floats get `border = "single"` directly, and blink.cmp sets it per popup | `winborder` doesn't exist before 0.11, and the installed Neovim is 0.10.0. Same result (#16) |
| Spotify | big playlist, album and artist titles | Tahoma Bold **24** (not 14) | Spotify draws them at about 96px; at 14 they'd be lost in the header, and 24 keeps them sized like a Win95 heading (#55) |

## Known exceptions

These don't follow Purist fidelity, and that's accepted. They aren't deviations, because no setting can change them.

- **Raycast**: corners, blur and font can't be changed.
- **VSCode**: its own widgets keep rounded corners. Squaring them needs the custom-CSS extension (see [Open](#open)).
- **Chrome**: tabs, the omnibox and toolbar buttons keep their rounded shapes, and the tab strip, toolbar and bookmarks use the macOS system font; a theme can set neither. The Material refresh also derives its own tints from the theme colors (tab hover, toolbar button hover and pressed states, separators, the omnibox hover and its dropdown), which aren't spec roles. The macOS traffic-light buttons keep their system colors. On the New Tab page, the Google logo, search box, shortcut tiles and Customize Chrome button are drawn by Chrome, rounded and in its own colors; only the background, text and links come from the theme. Incognito windows ignore the theme entirely and keep Chrome's own dark colors; Chrome stopped applying themes to Incognito, so the `frame_incognito` keys do nothing (#38).
- **Deepvue**: the chart is drawn on a canvas, so axis and legend text keep Deepvue's own sans-serif, and corners, fonts and the surrounding app keep Deepvue's light UI until [#51](https://github.com/pnitijarasrat/dotfile/issues/51).
- **Spotify**: elements that carry a photo as an inline background (concert cards, the Premium promo banner) keep their gradient scrims: CSS can drop the whole background or none of it, and dropping it would lose the photo. Translucent colors Spotify hard-codes in its own stylesheets (white or black at low alpha) stay wherever the `.encore-*-set` remap doesn't reach; on Frame grey they show as faint tints at most. Library placeholders lose their image mask along with the fade-out masks, so they show as plain rectangles while loading (#54). Scrollbars have no Win95 arrow buttons: Spotify draws most with OverlayScrollbars, which has none, and the native ones are hidden wherever it runs (#57).
- **litecli**: SQL highlighting comes from a Pygments style, which isn't exactly the Work surface syntax roles.

## Open

Not yet decided. Tracked in map [#2](https://github.com/pnitijarasrat/dotfile/issues/2). Update this section once each is settled.

- **Wallpaper and macOS accent color**: a Bliss image, or a flat `frame_desktop` teal Classic desktop? Chrome's New Tab page already shows the flat teal Classic desktop (#38); the macOS wallpaper, accent and highlight color are still undecided.
- **Faking 3D bevels** where tools allow it (JankyBorders, Raycast, SketchyBar items beyond the taskbar). This includes the **VSCode custom-CSS extension**, which would also set the VSCode chrome font to Microsoft Sans Serif and square its widgets.

## Out of scope

- iTerm2 and nnn: no longer installed.
- System-wide macOS window chrome: it can't be themed without disabling SIP or patching system files.
- K-95's own window chrome (toolbar, scrollbar, status bar): Ghostty can't draw it. Only K-95's colors are adopted.
