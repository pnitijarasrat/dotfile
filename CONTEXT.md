# Dotfiles

Personal macOS configuration for the tools in `~/.config` (plus VSCode, symlinked in).

## Language

**Theme**:
One complete look applied to every tool in the **Switch** at once: its palettes, fonts, and any shapes it's allowed to change. Exactly one Theme is active at a time; tools in the Switch never mix Themes. Neovim, Spotify, Raycast and the Claude Code Event Viewer stay out of the Switch and always show the **Vintage theme**.
_Avoid_: skin, colorscheme (for the whole look; a tool's colorscheme is just its part of a Theme)

**Switch**:
Making a different **Theme** the active one, across every tool in the Switch together.

**Vintage theme**:
The first **Theme**: a Windows Classic/XP **Frame** around light, K-95-style **Work surfaces**.
_Avoid_: retro theme

**Marigold theme**:
The second **Theme**: dark and modern, black with a marigold accent. Its **Frame** and **Work surface** are one family, the Frame a step above, and it has no **Display**.
_Avoid_: dark theme, modern theme

**Frame**:
The chrome surrounding work: menu bar (SketchyBar), window borders, launcher (Raycast), wallpaper, accent color, and the chrome inside apps (VSCode activity bar/sidebar/tabs/status bar, Neovim statusline). Menus and pickers count as Frame too (command palette, context menus, notifications, which-key, telescope). Under the **Vintage theme**, light grey/cream, Classic/XP-styled.
_Avoid_: UI, shell

**Work surface**:
Where text and code are read and edited: terminal, editors, TUI apps, and inline popups that show code (completion, hover, signature help, diagnostics). Light, K-95-style canvas (navy text on white, as in Kermit 95 on Windows) with Windows VGA data colors. Always light: no dark variant.
_Avoid_: editor theme, canvas

**Display**:
A black LCD readout set into the **Frame**, like the time and track displays in Windows' Media Rack: lit cyan text in the **Work surface** font over unlit "ghost" segments, inside a sunken bevel. Shows status, not text being worked on. Only the **Vintage theme** has one: in Spotify's player bar and the Claude Code Event Viewer.
_Avoid_: LCD theme, screen

**Frame data colors**:
The darker set of data colors (Win95 dark VGA) used when red/green/yellow etc. appear on the **Frame** grey.
_Avoid_: dark palette, light-mode colors

**Theme spec**:
The locked description of one **Theme**: its roles, fonts, **Theme rules**, and a per-tool decision of how it adopts them, including which tools get a design of their own under it. One per Theme: `docs/theme-spec.md` for the **Vintage theme**, `docs/theme-spec-marigold.md` for the **Marigold theme**. It names the roles; their values live in the Theme's **Theme source file**.

**Theme source file**:
The one file that holds a **Theme**'s values: every role's hex, its fonts, and its **Theme rules** as numbers (`themes/vintage.json` for the **Vintage theme**, `themes/marigold.json` for the **Marigold theme**). Tools' tests read their expected values from it.
_Avoid_: palette file, tokens (for the whole file)

**Theme rules**:
A **Theme**'s own rules for corners, transparency and blur, shadows and icons. Each Theme carries its own; a tool follows the active Theme's.
_Avoid_: style, fidelity (for any Theme but Vintage)

**Purist fidelity**:
The **Vintage theme**'s **Theme rules**: no transparency or blur, square corners, no Nerd Font icons or emoji. Fonts are vector faces chosen for reading on Retina at plain sizes, not bitmap fonts at whole-pixel sizes.

## Relationships

- A **Switch** changes the active **Theme** for every tool in the Switch together; Neovim, Spotify, Raycast and the Claude Code Event Viewer stay on the **Vintage theme**
- Exactly one **Theme** is active; each **Theme** has one **Theme source file** and one **Theme spec**
- The **Vintage theme** is made of exactly one **Frame** palette, one **Work surface** palette and one **Display** palette
- The **Marigold theme** is made of one **Frame** palette and one **Work surface** palette; where Vintage draws a **Display**, it uses Frame colors
- A **Switch** may reshape a tool, not just recolor it, where the Theme's **Theme spec** gives that tool a design of its own
- Each themed tool belongs to either the **Frame** or a **Work surface**; a **Display** sits inside the **Frame**
- Each **Theme spec** is subject to its Theme's **Theme rules**: **Purist fidelity** for the **Vintage theme**
