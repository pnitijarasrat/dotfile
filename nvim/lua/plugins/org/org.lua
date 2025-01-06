return {
    "nvim-orgmode/orgmode",
    event = "VeryLazy",
    ft = { "org" },
    config = function()
        require("orgmode").setup({
            org_agenda_files = "~/personal/org/**/*",
            org_default_notes_file = "~/personal/refile.org",
            win_split_mode = "tabnew",
            org_todo_keywords = { "TODO(t)", "MEETING(m)", "APPOINT(a)", "WORKOUT(w)", "|", "DONE(d)" },
            org_deadline_warning_days = 7,
            org_startup_folded = "content",
            org_hide_leading_stars = true,
            org_agenda_span = "day",
            org_agenda_start_on_weekday = false,
            mappings = {
                org = {
                    org_toggle_checkbox = "<C-CR>",
                },
            },
        })
        vim.api.nvim_set_hl(0, "@org.agenda.scheduled", { fg = "#DCD7BA" })
        vim.api.nvim_set_hl(0, "@org.agenda.today", { link = "Underlined" })
        vim.api.nvim_set_hl(0, "@org.keyword.todo", { link = "DiagnosticOk" })
        vim.api.nvim_set_hl(0, "@org.keyword.done", { link = "WhiteSpace" })

    end,
}
