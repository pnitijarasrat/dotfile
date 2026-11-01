-- noice draws LSP hover and signature help; give them the rounded border every
-- other inline code popup gets from winborder (lua/config/options.lua).
return {
  "folke/noice.nvim",
  opts = {
    presets = { lsp_doc_border = true },
  },
}
