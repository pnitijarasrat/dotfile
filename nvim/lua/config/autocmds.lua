-- add ~ on blank lines
vim.opt.fillchars:append({ eob = "~" })

-- format myself
vim.g.autoformat = true
-- vim.opt.tabstop = 4        -- Number of spaces a <Tab> counts for
-- vim.opt.shiftwidth = 4     -- Number of spaces for indentation
-- vim.opt.expandtab = true   -- Use spaces instead of tabs
-- vim.opt.autoindent = true  -- Copy indentation from the previous line
-- vim.opt.smartindent = true -- Automatically insert extra indentation in some cases

-- Wide tables wrap into an unreadable mess, so markdown doesn't wrap
-- (LazyVim wraps it by default). <leader>uw toggles wrap back on for prose.
vim.api.nvim_create_autocmd("FileType", {
  group = vim.api.nvim_create_augroup("markdown_nowrap", { clear = true }),
  pattern = { "markdown" },
  callback = function()
    vim.opt_local.wrap = false
  end,
})
