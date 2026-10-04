# dotfile

## Fonts

- **Work surface** (Ghostty, Neovim, VSCode editor and terminal): **Fixedsys Excelsior** (kika build, CC0), committed in `fonts/` (#12). Run `./fonts/install.sh` to copy every font in `fonts/` into `~/Library/Fonts`. The fallback chain is Fixedsys Excelsior → Menlo → Thonburi, written into each tool's config. See `fonts/README.md` for the font's source and license.
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

Check the theme against `docs/theme-spec.md` (palette, and the color keys the installed VSCode knows) with `node vscode/tests/vintage_test.mjs`.

## Raycast

The launcher theme is "Vintage", in `raycast/vintage.rctheme.json` (#21). Raycast keeps its own copy of imported themes and can't read the file directly. Run `node raycast/import.mjs` to open the theme in Raycast (the same `raycast://theme` link as "Add to Raycast" on themes.ray.so), add it, then select **Vintage** in Settings → Appearance. Re-run it after changing the file. Custom themes need Raycast Pro.

Check the theme against `docs/theme-spec.md` with `node raycast/tests/vintage_test.mjs`.

## Chrome

The window theme is a local extension, "Vintage", in `chrome/vintage-theme` (#37). Load it once: open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick `~/.config/chrome/vintage-theme` (the file picker hides `.config`; press Cmd+Shift+. to show it, or Cmd+Shift+G to type the path). To reload after changing `manifest.json`, run **Load unpacked** on the same folder again. To go back to the default look, use **Reset to default** under Settings → Appearance → Theme.

Check the theme against `docs/theme-spec.md` (palette, and the color keys the installed Chrome knows) with `node chrome/tests/vintage_test.mjs`.
