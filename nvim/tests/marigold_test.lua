-- Headless checks for the `marigold` colorscheme (#196).
-- Run: nvim --headless -u NONE -l nvim/tests/marigold_test.lua
local root = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h")
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

local function get(group)
  return vim.api.nvim_get_hl(0, { name = group, link = false })
end

local function read(path)
  local f = assert(io.open(root .. "/" .. path, "r"))
  local s = f:read("*a")
  f:close()
  return s
end

-- Every role's hex from the Marigold Theme source file (lowercased, as hex() prints)
local r = {}
for _, palette in pairs(vim.json.decode(read("../themes/marigold.json")).palettes) do
  for name, value in pairs(palette) do
    r[name] = value:lower()
  end
end

-- Loads the colorscheme from a copy of the repo whose active Theme (themes/active,
-- which a Switch writes) is `active`, or that has none, as before any Switch.
local function load(active)
  local copy = vim.fn.tempname()
  vim.fn.mkdir(copy .. "/nvim/colors", "p")
  vim.fn.mkdir(copy .. "/themes", "p")
  vim.fn.writefile(vim.fn.readfile(root .. "/colors/marigold.lua"), copy .. "/nvim/colors/marigold.lua")
  vim.fn.writefile(vim.fn.readfile(root .. "/../themes/marigold.json"), copy .. "/themes/marigold.json")
  if active then
    vim.fn.writefile({ active }, copy .. "/themes/active")
  end
  vim.opt.rtp:prepend(copy .. "/nvim")
  vim.cmd.colorscheme("marigold")
  vim.opt.rtp:remove(copy .. "/nvim")
end

load()

test("sets colors_name and a dark background", function()
  eq(vim.g.colors_name, "marigold", "colors_name")
  eq(vim.o.background, "dark", "background")
end)

test("Normal is the Work surface", function()
  eq(hex(get("Normal").bg), r.work_bg, "Normal bg")
  eq(hex(get("Normal").fg), r.work_fg, "Normal fg")
end)

test("editor groups follow the spec", function()
  eq(hex(get("Cursor").bg), r.work_cursor, "Cursor bg")
  eq(hex(get("Cursor").fg), r.work_cursor_text, "Cursor fg")
  eq(hex(get("CursorLine").bg), r.work_cursorline, "CursorLine bg")
  eq(hex(get("LineNr").fg), r.work_line_number, "LineNr fg")
  eq(hex(get("Visual").bg), r.work_selection, "Visual bg")
  eq(hex(get("Visual").fg), r.work_selection_text, "Visual fg")
  eq(hex(get("ColorColumn").bg), r.work_grid, "ColorColumn bg")
  eq(hex(get("CurSearch").bg), r.frame_selection, "CurSearch bg")
end)

test("syntax roles follow the spec", function()
  local expect = {
    Comment = r.syntax_comment,
    Keyword = r.syntax_keyword,
    String = r.syntax_string,
    Number = r.syntax_number,
    Function = r.syntax_function,
    Type = r.syntax_type,
    Constant = r.syntax_constant,
    Operator = r.syntax_operator,
    Error = r.syntax_error,
    DiagnosticWarn = r.syntax_warning,
  }
  for group, color in pairs(expect) do
    eq(hex(get(group).fg), color, group .. " fg")
  end
end)

test("comments are not italic", function()
  eq(get("Comment").italic, nil, "Comment italic")
end)

test("the statusline and tab line are Frame", function()
  eq(hex(get("StatusLine").bg), r.frame_face, "StatusLine bg")
  eq(hex(get("StatusLine").fg), r.frame_text, "StatusLine fg")
  eq(hex(get("TabLineSel").bg), r.frame_selection, "TabLineSel bg")
  eq(hex(get("TabLineSel").fg), r.frame_selection_text, "TabLineSel fg")
end)

test("inline code popups are Work surface with a work_popup_border", function()
  for _, group in ipairs({ "NormalFloat", "Pmenu", "BlinkCmpMenu", "BlinkCmpDoc" }) do
    eq(hex(get(group).bg), r.work_bg, group .. " bg")
  end
  eq(hex(get("FloatBorder").fg), r.work_popup_border, "FloatBorder fg")
  eq(hex(get("PmenuSel").bg), r.work_selection, "PmenuSel bg")
  eq(hex(get("PmenuMatchSel").fg), r.frame_selection, "PmenuMatchSel fg")
end)

test("pickers are Frame with a frame_light hovered row", function()
  eq(hex(get("TelescopeNormal").bg), r.frame_face, "TelescopeNormal bg")
  eq(hex(get("TelescopeBorder").fg), r.frame_highlight, "TelescopeBorder fg")
  eq(hex(get("TelescopeSelection").bg), r.frame_light, "TelescopeSelection bg")
end)

test(":terminal uses the Theme's 16 ANSI colors", function()
  for i = 0, 15 do
    eq(vim.g["terminal_color_" .. i]:lower(), r["ansi_" .. i], "terminal_color_" .. i)
  end
end)

test("the colorscheme holds no raw hex", function()
  assert(not read("colors/marigold.lua"):find("#%x%x%x%x%x%x"), "raw hex in colors/marigold.lua")
end)

test("LazyVim uses marigold", function()
  local spec = dofile(root .. "/lua/plugins/colorscheme.lua")
  local found
  for _, s in ipairs(spec) do
    if s[1] == "LazyVim/LazyVim" then
      found = s.opts.colorscheme
    end
  end
  eq(found, "marigold", "LazyVim colorscheme")
  local disabled = {}
  for _, s in ipairs(spec) do
    if s.enabled == false then
      disabled[s[1]] = true
    end
  end
  eq(disabled["folke/tokyonight.nvim"], true, "tokyonight disabled")
  eq(disabled["catppuccin/nvim"], true, "catppuccin disabled")
end)

test("under Marigold no window paints a background, so Ghostty's translucent window shows", function()
  load("marigold")
  local panes = {
    "Normal", "NormalNC", "SignColumn", "FoldColumn", "WinSeparator", "WinBar", "WinBarNC", -- editor and splits
    "NormalFloat", "FloatBorder", "Pmenu", "BlinkCmpMenu", "BlinkCmpDoc", -- inline code popups
    "TelescopeNormal", "SnacksPicker", "WhichKeyNormal", -- pickers, the explorer and menus
  }
  for _, group in ipairs(panes) do
    eq(get(group).bg, nil, group .. " bg")
  end
  eq(hex(get("Normal").fg), r.work_fg, "Normal fg")
  eq(hex(get("SnacksPicker").fg), r.frame_text, "SnacksPicker fg")
  -- Bars and highlighted rows still paint
  eq(hex(get("StatusLine").bg), r.frame_face, "StatusLine bg")
  eq(hex(get("TabLineSel").bg), r.frame_selection, "TabLineSel bg")
  eq(hex(get("CursorLine").bg), r.work_cursorline, "CursorLine bg")
  eq(hex(get("PmenuSel").bg), r.work_selection, "PmenuSel bg")
  eq(hex(get("TelescopeSelection").bg), r.frame_light, "TelescopeSelection bg")
end)

test("under any other Theme every window paints its role, as Ghostty's window isn't Marigold's", function()
  load("vintage")
  eq(hex(get("Normal").bg), r.work_bg, "Normal bg")
  eq(hex(get("NormalFloat").bg), r.work_bg, "NormalFloat bg")
  eq(hex(get("SnacksPicker").bg), r.frame_face, "SnacksPicker bg")
end)

print(string.format("%d passed, %d failed", passed, #failures))
for _, f in ipairs(failures) do
  print("FAIL " .. f)
end
os.exit(#failures == 0 and 0 or 1)
