return {
    "ellisonleao/gruvbox.nvim",
    priority = 1000,
    name = "gruvbox",
    config = function()
        vim.o.background = "dark"
        -- vim.cmd("colorscheme gruvbox")
    end,
    setup = {
        italic = false,
        bold = false,
    },
}
