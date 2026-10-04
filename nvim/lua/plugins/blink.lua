-- Completion and docs are inline code popups: Work surface
-- with a 1px single border (colors in colors/vintage.lua). Set per popup instead
-- of through `winborder`, which Neovim 0.10 lacks (docs/theme-spec.md, Deviations).
return {
  "saghen/blink.cmp",
  opts = {
    completion = {
      menu = { border = "single" },
      documentation = { window = { border = "single" } },
    },
  },
}
