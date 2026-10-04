-- Headless checks for the `vintage` colorscheme (#16).
-- Run: nvim --headless -u NONE -l nvim/tests/vintage_test.lua
local root = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h")
vim.opt.rtp:prepend(root)
vim.o.termguicolors = true

local failures, passed = {}, 0

local function test(name, fn)
  local ok, err = pcall(fn)
  if ok then
    passed = passed + 1
  else
    table.insert(failures, name .. ": " .. tostring(err))
  end
end

local function eq(actual, expected, what)
  if actual ~= expected then
    error(string.format("%s: expected %s, got %s", what or "value", vim.inspect(expected), vim.inspect(actual)), 2)
  end
end

local function hex(n)
  return n and string.format("#%06x", n) or nil
end

-- Resolved highlight (links followed)
local function get(group)
  return vim.api.nvim_get_hl(0, { name = group, link = false })
end

local function link_of(group)
  return vim.api.nvim_get_hl(0, { name = group }).link
end

local function read(path)
  local f = assert(io.open(root .. "/" .. path, "r"))
  local s = f:read("*a")
  f:close()
  return s
end

vim.cmd.colorscheme("vintage")

test("sets colors_name", function()
  eq(vim.g.colors_name, "vintage", "colors_name")
end)

test("Normal is the Work surface", function()
  eq(hex(get("Normal").bg), "#000000", "Normal bg")
  eq(hex(get("Normal").fg), "#c4c4c4", "Normal fg")
end)

test("editor groups follow the spec", function()
  eq(hex(get("CursorLine").bg), "#161616", "CursorLine bg")
  eq(hex(get("LineNr").fg), "#7e7e7e", "LineNr fg")
  eq(hex(get("Visual").bg), "#000080", "Visual bg")
  eq(hex(get("Visual").fg), "#ffffff", "Visual fg")
  eq(hex(get("Search").bg), "#000080", "Search bg")
  eq(hex(get("Cursor").bg), "#4edc4e", "Cursor bg")
  eq(hex(get("WinSeparator").fg), "#4e4e4e", "WinSeparator fg")
  eq(hex(get("ColorColumn").bg), "#4e4e4e", "ColorColumn bg")
end)

test("syntax roles follow the spec", function()
  local expect = {
    Comment = "#7e7e7e",
    Keyword = "#f3f34e",
    Statement = "#f3f34e",
    String = "#4edc4e",
    Function = "#4ef3f3",
    Number = "#f34ef3",
    Type = "#ffffff",
    Constant = "#c47e00",
    Operator = "#c4c4c4",
    Error = "#dc4e4e",
  }
  for group, color in pairs(expect) do
    eq(hex(get(group).fg), color, group .. " fg")
  end
end)

test("nothing is italic", function()
  for name, attrs in pairs(vim.api.nvim_get_hl(0, {})) do
    if attrs.italic then
      error(name .. " is italic")
    end
  end
end)

test("Treesitter groups link to syntax roles", function()
  eq(link_of("@comment"), "Comment", "@comment")
  eq(link_of("@keyword"), "Keyword", "@keyword")
  eq(link_of("@string"), "String", "@string")
  eq(link_of("@function"), "Function", "@function")
  eq(link_of("@type"), "Type", "@type")
  eq(hex(get("@keyword.function").fg), "#f3f34e", "@keyword.function fg")
  eq(hex(get("@variable").fg), "#c4c4c4", "@variable fg")
end)

test("LSP and diagnostic groups link to roles", function()
  eq(hex(get("DiagnosticError").fg), "#dc4e4e", "DiagnosticError fg")
  eq(hex(get("DiagnosticWarn").fg), "#f3f34e", "DiagnosticWarn fg")
  eq(link_of("@lsp.type.function"), "@function", "@lsp.type.function")
  eq(get("DiagnosticUnderlineError").sp and hex(get("DiagnosticUnderlineError").sp), "#dc4e4e", "underline sp")
end)

test("inline code popups are Work surface with a #808080 border", function()
  for _, group in ipairs({ "NormalFloat", "Pmenu", "BlinkCmpMenu", "BlinkCmpDoc", "BlinkCmpSignatureHelp" }) do
    eq(hex(get(group).bg), "#000000", group .. " bg")
  end
  for _, group in ipairs({ "FloatBorder", "BlinkCmpMenuBorder", "BlinkCmpDocBorder", "BlinkCmpSignatureHelpBorder" }) do
    eq(hex(get(group).fg), "#808080", group .. " fg")
    eq(hex(get(group).bg), "#000000", group .. " bg")
  end
  eq(hex(get("PmenuSel").bg), "#000080", "PmenuSel bg")
end)

test("every highlight uses roles, not raw hex", function()
  local src = read("colors/vintage.lua")
  local table_start = src:find("local p = {", 1, true)
  assert(table_start, "no `local p = {` role table")
  local table_end = src:find("\n}", table_start, true)
  local before, after = src:sub(1, table_start), src:sub(table_end)
  assert(not before:find("#%x%x%x%x%x%x"), "raw hex before the role table")
  assert(not after:find("#%x%x%x%x%x%x"), "raw hex after the role table")
end)

test("LazyVim uses vintage", function()
  local spec = dofile(root .. "/lua/plugins/colorscheme.lua")
  local found
  for _, s in ipairs(spec) do
    if s[1] == "LazyVim/LazyVim" then
      found = s.opts.colorscheme
    end
  end
  eq(found, "vintage", "LazyVim colorscheme")
  local disabled = {}
  for _, s in ipairs(spec) do
    if s.enabled == false then
      disabled[s[1]] = true
    end
  end
  eq(disabled["folke/tokyonight.nvim"], true, "tokyonight disabled")
  eq(disabled["catppuccin/nvim"], true, "catppuccin disabled")
end)

test("old colorscheme plugins and transparent groups are gone", function()
  eq(vim.uv.fs_stat(root .. "/lua/plugins/github.lua") ~= nil, false, "github.lua exists")
  eq(vim.uv.fs_stat(root .. "/lua/plugins/tokyonight.lua") ~= nil, false, "tokyonight.lua exists")
  for _, file in ipairs(vim.fn.glob(root .. "/lua/**/*.lua", false, true)) do
    if not file:find("/archived/") and read(file:sub(#root + 2)):find('bg = "none"', 1, true) then
      error("transparent group in " .. file)
    end
  end
end)

test("options.lua sets single popup borders", function()
  dofile(root .. "/lua/config/options.lua")
  if vim.fn.exists("+winborder") == 1 then
    eq(vim.o.winborder, "single", "winborder")
  end
  eq(vim.diagnostic.config().float.border, "single", "diagnostic float border")
end)

test("blink.cmp completion and docs get single borders", function()
  local spec = dofile(root .. "/lua/plugins/blink.lua")
  local opts = spec.opts
  eq(opts.completion.menu.border, "single", "menu border")
  eq(opts.completion.documentation.window.border, "single", "documentation border")
end)

print(string.format("%d passed, %d failed", passed, #failures))
for _, f in ipairs(failures) do
  print("FAIL " .. f)
end
os.exit(#failures == 0 and 0 or 1)
