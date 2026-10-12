# Research: existing retro themes for VSCode, Neovim, Ghostty, Raycast

Resolves #4 (part of map #2). Researched 2026-10-04.

**Question:** Which existing themes come close to the **Vintage theme**? That means a Windows Classic/XP **Frame** (light grey/cream chrome) around TC2000-style **Work surfaces** (dark canvas with bright green/red/yellow/cyan), under **Purist fidelity**. For each tool, should we adopt something or build custom?

**Method:** I used primary sources only:

- VSCode: install counts, versions and last-update dates come from the VS Marketplace gallery API (`_apis/public/gallery/extensionquery`). For each candidate I downloaded the `.vsix` and read its theme JSON directly. All colour values below come from that JSON, not from screenshots.
- GitHub: star counts and last-push dates come from `gh api repos/...`.
- Ghostty: palettes were read from the installed theme files (Ghostty 1.3.1, `Ghostty.app/Contents/Resources/ghostty/themes`). Option docs come from `ghostty +show-config --default --docs`.
- Raycast: theme data was read from the `raycast/ray-so` repo, which is the source of themes.ray.so.

---

## TL;DR

**No theme in any tool has both halves of the Vintage theme: grey chrome *and* a dark TC2000 editor.** Retro-Windows themes always pair grey chrome with a *white* (or grey) editor. Dark retro themes make the chrome dark too.

**The most useful finding is one shared palette.** Tinted-theming's **`base16-windows-nt`** scheme (and its siblings `windows-95` and `windows-highcontrast`) is literally black + `#00ff00` / `#ff0000` / `#ffff00` / `#00ffff` + `#c0c0c0`. That is the TC2000 Work surface *and* the Classic grey in one 16-slot palette. It ships as maintained, ready-made ports for **VSCode, Neovim (with treesitter and LSP coverage) and Ghostty**. So "adopt base16-windows-nt for the Work surface, then hand-override the Frame groups to grey" works the same way in all three tools.

---

## The anchor palette: tinted-theming `windows-*` base16 schemes

