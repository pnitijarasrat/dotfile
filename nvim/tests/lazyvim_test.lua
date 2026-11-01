-- Headless checks that Neovim is default LazyVim, plus Marigold's rounded
-- inline popups (#196).
-- Run: nvim --headless -u NONE -l nvim/tests/lazyvim_test.lua
local root = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":p:h:h")

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
  if not vim.deep_equal(actual, expected) then
    error(string.format("%s: expected %s, got %s", what or "value", vim.inspect(expected), vim.inspect(actual)), 2)
  end
end

local function read(path)
  local f = assert(io.open(root .. "/" .. path, "r"))
  local s = f:read("*a")
  f:close()
  return s
end

local function exists(path)
  return vim.uv.fs_stat(root .. "/" .. path) ~= nil
end

test("only the colorscheme, noice's border and org are added to LazyVim's plugins", function()
  local files = vim.tbl_map(function(f)
    return f:sub(#root + 2)
  end, vim.fn.glob(root .. "/lua/plugins/**/*", false, true))
  table.sort(files)
  eq(files, {
    "lua/plugins/colorscheme.lua",
    "lua/plugins/noice.lua",
    "lua/plugins/org-bullets.lua",
    "lua/plugins/org.lua",
  }, "lua/plugins")
end)

test("lazy.lua imports only LazyVim and lua/plugins", function()
  local imports = {}
  for spec in read("lua/config/lazy.lua"):gmatch('import = "([^"]+)"') do
    table.insert(imports, spec)
  end
  eq(imports, { "lazyvim.plugins", "plugins" }, "imports")
end)

test("LazyVim picks a fresh install's defaults (Snacks picker and explorer)", function()
  local install_version = vim.json.decode(read("lazyvim.json")).install_version
  assert(install_version >= 8, "install_version " .. tostring(install_version) .. " keeps fzf-lua and neo-tree")
end)

test("only marigold and vintage colorschemes are left", function()
  eq(exists("colors/grayscale.lua"), false, "grayscale.lua exists")
  eq(exists("colors/marigold.lua"), true, "marigold.lua exists")
  eq(exists("colors/vintage.lua"), true, "vintage.lua exists")
end)

test("options.lua gives inline popups rounded borders through winborder", function()
  local diagnostic_float = vim.diagnostic.config().float
  dofile(root .. "/lua/config/options.lua")
  eq(vim.o.winborder, "rounded", "winborder")
  -- Diagnostic floats and blink.cmp's menu and docs follow winborder.
  eq(vim.diagnostic.config().float, diagnostic_float, "diagnostic float left to winborder")
end)

test("options.lua sets nothing but winborder", function()
  local code = read("lua/config/options.lua"):gsub("%-%-[^\n]*", "")
  eq(vim.trim(code), 'vim.opt.winborder = "rounded"', "options.lua code")
end)

test("noice gives hover and signature help a rounded border", function()
  local spec = dofile(root .. "/lua/plugins/noice.lua")
  eq(spec[1], "folke/noice.nvim", "plugin")
  eq(spec.opts.presets.lsp_doc_border, true, "lsp_doc_border")
end)

print(string.format("%d passed, %d failed", passed, #failures))
for _, f in ipairs(failures) do
  print("FAIL " .. f)
end
os.exit(#failures == 0 and 0 or 1)
