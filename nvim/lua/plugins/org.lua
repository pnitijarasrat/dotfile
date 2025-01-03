return {
  "nvim-orgmode/orgmode",
  event = "VeryLazy",
  ft = { "org" },
  config = function()
    require("orgmode").setup({
      org_agenda_files = "~/personal/org/**/*",
      org_default_notes_file = "~/personal/refile.org",
      win_split_mode = "vsplit",
      org_todo_keywords = { "TODO(t)", "MEETING(m)", "APPOINT(a)", "WORKOUT(w)", "|", "DONE(d)" },
      org_deadline_warning_days = 7,
      org_startup_folded = "content",
      org_hide_leading_stars = true,
    })
    vim.api.nvim_set_hl(0, "@org.agenda.scheduled", { fg = "#EDEFF3" })
    vim.api.nvim_set_hl(0, "@org.agenda.scheduled_past", { link = "ERROR" })
    vim.api.nvim_set_hl(0, "@org.agenda.deadline", { link = "ERROR" })
    vim.api.nvim_set_hl(0, "@org.agenda.today", { link = "TermCursor" })
    vim.api.nvim_set_hl(0, "@org.keyword.todo", { link = "DiffDelete" })
    vim.api.nvim_set_hl(0, "@org.keyword.done", { link = "DiffAdd" })
    vim.api.nvim_set_hl(0, "@org.headline.level1", { link = "CurSearch" })
    vim.api.nvim_set_hl(0, "@org.headline.level2", { fg = "#D8DEE9" })
  end,
}
