return {
    'stevearc/oil.nvim',
    dependencies = { { "echasnovski/mini.icons", opts = {} } },
    lazy = false,
    opts = {},
    config = function()
        require("oil").setup({}) -- You can pass your custom options here
        vim.keymap.set("n", "<leader>e", require("oil").open, { desc = "Open parent directory with oil.nvim" })
    end,
}
