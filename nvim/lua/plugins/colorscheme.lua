-- Vintage theme (docs/theme-spec.md): the hand-written colors/vintage.lua.
-- LazyVim's bundled colorschemes are switched off.
return {
  { "LazyVim/LazyVim", opts = { colorscheme = "vintage" } },
  { "folke/tokyonight.nvim", enabled = false },
  { "catppuccin/nvim", name = "catppuccin", enabled = false },
}
