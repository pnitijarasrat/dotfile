-- Based on ThePrimeagen/neovimrc's ColorMyPencils(): Normal/NormalFloat/sign
-- column stay transparent (terminal background shows through). The
-- highlighted bars — cursorline, folded headings, statusline, tabline,
-- popup menu — get an explicit neutral gray instead of Everforest's own
-- surface color, matching the previous rose-pine setup's look and feel.
--
-- NOTE: these overrides are wired to the ColorScheme autocmd (not just run
-- once here) because LazyVim's own `opts.colorscheme = "everforest"` (see
-- colorscheme.lua) re-applies the plain colorscheme after this file's
-- config() runs, which would otherwise wipe out the gray overrides below.
local function apply_overrides()
  local bg1 = "#272E33" -- everforest dark hard bg1
  local bg0 = "#1E2326" -- everforest dark hard bg0
  local grey2 = "#9DA9A0" -- everforest dark hard grey2 (brightest grey)

  local hl = vim.api.nvim_set_hl

  -- Fully transparent: shows the terminal's own background.
  local transparent_groups = {
    "Normal",
    "NormalNC",
    "NormalFloat",
    "SignColumn",
  }
  for _, group in ipairs(transparent_groups) do
    hl(0, group, { bg = "none" })
  end

  hl(0, "CursorLine", { bg = bg1 })

  -- Explicit gray instead of Everforest's own surface color.
  hl(0, "Folded", { bg = bg1 })
  hl(0, "FoldColumn", { bg = bg0 })

  -- The filename/status line: bright gray bar, dark text — real contrast
  -- instead of a dark-on-dark tint.
  hl(0, "StatusLine", { bg = grey2, fg = bg0 })
  hl(0, "StatusLineNC", { bg = bg1, fg = bg0 })
  hl(0, "TabLine", { bg = bg1 })
  hl(0, "TabLineFill", { bg = bg0 })
  hl(0, "TabLineSel", { bg = bg0 })
  hl(0, "Pmenu", { bg = bg1 })
  hl(0, "WinBar", { bg = bg1 })
  hl(0, "WinBarNC", { bg = bg1 })
  hl(0, "FloatBorder", { bg = "none", fg = bg1 })
  hl(0, "WinSeparator", { bg = "none", fg = bg1 })
  hl(0, "VertSplit", { bg = "none", fg = bg1 })

  -- NOTE: org agenda / TODO state colors (DONE, Scheduled, Deadline
  -- upcoming/exceeding) are NOT set here — orgmode defines its own agenda
  -- highlight groups lazily, whenever the agenda plugin/buffer actually
  -- loads, which happens AFTER this ColorScheme-driven override and wins
  -- the race for some of the groups. Those overrides now live in org.lua,
  -- reapplied every time the orgagenda buffer opens, so they always run
  -- last. See lua/plugins/org.lua.
end

function ColorMyPencils(color)
  color = color or "everforest"
  vim.cmd.colorscheme(color)
  apply_overrides()
end

return {
  {
    "sainnhe/everforest",
    lazy = false,
    priority = 1000,
    config = function()
      vim.g.everforest_background = "hard"
      vim.g.everforest_transparent_background = 1
      vim.g.everforest_enable_italic = 1

      -- Re-apply the gray overrides every time everforest is (re)loaded,
      -- including LazyVim's own automatic colorscheme application.
      vim.api.nvim_create_autocmd("ColorScheme", {
        pattern = "everforest",
        callback = apply_overrides,
      })

      ColorMyPencils()
    end,
  },
}
