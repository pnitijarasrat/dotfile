return {
    "rose-pine/neovim",
    name = "rose-pine",
    config = function()
        require("rose-pine").setup({
            disable_background = true, -- disables setting `Normal` bg color
            disable_float_background = true,
            disable_italics = true, -- if you want no italics
        })

        vim.cmd("colorscheme rose-pine")
    end,
}













