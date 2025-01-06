return {
    'navarasu/onedark.nvim',
    priority = 1000,
    name = "onedark",
    config = function()
        vim.cmd("colorscheme onedark")
    end,
    setup = {
        style = "warmer"
    },
}
