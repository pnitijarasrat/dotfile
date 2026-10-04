# dotfile

## Fonts

- **Work surface** (Ghostty, Neovim, VSCode editor): **Fixedsys Excelsior** (kika build, CC0), committed in `fonts/` (#12). Run `./fonts/install.sh` to copy every font in `fonts/` into `~/Library/Fonts`. The fallback chain is Fixedsys Excelsior → Menlo → Thonburi, written into each tool's config. See `fonts/README.md` for the font's source and license.
- **SketchyBar** uses Microsoft Sans Serif and Tahoma Bold (for Start and the task button), both bundled with macOS. Its icons are PNGs in `sketchybar/icons/`, so it needs no Nerd Font.
- **Nerd Fonts:** none are needed. Hack, DejaVuSansM and Meslo were removed after #9. JetBrains Mono Nerd Font is still installed but unused (it was only for iTerm2, which is gone) and can be removed.

## VSCode

VSCode's user settings live in `vscode/settings.json` (#18). Symlink them into place, moving any existing file aside first:

```sh
cd ~/Library/Application\ Support/Code/User
[ -e settings.json ] && [ ! -L settings.json ] && mv settings.json settings.json.pre-dotfile.bak
ln -sf ~/.config/vscode/settings.json settings.json
```

The editor font settings follow the Work surface fonts in `docs/theme-spec.md`.

The color theme is a local extension, "Vintage", in `vscode/vintage-theme` (#19). Symlink it into VSCode's extensions folder, then reload VSCode (`Developer: Reload Window`). `settings.json` already selects it with `workbench.colorTheme`:

```sh
ln -sfn ~/.config/vscode/vintage-theme ~/.vscode/extensions/pnitijarasrat.vintage
```
