-- Headless checks for the VSCode-style keys in lua/config/keymaps.lua (#196).
-- Ghostty forwards the Cmd keys as CSI-u sequences (ghostty/config), which
-- Neovim reads as <D-…>; ghostty/tests/keys_test.mjs checks that side.
-- Run: nvim --headless -u NONE -l nvim/tests/keymaps_test.lua
local root = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h")

local failures, passed = {}, 0

local function test(name, fn)
  local ok, err = pcall(fn)
  if ok then
    passed = passed + 1
  else
    table.insert(failures, name .. ": " .. tostring(err))
  end
  vim.cmd("silent! %bwipeout!")
end

local function eq(actual, expected, what)
  if not vim.deep_equal(actual, expected) then
    error(string.format("%s: expected %s, got %s", what or "value", vim.inspect(expected), vim.inspect(actual)), 2)
  end
end

-- LazyVim and Snacks stand in for the real plugins: each records what it was
-- asked to open, so a key's effect can be read back from `calls`.
local calls = {}
_G.LazyVim = {
  root = function()
    return "/project"
  end,
  pick = function(command)
    return function()
      table.insert(calls, { "pick", command })
    end
  end,
  config = { kind_filter = { "Function" } },
}
_G.Snacks = {
  explorer = function(opts)
    table.insert(calls, { "explorer", opts })
  end,
  terminal = {
    focus = function(cmd, opts)
      table.insert(calls, { "terminal", opts })
    end,
  },
  picker = setmetatable({}, {
    __index = function(_, source)
      return function(opts)
        table.insert(calls, { source, opts })
      end
    end,
  }),
}
for _, name in ipairs({ "code_action", "rename" }) do
  vim.lsp.buf[name] = function()
    table.insert(calls, { name })
  end
end

vim.g.mapleader = " "
dofile(root .. "/lua/config/keymaps.lua")

-- Types keys as if from the terminal and runs whatever they're mapped to.
local function press(keys)
  calls = {}
  vim.fn.execute("call feedkeys(" .. vim.fn.string(vim.keycode(keys)) .. ", 'mx')", "silent")
  return calls
end

local function buffer(lines)
  vim.cmd("enew!")
  vim.bo.commentstring = "-- %s"
  vim.api.nvim_buf_set_lines(0, 0, -1, false, lines)
  vim.api.nvim_win_set_cursor(0, { 1, 0 })
end

local function lines()
  return vim.api.nvim_buf_get_lines(0, 0, -1, false)
end

test("Cmd+S saves, in normal and insert mode", function()
  local file = vim.fn.tempname()
  vim.cmd.edit(file)
  vim.api.nvim_buf_set_lines(0, 0, -1, false, { "one" })
  press("<D-s>")
  eq(vim.fn.readfile(file), { "one" }, "saved from normal mode")
  press("otwo<D-s>")
  eq(vim.fn.readfile(file), { "one", "two" }, "saved from insert mode")
  eq(vim.fn.mode(), "n", "back in normal mode")
end)

test("Cmd+Z undoes and Cmd+Shift+Z redoes, in normal and insert mode", function()
  buffer({ "one" })
  vim.cmd("let &undolevels = &undolevels") -- start a new undo block
  press("ddione<Esc>")
  vim.cmd("let &undolevels = &undolevels")
  press("ccchanged<Esc>")
  press("<D-z>")
  eq(lines(), { "one" }, "after Cmd+Z")
  press("<D-S-z>")
  eq(lines(), { "changed" }, "after Cmd+Shift+Z")
  press("A<D-z><Esc>")
  eq(lines(), { "one" }, "after Cmd+Z in insert mode")
  press("A<D-S-z><Esc>")
  eq(lines(), { "changed" }, "after Cmd+Shift+Z in insert mode")
end)

test("Cmd+/ toggles a comment on the line, or on a selection", function()
  buffer({ "a", "b", "c" })
  press("<D-/>")
  eq(lines(), { "-- a", "b", "c" }, "after Cmd+/")
  press("<D-/>")
  eq(lines(), { "a", "b", "c" }, "after a second Cmd+/")
  press("jVj<D-/>")
  eq(lines(), { "a", "-- b", "-- c" }, "after Cmd+/ on a selection")
end)

test("Alt+Down and Alt+Up move the line, in normal and insert mode", function()
  buffer({ "a", "b", "c" })
  press("<A-Down>")
  eq(lines(), { "b", "a", "c" }, "after Alt+Down")
  press("<A-Up>")
  eq(lines(), { "a", "b", "c" }, "after Alt+Up")
  press("i<A-Down><Esc>")
  eq(lines(), { "b", "a", "c" }, "after Alt+Down in insert mode")
  press("i<A-Up><Esc>")
  eq(lines(), { "a", "b", "c" }, "after Alt+Up in insert mode")
end)

test("Alt+Down and Alt+Up move a selection", function()
  buffer({ "a", "b", "c", "d" })
  press("Vj<A-Down><Esc>")
  eq(lines(), { "c", "a", "b", "d" }, "after Alt+Down")
  press("gv<A-Up><Esc>")
  eq(lines(), { "a", "b", "c", "d" }, "after Alt+Up")
end)

-- Each key opens what LazyVim's own key for it opens (the comment names it).
local opens = {
  { "<D-p>", { "pick", "files" } }, -- <leader>ff
  { "<D-S-f>", { "pick", "grep" } }, -- <leader>/
  { "<D-b>", { "explorer", { cwd = "/project" } } }, -- <leader>e, which closes an open explorer
  { "<D-.>", { "code_action" } }, -- <leader>ca
  { "<D-S-o>", { "lsp_symbols", { filter = { "Function" } } } }, -- <leader>ss
  { "<F12>", { "lsp_definitions" } }, -- gd
  { "<S-F12>", { "lsp_references" } }, -- gr
  { "<F24>", { "lsp_references" } }, -- Shift+F12 as most terminals send it
  { "<F2>", { "rename" } }, -- <leader>cr
  { "<C-`>", { "terminal", { cwd = "/project" } } }, -- <C-/>, which hides a focused terminal
}
for _, case in ipairs(opens) do
  local key, expected = case[1], case[2]
  test(key .. " opens " .. expected[1], function()
    buffer({ "x" })
    eq(press(key), { expected }, key)
  end)
end

test("Cmd+. offers code actions on a selection too", function()
  buffer({ "x" })
  eq(press("v<D-.>"), { { "code_action" } }, "v<D-.>")
end)

test("Ctrl+` hides the terminal from inside it", function()
  local mapping = vim.fn.maparg("<C-`>", "t", false, true)
  calls = {}
  mapping.callback()
  eq(calls, { { "terminal", { cwd = "/project" } } }, "terminal-mode <C-`>")
end)

test("keys VSCode users expect to stay Vim's, LazyVim's or Ghostty's are left alone", function()
  for _, key in ipairs({ "G", "<S-h>", "<S-l>", "<D-S-p>", "<D-w>", "<D-c>", "<D-v>", "<D-t>", "<D-n>", "<C-Tab>" }) do
    eq(vim.fn.maparg(key, "n"), "", key .. " mapping")
  end
end)

print(string.format("%d passed, %d failed", passed, #failures))
for _, f in ipairs(failures) do
  print("FAIL " .. f)
end
os.exit(#failures == 0 and 0 or 1)
