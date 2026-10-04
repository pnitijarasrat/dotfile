-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
-- vim.cmd.colorscheme = nil
-- vim.opt.termguicolors = false
-- vim.cmd("set t_Co=256")

-- Interface-only settings matched from ThePrimeagen/neovimrc (lua/theprimeagen/set.lua).
-- Keymaps are untouched — see lua/config/keymaps.lua.
vim.opt.guicursor = ""
vim.opt.scrolloff = 8
vim.opt.colorcolumn = "80"
vim.opt.signcolumn = "yes"

-- Vintage theme: inline code popups get a 1px single border. Deviation (see
-- docs/theme-spec.md, Deviations): `winborder` is Neovim 0.11+, so on older
-- versions the LSP hover and signature help floats are set directly. Diagnostic
-- floats are set on every version; blink.cmp's are in lua/plugins/blink.lua.
if vim.fn.exists("+winborder") == 1 then
  vim.opt.winborder = "single"
else
  vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, { border = "single" })
  vim.lsp.handlers["textDocument/signatureHelp"] =
    vim.lsp.with(vim.lsp.handlers.signature_help, { border = "single" })
end
vim.diagnostic.config({ float = { border = "single" } })
