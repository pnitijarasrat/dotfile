return {
    "rebelot/kanagawa.nvim",
    priority = 1000,
    name = "kanagawa",
    config = function()
        require('kanagawa').setup({
            compile = false,             -- enable compiling the colorscheme
            undercurl = true,            -- enable undercurls
            commentStyle = { italic = false },
            functionStyle = {},
            keywordStyle = { italic = false},
            statementStyle = { bold = true },
            typeStyle = {},
            transparent = true,         -- do not set background color
            dimInactive = false,         -- dim inactive window `:h hl-NormalNC`
            terminalColors = true,       -- define vim.g.terminal_color_{0,17}
            theme = "dragon",              -- Load "wave" theme when 'background' option is not set
            background = {               -- map the value of 'background' option to a theme
                dark = "dragon",           -- try "dragon" !
                light = "lotus"
            },
        })
        vim.cmd("colorscheme kanagawa-dragon")
    end,
}
