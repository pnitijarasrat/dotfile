-- add ~ on blank lines
vim.opt.fillchars:append({ eob = "~" })

-- format myself
vim.g.autoformat = false
vim.opt.tabstop = 4        -- Number of spaces a <Tab> counts for
vim.opt.shiftwidth = 4     -- Number of spaces for indentation
vim.opt.expandtab = true   -- Use spaces instead of tabs
vim.opt.autoindent = true  -- Copy indentation from the previous line
vim.opt.smartindent = true -- Automatically insert extra indentation in some cases
