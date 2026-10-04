# Theme spec: Vintage theme

The locked **Theme spec** for the **Vintage theme**: a Windows 95 Classic **Frame** around TC2000-style **Work surfaces** in soft IBM 5153 colors. Vocabulary follows `CONTEXT.md`.

This is the hand-off document for re-theming. To theme one tool, read this file and that tool's ticket. Where an earlier decision was later changed, this file gives only the final value. If the built SketchyBar code and an issue disagree, this file follows the code.

Sources: palettes [#5](https://github.com/pnitijarasrat/dotfile/issues/5), fonts [#6](https://github.com/pnitijarasrat/dotfile/issues/6), per-tool decisions and popups [#7](https://github.com/pnitijarasrat/dotfile/issues/7), role names and palette sources [#8](https://github.com/pnitijarasrat/dotfile/issues/8), SketchyBar taskbar [#9](https://github.com/pnitijarasrat/dotfile/issues/9) / [#11](https://github.com/pnitijarasrat/dotfile/pull/11). Map: [#2](https://github.com/pnitijarasrat/dotfile/issues/2).

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

## Work surface palette

Soft IBM 5153 on black. Used by terminals, editors, TUI apps and inline code popups.

| Role | Hex | Use |
|---|---|---|
| `work_bg` | `#000000` | background |
| `work_fg` | `#C4C4C4` | foreground |
| `work_cursor` | `#4EDC4E` | cursor |
| `work_cursor_text` | `#000000` | text under the cursor |
| `work_cursorline` | `#161616` | current line |
| `work_selection` | `#000080` | selection background |
| `work_selection_text` | `#FFFFFF` | selection text |
| `work_line_number` | `#7E7E7E` | line numbers |
| `work_grid` | `#4E4E4E` | TC2000 gridlines, rulers, split lines |
| `work_popup_border` | `#808080` | 1px border of inline code popups |

### ANSI (IBM 5153)

| | black | red | green | yellow | blue | magenta | cyan | white |
|---|---|---|---|---|---|---|---|---|
| normal | `ansi_0` `#000000` | `ansi_1` `#C40000` | `ansi_2` `#00C400` | `ansi_3` `#C47E00` | `ansi_4` `#0000C4` | `ansi_5` `#C400C4` | `ansi_6` `#00C4C4` | `ansi_7` `#C4C4C4` |
| bright | `ansi_8` `#4E4E4E` | `ansi_9` `#DC4E4E` | `ansi_10` `#4EDC4E` | `ansi_11` `#F3F34E` | `ansi_12` `#4E4EDC` | `ansi_13` `#F34EF3` | `ansi_14` `#4EF3F3` | `ansi_15` `#FFFFFF` |

`ansi_4` is hard to read on black (for example, `ls` directories). Because bold is bright, bold blue is drawn as `ansi_12`, which is readable. A tool may still override `ansi_4`, but only as a recorded deviation (see [Deviations](#deviations)).

### Syntax roles

| Role | Hex |
|---|---|
| `syntax_comment` | `#7E7E7E` (**not** italic) |
| `syntax_keyword` | `#F3F34E` |
| `syntax_string` | `#4EDC4E` |
| `syntax_number` | `#F34EF3` |
| `syntax_function` | `#4EF3F3` |
| `syntax_type` | `#FFFFFF` |
| `syntax_constant` | `#C47E00` |
| `syntax_operator` | `#C4C4C4` |
| `syntax_error` | `#DC4E4E` |
| `syntax_warning` | `#F3F34E` |

Nothing is italic, including comments. Emphasis comes from color only.

## Frame data colors

Win95 dark VGA. Use these wherever red, green, yellow and so on appear on Frame grey, because the Work surface brights can't be read there. Examples: status bar diagnostics in Neovim and VSCode, Raycast data slots, SketchyBar.

| Role | Hex |
|---|---|
| `frame_data_red` | `#800000` |
| `frame_data_green` | `#008000` |
| `frame_data_yellow` | `#808000` |
| `frame_data_blue` | `#000080` |
| `frame_data_magenta` | `#800080` |
| `frame_data_cyan` | `#008080` |
| `frame_data_orange` | `#804000` |

## Fonts

### Work surface

| Setting | Value |
|---|---|
| Font | **Fixedsys Excelsior** (kika build, CC0), committed to the repo and installed into `~/Library/Fonts` ([#12](https://github.com/pnitijarasrat/dotfile/issues/12)) |
| Fallback | Fixedsys Excelsior → **Menlo** → **Thonburi**, written out in both Ghostty and VSCode |
| Ghostty | `font-size = 32` (pixel-exact: 4 screen px per font px on 2× Retina) |
| VSCode editor | `editor.fontSize: 24`, `editor.lineHeight: 24`, `window.zoomLevel: 0`. Any other zoom level makes the font soft. |
| Italics | none; synthetic italic off |
| Bold | bold is bright (`bold-is-bright = true`); synthetic bold off; VSCode `editor.fontWeight` normal |
| Ligatures | off (`font-feature = -calt, -liga` in Ghostty; `editor.fontLigatures: false` in VSCode) |

Neovim's statusline belongs to the Frame, but it's drawn by the terminal, so it uses the Work surface font.

### Frame

| Setting | Value |
|---|---|
| Font | **Microsoft Sans Serif** Regular 14 (ships with macOS) |
| Bold | Microsoft Sans Serif has no bold. Where bold is needed, use **Tahoma Bold** (ships with macOS). |
| VSCode chrome | unchanged: keeps the system font, and only its colors follow the Frame. Changing the font needs the custom-CSS extension (see [Open](#open)). |
| Raycast | has no font setting |

## Purist fidelity

- Opaque everywhere: no transparency, no blur.
- Square corners everywhere the tool allows it.
- No Nerd Font icons and no emoji. Use plain characters or pixel icons instead.
- Fonts are chosen to read crisply on Retina, not for literal bitmap fidelity.
- No SIP-disabling or patching system files.

### Where popups go

- **Frame** (`frame_face` background, `frame_text`, `frame_selection` / `frame_selection_text`): menus and pickers. VSCode: command palette, quick open, context menus, notifications. Neovim: which-key, telescope, snacks pickers, and the tab line (bufferline).
- **Work surface** (`work_bg`, 1px `work_popup_border`): inline popups that show code. Completion, hover, signature help, diagnostics floats.

## Per tool

| Tool | Ticket | Approach | Palette source | Non-color changes | Status |
|---|---|---|---|---|---|
| **Ghostty** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | custom `vintage` theme: `work_*` + `ansi_0`–`ansi_15` | hand-written; raw hex, each line commented with its role name | `background-opacity = 1`, no blur, `window-decoration = none` (square corners; visible tabs are lost, splits stay); fonts as above | **built** |
| **Neovim** (LazyVim) | [#16](https://github.com/pnitijarasrat/dotfile/issues/16), [#17](https://github.com/pnitijarasrat/dotfile/issues/17) | custom colorscheme `vintage`: Work surface roles on standard groups (Treesitter/LSP link to them), plus groups for plugins in use (snacks, telescope, which-key, oil, org) | hand-written; starts with a `local p = { work_bg = "#000000", ... }` role table | native statusline (lualine is disabled) and tab line are Frame grey with Frame data colors; `winborder = "single"` and square borders in snacks, telescope, which-key; delete `github.lua`, `tokyonight.lua` and the transparent groups | Work surface **built** (#16); Frame to do |
| **VSCode** | [#18](https://github.com/pnitijarasrat/dotfile/issues/18), [#19](https://github.com/pnitijarasrat/dotfile/issues/19), [#20](https://github.com/pnitijarasrat/dotfile/issues/20) | custom local theme extension "Vintage", symlinked into `~/.vscode/extensions`; workbench is Frame, token colors are Work surface | hand-written JSONC; raw hex with role-name comments | `settings.json` tracked in the repo and symlinked; `window.titleBarStyle: custom` with title bar active `frame_title`/`frame_title_text`, inactive `frame_title_inactive`/`frame_title_inactive_text`; `window.menuStyle: custom` so context menus are Frame; `workbench.experimental.modernUI: false` (the modern UI floats rounded parts and ignores the active tab color); status bar data in Frame data colors; fonts as above | **built** (#19, #20) |
| **SketchyBar** | [#9](https://github.com/pnitijarasrat/dotfile/issues/9) / [#11](https://github.com/pnitijarasrat/dotfile/pull/11) | custom XP taskbar | shared `sketchybar/color.sh` (Frame role-name variables) | docked edge to edge at the bottom (`topmost=window`); raised Start button, spaces as taskbar buttons, front app as a pressed task button, sunken tray; `blur_radius=0`, `corner_radius=0` on bar and popups; 16px pixel icons instead of Nerd Font glyphs | **built** |
| **JankyBorders** | [#15](https://github.com/pnitijarasrat/dotfile/issues/15) | custom: active `frame_face`, inactive `frame_shadow` | shared: `bordersrc` sources `$HOME/.config/sketchybar/color.sh` | `style=square`, width 4 | **built** |
| **Raycast** | [#21](https://github.com/pnitijarasrat/dotfile/issues/21) | custom light theme "Vintage" (`appearance: light`): background `frame_face`, text `frame_text`, selection `frame_selection`, data slots use Frame data colors | hand-written strict JSON; raw hex (no comments allowed) | none possible (see [Known exceptions](#known-exceptions)) | to do |
| **Starship** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep | none: named ANSI colors, inherited from Ghostty | `➤` → `>` for success and error (not in Fixedsys Excelsior); vim mode stays `<` | **built** |
| **ccstatusline** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep | none: named ANSI colors, inherited from Ghostty | `colorLevel: 1` (see [Deviations](#deviations)) | **built** |
| **ranger** | [#13](https://github.com/pnitijarasrat/dotfile/issues/13) | keep default scheme | none: ANSI colors, inherited from Ghostty | none (bold blue directories become `ansi_12` because bold is bright) | **built** |
| **litecli** | [#14](https://github.com/pnitijarasrat/dotfile/issues/14) | small rewrite | none: `[colors]` uses prompt_toolkit ANSI names (`ansigreen`, `bg:ansiblue`, ...), `syntax_style = native` | none | to do |

Starship, ccstatusline, ranger and litecli take no hex values. They follow the palette by inheriting Ghostty's ANSI colors.

## Deviations

Every place where a tool departs from this spec gets **both** a row here **and** an inline comment at that spot in the tool's file. Add the row in the same change as the deviation.

| Tool | What departs | Value used | Why |
|---|---|---|---|
| SketchyBar | Frame bold font for Start and the task button | Tahoma Bold **13** (not 14) | Microsoft Sans Serif has no bold (#9); size 13 set when built in #11 |
| SketchyBar | Wi-Fi popup section headers | Tahoma Bold **10**, `frame_gray_text` | smaller section headings inside the popup, set when built in #11 |
| Ghostty | bold is bright | `bold-color = bright` (not `bold-is-bright = true`) | same behavior; Ghostty 1.2.0 deprecated `bold-is-bright` for `bold-color` (#13) |
| ccstatusline | color level | `colorLevel: 1` (was 2) | at level 2 named colors are sent as 256-color codes (`38;5;30`), which bypass Ghostty's palette; level 1 sends the 16 ANSI codes. No inline comment: the file is strict JSON (#13) |
| VSCode | selection text | selected text keeps its token colors on `work_selection` (not `work_selection_text`) | VSCode only applies `editor.selectionForeground` in high-contrast themes (#19) |
| VSCode | panel body | `work_bg` with `work_fg` titles (not `frame_face`) | the panel's lists (problems, terminal tabs) use the global `foreground`, which must stay `work_fg` because settings and other editor-area pages draw it on `work_bg`; VSCode has no `panel.foreground`. The panel mostly holds the terminal (#20) |
| VSCode | status bar problems counter | `frame_text` (not Frame data colors) | VSCode has no color key for it; Frame data colors apply to the items VSCode marks as error or warning (#20) |
| VSCode | icons | `frame_gray_text` (not `frame_text`) on Frame | `icon.foreground` is one color for icons on Frame grey and on `work_bg` (panel, settings), where black vanishes (#20) |
| VSCode | links | `ansi_12` on both Frame and Work surface | `textLink.foreground` is one color for links on Frame grey (sidebar) and on `work_bg` (hover, settings); no Frame data color reads on both (#20) |
| Neovim | `winborder = "single"` | set only on Neovim 0.11+; on 0.10 the hover, signature help and diagnostic floats get `border = "single"` directly, and blink.cmp sets it per popup | `winborder` doesn't exist before 0.11, and the installed Neovim is 0.10.0. Same result (#16) |

## Known exceptions

These don't follow Purist fidelity, and that's accepted. They aren't deviations, because no setting can change them.

- **Raycast**: corners, blur and font can't be changed.
- **VSCode**: its own widgets keep rounded corners. Squaring them needs the custom-CSS extension (see [Open](#open)).
- **litecli**: SQL highlighting comes from Pygments `native`, which isn't exactly 5153.

## Open

Not yet decided. Tracked in map [#2](https://github.com/pnitijarasrat/dotfile/issues/2). Update this section once each is settled.

- **Wallpaper and macOS accent color**: a Bliss image, or a flat `frame_desktop` teal Classic desktop? Accent and highlight color are also undecided.
- **Faking 3D bevels** where tools allow it (JankyBorders, Raycast, SketchyBar items beyond the taskbar). This includes the **VSCode custom-CSS extension**, which would also set the VSCode chrome font to Microsoft Sans Serif and square its widgets.

## Out of scope

- iTerm2 and nnn: no longer installed.
- System-wide macOS window chrome: it can't be themed without disabling SIP or patching system files.