Source: [tinted-theming/schemes `base16/windows-nt.yaml`](https://github.com/tinted-theming/schemes/blob/spec-0.11/base16/windows-nt.yaml) by Fergus Collins. The repo has 300 stars and was pushed 2026-10-03, so it is actively maintained.

| slot | windows-nt | windows-95 | windows-highcontrast | role |
|---|---|---|---|---|
| base00 | `#000000` | `#000000` | `#000000` | background |
| base05 | `#c0c0c0` | `#a8a8a8` | `#c0c0c0` | foreground |
| base07 | `#ffffff` | `#fcfcfc` | `#fcfcfc` | bright fg |
| base08 | `#ff0000` | `#fc5454` | `#fc5454` | red |
| base0A | `#ffff00` | `#fcfc54` | `#fcfc54` | yellow |
| base0B | `#00ff00` | `#54fc54` | `#54fc54` | green |
| base0C | `#00ffff` | `#54fcfc` | `#54fcfc` | cyan |
| base0D | `#0000ff` | `#5454fc` | `#5454fc` | blue |
| base09 / base0F | `#808000` / `#008000` | `#a85400` / `#00a800` | `#808000` / `#008000` | dim yellow / dim green |

- `windows-nt` uses the pure VGA primaries. It is the most TC2000-like.
- `windows-95` and `windows-highcontrast` use the softer CGA `#54/#fc` values, which are easier on the eyes at size 28.
- Light variants (`windows-nt-light` and others) also exist. They could be a starting point for the Frame palette.

The same scheme is shipped in these ports:

| Tool | Port | Status |
|---|---|---|
| VSCode | [Tinted VSCode](https://marketplace.visualstudio.com/items?itemName=TintedTheming.base16-tinted-themes) (themes `base16-windows-nt`, `base16-windows-95`, `base16-windows-highcontrast`, plus `-light`) | 3,457 installs, v0.51.0, updated 2026-09-27 |
| Neovim | [RRethy/base16-nvim](https://github.com/RRethy/base16-nvim) (`colors/base16-windows-nt.vim` and others) | 656 stars, pushed 2026-10-03 |
| Neovim | [tinted-theming/tinted-nvim](https://github.com/tinted-theming/tinted-nvim) | 41 stars, pushed 2026-10-03 |
| Ghostty | [tinted-theming/tinted-terminal `themes/ghostty/base16-windows-nt`](https://github.com/tinted-theming/tinted-terminal/tree/main/themes/ghostty) | pushed 2026-09-27 |

Tinted-theming also has ports for fzf, tmux, lazygit, delta, yazi and others ([org repo list](https://github.com/tinted-theming)). There is **no** Raycast, SketchyBar or Starship port.

---

## VSCode

**Customisability (all candidates):** VSCode can override any theme's colours from `settings.json`, scoped to a single theme with bracket syntax. This covers `workbench.colorCustomizations`, `editor.tokenColorCustomizations` and `editor.semanticTokenColorCustomizations`, e.g. `"[base16-windows-nt]": { "sideBar.background": "#c0c0c0" }`. Wildcards also work (`"[Monokai*]"`). Source: [VS Code docs, Customize a Color Theme](https://code.visualstudio.com/docs/configure/themes). Since `settings.json` will be symlinked into this repo, an override layer lives in dotfiles at no extra cost.

**Purist limit:** On macOS the VSCode window keeps rounded corners and its native frame. That falls under "system-wide window chrome", which the map rules out of scope.

Chrome colours below were read from each theme's JSON. `None` means the key isn't set, so VSCode's default for the base `uiTheme` applies.

### Grey Classic chrome, but a light editor (best Frame donors)

| Extension | Installs | Last update | editor bg | activityBar / sideBar / tabs / statusBar | Notes |
|---|---|---|---|---|---|
| [Windows NT](https://marketplace.visualstudio.com/items?itemName=wassimdev.windows-nt-vscode-theme) ([repo](https://github.com/manekinekko/windows-nt-vscode-theme), 112 stars) | 28,730 | 2023-12-09 (repo pushed 2023-02) | `#ffffff` | `#C0C0C0` everywhere; titleBar `#000B7B` | **The fullest Classic workbench**: 278 colour keys, semantic highlighting on. Unmaintained but complete. Its terminal ANSI colours are VSCode-default-ish, not CGA. |
| [Retro 95](https://marketplace.visualstudio.com/items?itemName=devdigest.retro-95-vscode-theme) ([repo](https://github.com/a-gubskiy/retro-95-vs-code)) | 363 | 2026-05-01 | `#FFFFFF` | `#C0C0C0` everywhere; statusBar + titleBar `#000080` | 311 colour keys, 19 semantic token rules. **The terminal is already `#000000`.** New and small, but active. |
| [Mod95](https://marketplace.visualstudio.com/items?itemName=rebootingTools.mod95) ([repo](https://github.com/rebooting/mod95)) | 495 | 2025-03-15 (repo pushed 2026-08) | `#ffffff` | `#c0c0c0`/`#c7c7c7`, statusBar `#c0c0c0`, titleBar `#000b7b` | 273 keys. It looks derived from Windows NT. |
| [OptiDev Retro Windows Themes](https://marketplace.visualstudio.com/items?itemName=soonland.vscode-optidev-themes) ([repo](https://github.com/soonland/vscode-optidev-themes)) | 4,605 | 2026-07-13 | `#FFFFFF` | Win 3.1 Classic: `#C0C0C0`; Win 98: `#DDDDDD`; XP Light: sideBar `#ECE9D8`, bars `#3A6EA5` | 10 variants (3.1, 98, 98 Eggplant/Desert/Rainy Day, ME, XP Light/Dark/Blue, 7). The most actively maintained. Only 22 token rules, so syntax colouring is thin. |
| [@nulzo Retro Light](https://marketplace.visualstudio.com/items?itemName=nulzo.nulzo-retro-light) | 133 | 2024-10-14 | `#ffffff` | `#c3c3c3`, bars `#818181` | 352 keys, 250 token rules. Detailed, but tiny and unmaintained. |
| [WinClassic](https://marketplace.visualstudio.com/items?itemName=disk0.win-classic-theme) ([repo](https://github.com/disco0/win-classic-theme)) | 5,192 | 2021-05-07 | `#EFEFEF` | activityBar `#D4D0C8` (the Win2000 "cream"), sideBar `#EEEEEE`, statusBar `#0000A2` | Abandoned. Its `#D4D0C8` is a useful reference for the cream variant. |
| [win95](https://marketplace.visualstudio.com/items?itemName=asilva.win95) ([repo](https://github.com/arxdsilva/win95)) | 6,719 | 2026-09-14 | **`#C0C0C0`** | activityBar `#00007F`, statusBar `#018283` (teal) | Only 15 workbench keys, so most of the chrome falls back to VS light defaults. The grey *editor* is the opposite of what we want. |
| [Windows98Theme](https://marketplace.visualstudio.com/items?itemName=thounny.windows98-theme) | 538 | 2024-11-09 | `#C3C7CB` | `#B0B0B0` | Only 11 keys. Thin. |

### XP Luna (blue/cream chrome)

| Extension | Installs | Last update | editor bg | Notes |
|---|---|---|---|---|
| [Win XP](https://marketplace.visualstudio.com/items?itemName=sinedied.vscode-windows-xp-theme) ([repo](https://github.com/sinedied/vscode-win-xp-theme), 56 stars) | 30,299 | 2025-07-24 | `#fff` | The most popular retro-Windows theme. sideBar `#f0eee4` (cream), activity/status/title bars `#2157d7` (Luna blue). 186 keys. The terminal is black with `#00c000`-style ANSI. |
| [Windows XP Dark](https://marketplace.visualstudio.com/items?itemName=mssjim.windows-xp-dark) | 4,098 | 2024-03-22 | `#212122` | A dark editor, but the sidebar is dark too (`#191919`) and only the bars are Luna blue. Not grey. |
| [Vintage Windows Machine](https://marketplace.visualstudio.com/items?itemName=theedvinjoseph.vintage-windows-machine-theme) | 3,442 | 2025-07-06 | `#ffffff` | activityBar `#ece9d8`, sideBar `#f0eee4`. XP cream. |

### Dark DOS / TC2000-ish editors (Work surface donors), with dark chrome

| Extension | Installs | Last update | Notes |
|---|---|---|---|
| [Oldschool Theme: Windows 95 Edition](https://marketplace.visualstudio.com/items?itemName=ericson-willians.oldschool-theme-win95-edition) ([repo](https://github.com/EricsonWillians/oldschool-theme)) | 7,694 | 2023-11-10 | 13 variants. **"Oldschool Terminal Theme (Green)"** has a `#000000` editor with ANSI `#33FF00`/`#FF0000`/`#FFFF00`/`#00FFFF`. "Very nostalgic" uses a `#003333` editor with `#808080`/`#505050` grey-*ish* (dark) chrome. All variants are `hc-black` with only 8 token rules, so they are crude. The original [Oldschool Theme](https://marketplace.visualstudio.com/items?itemName=EricsonWillians.oldschool-theme) has 37,408 installs but dates from 2021. |
| [Turbo C++](https://marketplace.visualstudio.com/items?itemName=VortekLabs.turbo-cpp-theme) | 1,454 | 2026-05-27 | `#0000AA` blue editor with `#FFFF55` text. The status and title bars **are `#AAAAAA` grey**. This is the DOS-IDE look, not TC2000, but the closest "grey bar + dark editor" combination found. |
| [Borland-theme](https://marketplace.visualstudio.com/items?itemName=kalk.borland) | 5,943 | 2019-11-09 | `#0100A4`/`#FFFF4E`. Abandoned. |
| [Retro Green Theme](https://marketplace.visualstudio.com/items?itemName=LelinPadhan.retro-green-theme-vscode) | 7,992 | 2026-02-20 | Phosphor green on `#121610` everywhere. Well-covered (241 token rules, semantic on), but monochrome, so no red/yellow/cyan data colours. |
| [Tinted VSCode](https://marketplace.visualstudio.com/items?itemName=TintedTheming.base16-tinted-themes) → `base16-windows-nt` | 3,457 | 2026-09-27 | The palette in the anchor section above, generated across the whole workbench. **The best Work surface donor.** |

**VSCode verdict:** There is no single theme to adopt. Two roughly equal-effort paths:

1. **Recommended: adopt Tinted VSCode `base16-windows-nt` (or `-95`)** for the editor, terminal and syntax. Add a `"[base16-windows-nt]"` block in `workbench.colorCustomizations` that sets activityBar, sideBar, tabs, editorGroupHeader, statusBar, titleBar and panel headers to `#C0C0C0`/`#D4D0C8` with black text. **Windows NT** (wassimdev) is the reference for which keys to set: its ~278 keys can be copied almost verbatim into the override block, minus the `editor.*` ones.
2. Fork Windows NT or Retro 95 into a local theme and swap the editor and token colours to the base16-windows-nt palette. This means more maintenance.

---

## Neovim (LazyVim)

### Candidates

| Colorscheme | Link | Maintenance | Closeness | Coverage / customisation |
|---|---|---|---|---|
| **base16-windows-nt / -95 / -highcontrast** via RRethy base16-nvim | [RRethy/base16-nvim](https://github.com/RRethy/base16-nvim) | 656 stars, pushed 2026-10-03 | **Work surface: exact** (black + VGA primaries + `#c0c0c0`). Chrome: StatusLine `base05` on `base02` (`#c0c0c0` on `#555555`), TabLine on `base01`, so dark grey rather than Classic grey. | Lua. About 127 treesitter `@` groups, 13 `@lsp.type.*` semantic groups, Diagnostic*/LspReference*, and integrations for telescope, cmp, blink, mini.completion, indent-blankline, notify, illuminate and dapui ([source](https://github.com/RRethy/base16-nvim/blob/master/lua/base16-colorscheme.lua)). `setup({base00=..., ...})` takes any 16-colour table, so a tweaked palette works without forking. |
| tinted-nvim | [tinted-theming/tinted-nvim](https://github.com/tinted-theming/tinted-nvim) | 41 stars, pushed 2026-10-03 | Same palettes | The official tinted-theming fork of the same idea. Pairs with `tinty` for switching every tool at once. |
| **mini.base16** (in mini.nvim) | [nvim-mini/mini.nvim](https://github.com/nvim-mini/mini.nvim), [readme](https://github.com/nvim-mini/mini.nvim/blob/main/readmes/mini-base16.md) | 9.5k stars, pushed 2026-10-03 | You feed it the windows-nt palette | Built-in LSP/diagnostic support and 30+ plugin integrations, including snacks, which-key, trouble, noice, lazy, gitsigns, fzf-lua and render-markdown. That makes it LazyVim-friendly. The best base if you want **a hand-tuned custom palette with maintained plugin coverage**. |
| `industry` (built into Nvim) | `$VIMRUNTIME/colors/industry.vim` (installed Nvim 0.10.0) | Ships with Neovim | Surprisingly close. `Normal` is `#dadada` on `#000000`, Type is `#00ff00`, Constant is `#00ffff`, PreProc/LineNr are `#ffff00`, Special is `#ff0000`, and **StatusLine is black on `#dadada` (light grey)**, TabLineFill `#6c6c6c`. | Vimscript legacy groups only. Treesitter/LSP groups fall back to Neovim's default `@x → Group` links, which is adequate but not tuned. No plugin integrations. |
| olive-crt.nvim | [vimcolorschemes/olive-crt.nvim](https://github.com/vimcolorschemes/olive-crt.nvim) | 15 stars, pushed 2026-05 | CRT olive tint, not TC2000 | Treesitter, diagnostics, LSP references, semantic tokens, common plugins. |
| pomatia.nvim | [aliqyan-21/pomatia.nvim](https://github.com/Aliqyan-21/pomatia.nvim) | 9 stars, pushed 2026-04 | "Saturated CRT", based on `evening.vim` | Treesitter + semantic tokens. |
| vhs-era-theme.nvim | [dont-be-evil-company/vhs-era-theme.nvim](https://github.com/dont-be-evil-company/vhs-era-theme.nvim) | 18 stars, pushed 2026-09 | 80s/90s pastel, not Win9x | — |
| matrix-nvim | [iruzo/matrix-nvim](https://github.com/iruzo/matrix-nvim) | 37 stars, pushed 2023-03 (stale) | Green monochrome | — |
| zenbones (current) | [zenbones-theme/zenbones.nvim](https://github.com/zenbones-theme/zenbones.nvim) | 1.1k stars, pushed 2026-06 | Low-contrast, the opposite of TC2000 | Lush-based. [lush.nvim](https://github.com/rktjmp/lush.nvim) (1.8k stars, pushed 2025-09) is a strong tool if we decide to write a fully custom scheme. |

I found no Win9x-*chrome* Neovim colorscheme (searched GitHub and the web).

### How hard is overriding the chrome groups to grey?

It's easy, with one LazyVim-specific catch:

- **Raw groups:** a `ColorScheme` autocmd that calls `vim.api.nvim_set_hl(0, "StatusLine", { fg = "#000000", bg = "#c0c0c0" })`, and the same for `StatusLineNC`, `TabLine`, `TabLineFill`, `TabLineSel`, `WinBar`, `WinBarNC`, `WinSeparator`, `NormalFloat`/`FloatBorder` and `Pmenu`. That's roughly 10 lines, and it survives colorscheme switches. RRethy base16-nvim also exposes `require('base16-colorscheme').colors` after load, so overrides can reference palette slots.
- **The catch:** LazyVim draws the statusline with **lualine**, not `StatusLine`. This repo's `nvim/lua/plugins/lualine.lua` uses `theme = "auto"`, which derives lualine's colours from the active colorscheme. To get a grey Frame statusline you need a **custom lualine theme table**: `normal/insert/visual/replace/command` × sections `a/b/c` with a grey bg and black fg, plus a navy `#000080` mode badge if you want XP-style title-bar blue. That's about 30 lines. Bufferline (LazyVim's tabline) also has its own `highlights` option. Both are ordinary `opts` overrides in LazyVim plugin specs.
- Purist fidelity note: this repo's lualine already uses empty section separators. LazyVim's default icons come from mini.icons and Nerd Font glyphs, which will need disabling separately (out of scope here).

**Neovim verdict:** **Adopt RRethy `base16-windows-nt` (or `windows-95` for the softer CGA tones) for the Work surface. Add a small grey-chrome override plus a custom lualine theme for the Frame.** If you later want to hand-tune the palette away from strict base16, move to `mini.base16` with the same palette, which gives better LazyVim plugin coverage. Use `industry` as a zero-install reference for the look.

---

## Ghostty

Built-in themes come from [mbadolato/iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) (27k stars, pushed 2026-10-04). They are vendored as the `iterm2_themes` dependency in [ghostty `build.zig.zon`](https://github.com/ghostty-org/ghostty/blob/main/build.zig.zon) and installed to `Ghostty.app/Contents/Resources/ghostty/themes` (463 files locally; `ghostty +list-themes` shows 506 including user themes). Custom themes go in `~/.config/ghostty/themes/`. A theme file is ordinary Ghostty config, and any `background`/`palette` set in the main config overrides the theme. Source: `ghostty +show-config --default --docs`, `theme` option.

There are no "Windows"-named themes built in. The closest by palette, read from the installed files:

| Theme | bg / fg | normal → bright (red, green, yellow, cyan) | Closeness |
|---|---|---|---|
| **CGA** | `#000000` / `#aaaaaa` | `#aa0000 #00aa00 #aa5500 #00aaaa` → `#ff5555 #55ff55 #ffff55 #55ffff` | **The exact IBM CGA/EGA palette**, which is also what Windows console used. Grey fg on black. Very close to TC2000. |
| **IBM 5153 CGA (Black)** | `#000000` / `#c4c4c4` | `#c40000 #00c400 #c47e00 #00c4c4` → `#dc4e4e #4edc4e #f3f34e #4ef3f3` | A slightly softened CGA. Also very close. |
| Homebrew | `#000000` / `#00ff00` | `#990000 #00a600 #999900 #00a6b2` → `#e50000 #00d900 #e5e500 #00e5e5` | Green-fg terminal. TC2000-ish brights. |
| Pro | `#000000` / `#f2f2f2` | same as Homebrew | macOS Terminal "Pro". Neutral. |
| Retro Legends | `#0d0d0d` / `#45eb45` | `#de5454 #45eb45 #f7bf2b #40d9e6` | Phosphor-green fg with real colours. |
| Retro | `#000000` / `#13a10e` | all 8 slots `#13a10e` | Monochrome. Unusable for data colours. |
| Borland | `#0000a4` / `#ffff4e` | — | DOS IDE blue. Not TC2000. |
| Apple Classic | `#2c2b2b` / `#d5a200` | `#c91b00 #00c200 #c7c400 #00c5c7` | Amber fg. |

Outside the built-ins, [tinted-terminal `base16-windows-nt`](https://github.com/tinted-theming/tinted-terminal/blob/main/themes/ghostty/base16-windows-nt) is drop-in Ghostty config. It is black/`#c0c0c0` with pure `#ff0000 #00ff00 #ffff00 #00ffff` (normal = bright) and sets search/selection colours. It's the same palette as the VSCode and Neovim picks above, so all three Work surfaces would match exactly.

**Purist fidelity in Ghostty (relevant to the current config):** `background-opacity` defaults to `1` and `background-blur-radius` is optional. The current config sets `0.85`/`20`, so both would need removing. `window-decoration = none` removes the macOS frame and rounded corners. `macos-titlebar-style = hidden` explicitly *keeps* the rounded corners (from the option docs).

**Ghostty verdict:** **Adopt as-is: built-in `CGA`** (zero install, the authentic palette), **or vendor `base16-windows-nt`** into `ghostty/themes/` so it matches VSCode and Neovim exactly. Either is a one-line change. No custom work is needed.

---

## Raycast

Facts from the [Raycast Manual, Themes](https://manual.raycast.com/themes):

- Custom themes are **Pro-only**.
- They are built in Theme Studio and shared as URLs or "Copy as JSON"; community themes are on themes.ray.so.
- The manual says nothing about corner radius, transparency/blur or fonts, and none of those are theme keys.

Gallery source: [raycast/ray-so `app/(navigation)/themes/themes/`](https://github.com/raycast/ray-so/tree/main/app/(navigation)/themes/themes) has about 100 JSON files. Every theme has exactly these slots: `background`, `backgroundSecondary`, `text`, `selection`, `loader`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `magenta`, plus `appearance: light|dark`. This repo already keeps one in that format (`raycast/github-dark-dimmed.rctheme.json`).

The gallery has no Windows/Classic/XP theme. The nearest entries:

- **Brutalist Light** (degouville): bg `#FFFFFF`, text/selection `#000000`, pure `#FF0000 #FFFF00 #00FF00 #0000FF #FF00FF`. Structurally closest (light Frame, saturated primaries), but white, not grey.
- **Sequoia Retro Light** (michael-andreuzza): bg `#EDEEF2`/`#E2E3E8`, muted earthy accents. Greyish, but not Classic.
- **Terminal** (per-tikaer): `#000000` bg, everything `#4AF626`. Phosphor, which fits a Work surface rather than the Frame.
- **Raycast Total Grey** (jag-k): near-black with grey accents.

**Raycast verdict:** **None close, so build custom.** The theme is 12 hex values. Suggested starting point: `appearance: light`, background `#C0C0C0` (or `#D4D0C8` cream), backgroundSecondary `#DFDFDF`, text `#000000`, selection `#000080`, and VGA-primary accents copied from Brutalist Light. Bevels, square corners and no blur can't be done through themes, so Purist fidelity is only partly reachable in Raycast.

---

## Bonus: SketchyBar and Starship

- **SketchyBar:** I found no Win95/XP SketchyBar configs worth borrowing (searched GitHub repos and code, and the web). Everything retro-taskbar is Windows-only ([RetroBar](https://github.com/dremin/RetroBar)) or Linux GTK ([Chicago95](https://github.com/grassmunk/Chicago95)), useful only as colour and pixel references. SketchyBar's own primitives ([items docs](https://felixkratz.github.io/SketchyBar/config/items)) are enough for a custom Classic taskbar:
  - `background.color/border_color/border_width/corner_radius=0`
  - a one-sided `shadow.angle/distance` for a fake bevel
  - `background.image` for a pixel "Start" button
  - bar-level `blur_radius=0`, `corner_radius=0`

  The current `sketchybarrc` uses `blur_radius=30`, `corner_radius=10` and `Hack Nerd Font` icons. All three conflict with Purist fidelity. **Build custom.**
- **Starship:** the official [Plain Text Symbols preset](https://starship.rs/presets/plain-text) (`starship preset plain-text-symbols`) turns every module symbol into text. The [No Nerd Fonts preset](https://starship.rs/presets/no-nerd-font) still allows emoji, so it fails Purist fidelity. This repo's `starship.toml` already looks largely plain-text (`git `, `C `, `.NET `), except for `➤` in `[character]`. No retro/Win95 Starship themes exist. Colours should just be ANSI names, so the terminal's base16-windows-nt/CGA palette carries through. **Adopt plain-text-symbols and tweak.**

---

## Per-tool shortlist

| Tool | Decision | Best candidate |
|---|---|---|
| **VSCode** | Adopt + override | [Tinted VSCode](https://marketplace.visualstudio.com/items?itemName=TintedTheming.base16-tinted-themes) `base16-windows-nt` (or `-95`) for the Work surface. Add a `"[base16-windows-nt]"` `workbench.colorCustomizations` block for the grey Frame, using [Windows NT](https://marketplace.visualstudio.com/items?itemName=wassimdev.windows-nt-vscode-theme) as the key/colour reference. Fallback: fork Windows NT or Retro 95 and darken the editor. |
| **Neovim** | Adopt + override | [RRethy/base16-nvim](https://github.com/RRethy/base16-nvim) `base16-windows-nt`, plus a `ColorScheme` autocmd for the grey chrome groups and a custom lualine theme. Use `mini.base16` if the palette gets hand-tuned. |
| **Ghostty** | Adopt | Built-in `CGA`, or vendor tinted-terminal `base16-windows-nt` to match VSCode/Neovim. Drop opacity/blur. |
| **Raycast** | None close, build custom | 12-slot JSON with a `#C0C0C0` background, black text, `#000080` selection. |
| **SketchyBar** | None close, build custom | Native primitives: flat grey bar, 0 radius, no blur, text labels. |
| **Starship** | Adopt preset | `plain-text-symbols`, with `➤` replaced. |

**Cross-tool note for the Theme spec:** basing the Work surface palette on tinted-theming's `windows-nt` (or `windows-95`) gives ready-made, matching ports for VSCode, Neovim, Ghostty, fzf, tmux, lazygit and delta. The Frame palette has no such shared source and will be hand-specified (`#C0C0C0` / `#D4D0C8` / `#000080` / `#808080` / `#FFFFFF` bevel highlight). It gets applied per tool through each tool's override layer.
