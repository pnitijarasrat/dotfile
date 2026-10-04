-- ~/.config/nvim/colors/grayscale.lua
vim.cmd("highlight clear")
if vim.fn.exists("syntax_on") then
  vim.cmd("syntax reset")
end
vim.o.background = "dark"
vim.g.colors_name = "grayscale"

local c = {
  gray900 = "#1b1d1f",
  gray800 = "#26282b",
  gray600 = "#454c53",
  gray500 = "#72787f",
  gray400 = "#9ea4aa",
  gray200 = "#c9cdd2",
  gray100 = "#ebebed",
  gray50 = "#f7f8f9",

  red = "#b06a6a",
  green = "#7a9b7a",
  yellow = "#c9b26b",
  blue = "#6f8fae",
  purple = "#a687b0",
  cyan = "#6ba3a3",

  red_bright = "#d18f8f",
  green_bright = "#9fc49f",
  yellow_bright = "#e0c98f",
}

local hl = vim.api.nvim_set_hl

hl(0, "Normal", { fg = c.gray100, bg = c.gray900 })
hl(0, "NormalFloat", { fg = c.gray100, bg = c.gray800 })
hl(0, "Cursor", { fg = c.gray900, bg = c.gray50 })
hl(0, "CursorLine", { bg = c.gray800 })
hl(0, "CursorLineNr", { fg = c.gray50, bold = true })
hl(0, "LineNr", { fg = c.gray600 })
hl(0, "SignColumn", { bg = c.gray900 })
hl(0, "ColorColumn", { bg = c.gray800 })
hl(0, "Visual", { bg = c.gray600 })
hl(0, "Search", { fg = c.gray900, bg = c.yellow })
hl(0, "IncSearch", { fg = c.gray900, bg = c.yellow_bright })
hl(0, "Pmenu", { fg = c.gray100, bg = c.gray800 })
hl(0, "PmenuSel", { fg = c.gray900, bg = c.gray200 })
hl(0, "StatusLine", { fg = c.gray100, bg = c.gray800 })
hl(0, "StatusLineNC", { fg = c.gray500, bg = c.gray800 })
hl(0, "VertSplit", { fg = c.gray600 })
hl(0, "WinSeparator", { fg = c.gray600 })
hl(0, "TabLine", { fg = c.gray400, bg = c.gray800 })
hl(0, "TabLineSel", { fg = c.gray50, bg = c.gray900, bold = true })
hl(0, "Directory", { fg = c.blue })
hl(0, "Folded", { fg = c.gray400, bg = c.gray800 })
hl(0, "MatchParen", { fg = c.gray50, bg = c.gray600, bold = true })
hl(0, "NonText", { fg = c.gray600 })
hl(0, "Whitespace", { fg = c.gray600 })
hl(0, "EndOfBuffer", { fg = c.gray900 })

hl(0, "Comment", { fg = c.gray500, italic = true })
hl(0, "Constant", { fg = c.cyan })
hl(0, "String", { fg = c.green })
hl(0, "Character", { fg = c.green })
hl(0, "Number", { fg = c.yellow })
hl(0, "Boolean", { fg = c.yellow })
hl(0, "Identifier", { fg = c.gray100 })
hl(0, "Function", { fg = c.blue, bold = true })
hl(0, "Statement", { fg = c.purple })
hl(0, "Conditional", { fg = c.purple })
hl(0, "Repeat", { fg = c.purple })
hl(0, "Keyword", { fg = c.purple, bold = true })
hl(0, "Operator", { fg = c.gray200 })
hl(0, "PreProc", { fg = c.cyan })
hl(0, "Type", { fg = c.yellow })
hl(0, "Special", { fg = c.cyan })
hl(0, "Underlined", { fg = c.blue, underline = true })
hl(0, "Error", { fg = c.red_bright, bold = true })
hl(0, "Todo", { fg = c.gray900, bg = c.yellow, bold = true })

hl(0, "DiagnosticError", { fg = c.red })
hl(0, "DiagnosticWarn", { fg = c.yellow })
hl(0, "DiagnosticInfo", { fg = c.blue })
hl(0, "DiagnosticHint", { fg = c.cyan })
hl(0, "DiagnosticUnderlineError", { undercurl = true, sp = c.red })
hl(0, "DiagnosticUnderlineWarn", { undercurl = true, sp = c.yellow })
hl(0, "DiagnosticUnderlineInfo", { undercurl = true, sp = c.blue })
hl(0, "DiagnosticUnderlineHint", { undercurl = true, sp = c.cyan })

hl(0, "DiffAdd", { fg = c.green, bg = c.gray800 })
hl(0, "DiffChange", { fg = c.yellow, bg = c.gray800 })
hl(0, "DiffDelete", { fg = c.red, bg = c.gray800 })
hl(0, "DiffText", { fg = c.gray50, bg = c.gray600 })
hl(0, "GitSignsAdd", { fg = c.green })
hl(0, "GitSignsChange", { fg = c.yellow })
hl(0, "GitSignsDelete", { fg = c.red })

hl(0, "TelescopeBorder", { fg = c.gray600 })
hl(0, "TelescopeSelection", { bg = c.gray800 })
hl(0, "TelescopePromptBorder", { fg = c.gray500 })
