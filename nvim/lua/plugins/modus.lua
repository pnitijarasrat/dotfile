return { 
    "miikanissi/modus-themes.nvim", priority = 1000,
    config = function()
        require("modus-themes").setup({
            style = "modus_vivendi",
            transparent = true,
        })
        vim.cmd.colorscheme("modus")
    end
}
