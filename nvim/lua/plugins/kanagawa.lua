return {
    "rebelot/kanagawa.nvim",
    priority = 1000,
    name = "kanagawa",
    config = function()
        vim.cmd("colorscheme kanagawa-dragon")
        vim.opt.fillchars:append({ eob = "~" })
    end,
}
