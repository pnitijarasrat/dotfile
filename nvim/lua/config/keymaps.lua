local opts = { noremap = true, silent = true }
vim.keymap.set("n", "<C-d>", "<C-d>zz", opts)
vim.keymap.set("n", "<C-u>", "<C-u>zz", opts)
vim.keymap.set("n", "n", "nzz", opts)
vim.keymap.set("n", "N", "Nzz", opts)
vim.keymap.set("n", "<leader>w", ":w<cr>", opts)
vim.keymap.set("n", "<leader>wa", ":wa<cr>", opts)
vim.keymap.set("n", "<leader>ww", ":wqa<cr>", opts)
vim.keymap.set("n", "<leader>s", ":%s/", opts)
