-- Marigold theme (docs/theme-spec-marigold.md): colors/marigold.lua, which reads
-- themes/marigold.json. Neovim stays out of the Switch, so this is its colorscheme
-- whatever Theme is active (docs/adr/0014). colors/vintage.lua stays selectable.
-- LazyVim's bundled colorschemes are switched off.
return {
  { "LazyVim/LazyVim", opts = { colorscheme = "marigold" } },
  { "folke/tokyonight.nvim", enabled = false },
  { "catppuccin/nvim", name = "catppuccin", enabled = false },
}
