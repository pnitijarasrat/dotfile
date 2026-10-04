# Dotfiles

Personal macOS configuration for the tools in `~/.config` (plus VSCode, symlinked in).

## Language

**Vintage theme**:
The single look shared across every themed tool: a Windows Classic/XP **Frame** around light, K-95-style **Work surfaces**.
_Avoid_: retro theme, skin

**Frame**:
The chrome surrounding work: menu bar (SketchyBar), window borders, launcher (Raycast), wallpaper, accent color, and the chrome inside apps (VSCode activity bar/sidebar/tabs/status bar, Neovim statusline). Menus and pickers count as Frame too (command palette, context menus, notifications, which-key, telescope). Light grey/cream, Classic/XP-styled.
_Avoid_: UI, shell

**Work surface**:
Where text and code are read and edited: terminal, editors, TUI apps, and inline popups that show code (completion, hover, signature help, diagnostics). Light, K-95-style canvas (navy text on white, as in Kermit 95 on Windows) with Windows VGA data colors. Always light: no dark variant.
_Avoid_: editor theme, canvas

**Frame data colors**:
The darker set of data colors (Win95 dark VGA) used when red/green/yellow etc. appear on the **Frame** grey.
_Avoid_: dark palette, light-mode colors

**Theme spec**:
The locked description of the **Vintage theme**: palette, fonts, and a per-tool decision of how it adopts them. It's the destination of the vintage-theme map, and comes before any re-theming.

**Purist fidelity**:
The standing rule for the **Vintage theme**: no transparency or blur, square corners, no Nerd Font icons or emoji. Fonts are chosen for crisp reading on Retina rather than as literal bitmaps.

## Relationships

- The **Vintage theme** is made of exactly one **Frame** palette and one **Work surface** palette
- Each themed tool belongs to either the **Frame** or a **Work surface**
- The **Theme spec** is subject to **Purist fidelity**
