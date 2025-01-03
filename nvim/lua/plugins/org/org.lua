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
    })
    vim.api.nvim_set_hl(0, "@org.agenda.scheduled", { link = "SignColumn" })
    vim.api.nvim_set_hl(0, "@org.agenda.scheduled_past", { link = "ERROR" })
    vim.api.nvim_set_hl(0, "@org.agenda.deadline", { link = "ERROR" })
    vim.api.nvim_set_hl(0, "@org.agenda.today", { link = "Search" })
    vim.api.nvim_set_hl(0, "@org.agenda.day", { link = "MoreMsg" })
    vim.api.nvim_set_hl(0, "@org.keyword.todo", { link = "DiagnosticError" })
    vim.api.nvim_set_hl(0, "@org.keyword.done", { link = "DiagnosticHint" })
  end,
}
