-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- VSCode-style keys (README.md, "Neovim keys"). Ghostty forwards the Cmd keys
-- as CSI-u sequences (ghostty/config), which Neovim reads as <D-…>.
local map = vim.keymap.set

map({ "n", "i", "x", "s" }, "<D-s>", "<cmd>w<cr><esc>", { desc = "Save File" })
map("n", "<D-z>", "u", { desc = "Undo" })
map("i", "<D-z>", "<C-o>u", { desc = "Undo" })
map("n", "<D-S-z>", "<C-r>", { desc = "Redo" })
map("i", "<D-S-z>", "<C-o><C-r>", { desc = "Redo" })
map("n", "<D-/>", "gcc", { remap = true, desc = "Toggle Comment" })
map("x", "<D-/>", "gc", { remap = true, desc = "Toggle Comment" })
-- Alt+arrows do what LazyVim's <A-j>/<A-k> do, with the same commands.
map("n", "<A-Down>", "<cmd>execute 'move .+' . v:count1<cr>==", { desc = "Move Down" })
map("n", "<A-Up>", "<cmd>execute 'move .-' . (v:count1 + 1)<cr>==", { desc = "Move Up" })
map("i", "<A-Down>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move Down" })
map("i", "<A-Up>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move Up" })
map("x", "<A-Down>", ":<C-u>execute \"'<,'>move '>+\" . v:count1<cr>gv=gv", { desc = "Move Down" })
map("x", "<A-Up>", ":<C-u>execute \"'<,'>move '<-\" . (v:count1 + 1)<cr>gv=gv", { desc = "Move Up" })

-- Each opens what LazyVim's own key for it opens (the comment names it).
-- stylua: ignore start
map("n", "<D-p>", function() LazyVim.pick("files")() end, { desc = "Find Files (Root Dir)" }) -- <leader>ff
map("n", "<D-S-f>", function() LazyVim.pick("grep")() end, { desc = "Grep (Root Dir)" }) -- <leader>/
map("n", "<D-b>", function() Snacks.explorer({ cwd = LazyVim.root() }) end, { desc = "Explorer (Root Dir)" }) -- <leader>e
map({ "n", "x" }, "<D-.>", function() vim.lsp.buf.code_action() end, { desc = "Code Action" }) -- <leader>ca
map("n", "<D-S-o>", function() Snacks.picker.lsp_symbols({ filter = LazyVim.config.kind_filter }) end, { desc = "LSP Symbols" }) -- <leader>ss
map("n", "<F12>", function() Snacks.picker.lsp_definitions() end, { desc = "Goto Definition" }) -- gd
-- Most terminals send Shift+F12 as F24.
for _, key in ipairs({ "<S-F12>", "<F24>" }) do
  map("n", key, function() Snacks.picker.lsp_references() end, { desc = "References" }) -- gr
end
map("n", "<F2>", function() vim.lsp.buf.rename() end, { desc = "Rename" }) -- <leader>cr
map({ "n", "t" }, "<C-`>", function() Snacks.terminal.focus(nil, { cwd = LazyVim.root() }) end, { desc = "Terminal (Root Dir)" }) -- <C-/>
-- stylua: ignore end
