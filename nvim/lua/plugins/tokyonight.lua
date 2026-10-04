-- Kept installed (matches ThePrimeagen/neovimrc, which also keeps tokyonight
-- as a second option) but not the active colorscheme — rose-pine.lua sets
-- that. Options mirror his tokyonight setup in case you switch back with
-- :colorscheme tokyonight-storm.
return {
  {
    "folke/tokyonight.nvim",
    lazy = true,
    priority = 1000,
    opts = {
      style = "storm",
      transparent = true,
      terminal_colors = true,
      styles = {
        comments = { italic = false },
        keywords = { italic = false },
        sidebars = "dark",
        floats = "dark",
      },
    },
  },
}
