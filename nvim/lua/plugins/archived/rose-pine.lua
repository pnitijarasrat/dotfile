-- Based on ThePrimeagen/neovimrc's ColorMyPencils(): Normal/NormalFloat/sign
-- column stay transparent (terminal background shows through). The
-- highlighted bars — cursorline, folded headings, statusline, tabline,
-- popup menu — get an explicit neutral gray instead of rose-pine's own
-- purple-tinted surface color.
--
-- NOTE: these overrides are wired to the ColorScheme autocmd (not just run
-- once here) because LazyVim's own `opts.colorscheme = "rose-pine"` (see
-- colorscheme.lua) re-applies the plain colorscheme after this file's
-- config() runs, which would otherwise wipe out the gray overrides below.
local function apply_overrides()
  local gray800 = "#26282b"
  local gray900 = "#1b1d1f"
  local gray200 = "#c9cdd2"
  local gray400 = "#9ea4aa"

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

  hl(0, "CursorLine", { bg = gray800 })

  -- Explicit gray instead of rose-pine's purple surface color.
  hl(0, "Folded", { bg = gray800 })
  hl(0, "FoldColumn", { bg = gray900 })

  -- The filename/status line: bright gray bar, dark text — real contrast
  -- instead of a dark-on-dark tint.
  hl(0, "StatusLine", { bg = gray200, fg = gray900 })
  hl(0, "StatusLineNC", { bg = gray800, fg = gray900 })
  hl(0, "TabLine", { bg = gray800 })
  hl(0, "TabLineFill", { bg = gray900 })
  hl(0, "TabLineSel", { bg = gray900 })
  hl(0, "Pmenu", { bg = gray800 })
  hl(0, "WinBar", { bg = gray800 })
  hl(0, "WinBarNC", { bg = gray800 })
  hl(0, "FloatBorder", { bg = "none", fg = gray800 })
  hl(0, "WinSeparator", { bg = "none", fg = gray800 })
  hl(0, "VertSplit", { bg = "none", fg = gray800 })

  -- NOTE: org agenda / TODO state colors (DONE, Scheduled, Deadline
  -- upcoming/exceeding) are NOT set here — orgmode defines its own agenda
  -- highlight groups lazily, whenever the agenda plugin/buffer actually
  -- loads, which happens AFTER this ColorScheme-driven override and wins
  -- the race for some of the groups. Those overrides now live in org.lua,
  -- reapplied every time the orgagenda buffer opens, so they always run
  -- last. See lua/plugins/org.lua.
end

function ColorMyPencils(color)
  color = color or "rose-pine"
  vim.cmd.colorscheme(color)
  apply_overrides()
end

return {
  {
    "rose-pine/neovim",
    name = "rose-pine",
    lazy = false,
    priority = 1000,
    config = function()
      require("rose-pine").setup({
        disable_background = true,
      })

      -- Re-apply the gray overrides every time rose-pine is (re)loaded,
      -- including LazyVim's own automatic colorscheme application.
      vim.api.nvim_create_autocmd("ColorScheme", {
        pattern = "rose-pine",
        callback = apply_overrides,
      })

      ColorMyPencils()
    end,
  },
}
