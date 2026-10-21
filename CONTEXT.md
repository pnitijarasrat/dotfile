# Dotfiles

Personal macOS configuration for the tools in `~/.config` (plus VSCode, symlinked in).

## Language

**Theme**:
One complete look applied to every themed tool at once: its palettes, fonts, and any shapes it's allowed to change. Exactly one Theme is active at a time; tools never mix Themes.
_Avoid_: skin, colorscheme (for the whole look; a tool's colorscheme is just its part of a Theme)

**Switch**:
Making a different **Theme** the active one, across every themed tool together.

**Vintage theme**:
The first **Theme**: a Windows Classic/XP **Frame** around light, K-95-style **Work surfaces**.
_Avoid_: retro theme

**Frame**:
The chrome surrounding work: menu bar (SketchyBar), window borders, launcher (Raycast), wallpaper, accent color, and the chrome inside apps (VSCode activity bar/sidebar/tabs/status bar, Neovim statusline). Menus and pickers count as Frame too (command palette, context menus, notifications, which-key, telescope). Light grey/cream, Classic/XP-styled.
_Avoid_: UI, shell

**Work surface**:
Where text and code are read and edited: terminal, editors, TUI apps, and inline popups that show code (completion, hover, signature help, diagnostics). Light, K-95-style canvas (navy text on white, as in Kermit 95 on Windows) with Windows VGA data colors. Always light: no dark variant.
_Avoid_: editor theme, canvas

**Display**:
A black LCD readout set into the **Frame**, like the time and track displays in Windows' Media Rack: lit cyan text in the **Work surface** font over unlit "ghost" segments, inside a sunken bevel. Shows status, not text being worked on. Only Spotify's player bar has one.
_Avoid_: LCD theme, screen

**Frame data colors**:
The darker set of data colors (Win95 dark VGA) used when red/green/yellow etc. appear on the **Frame** grey.
_Avoid_: dark palette, light-mode colors

**Theme spec**:
The locked description of the **Vintage theme**: its roles, fonts, and a per-tool decision of how it adopts them. It's the destination of the vintage-theme map, and comes before any re-theming. It names the roles; their values live in the **Theme source file**.

**Theme source file**:
The one file that holds a **Theme**'s values: every role's hex and its fonts (`themes/vintage.json` for the **Vintage theme**). Tools' tests read their expected values from it.
_Avoid_: palette file, tokens (for the whole file)

**Purist fidelity**:
The **Vintage theme**'s own rules (each **Theme** carries its own rules for corners, blur and icons): no transparency or blur, square corners, no Nerd Font icons or emoji. Fonts are vector faces chosen for reading on Retina at plain sizes, not bitmap fonts at whole-pixel sizes.

## Relationships

- A **Switch** changes the active **Theme** for every themed tool together
- Exactly one **Theme** is active; each **Theme** has one **Theme source file**
- The **Vintage theme** is made of exactly one **Frame** palette, one **Work surface** palette and one **Display** palette
- Each themed tool belongs to either the **Frame** or a **Work surface**; a **Display** sits inside the **Frame**
- The **Theme spec** is subject to **Purist fidelity**, the **Vintage theme**'s rules
