return {
  "nvim-orgmode/orgmode",
  event = "VeryLazy",
  ft = { "org" },
  cmd = { "OrgAgenda" }, -- lets `nvim -c OrgAgenda` load the plugin from a cold start
  config = function()
    -- Setup orgmode
    require("orgmode").setup({
      org_agenda_files = "~/personal/org/**/*",
      org_default_notes_file = "~/personal/org/refile.org",

      -- Fullscreen agenda: replaces every other window instead of splitting
      org_agenda_window_setup = "only-window",

      -- Default agenda view is a single day (today) instead of the whole
      -- week. You can still switch spans from inside the agenda (day/week/
      -- month/year) — this only changes what it opens to.
      org_agenda_span = "day",

      -- No advance countdown on deadlines ("In 3 d.:", "In 9 d.:", ...).
      -- Each DEADLINE entry now shows up only on its own day (or as
      -- overdue afterward, until closed) — matching how SCHEDULED already
      -- behaves — instead of appearing every day for N days beforehand.
      org_deadline_warning_days = 0,

      -- <CR> on any agenda line (TODO, SCHEDULED, DEADLINE, ...) jumps to
      -- that exact heading in its source file AND closes the agenda window
      -- (org_agenda_switch_to closes it; org_agenda_goto would leave it open
      -- in the background).
      mappings = {
        agenda = {
          org_agenda_switch_to = { "<CR>" },
        },
      },
    })

    -- :OrgAgenda opens the agenda directly — usable from the command line
    -- via `nvim -c OrgAgenda`, without going through <leader>oa first.
    -- This calls the exact same action your <leader>oa mapping runs.
    vim.api.nvim_create_user_command("OrgAgenda", function()
      require("orgmode").action("agenda.prompt")
    end, {})

    -- When jumping out of the agenda (org_agenda_switch_to above), the
    -- "only-window" layout it replaced can leave a stray empty window
    -- behind alongside the file you jumped to. Collapse back to a single
    -- window right after leaving the agenda buffer so the target file's
    -- own first line ends up at the top, not split under a blank buffer.
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "orgagenda",
      callback = function(args)
        vim.api.nvim_create_autocmd("BufLeave", {
          buffer = args.buf,
          once = true,
          callback = function()
            vim.schedule(function()
              pcall(vim.cmd, "only")
            end)
          end,
        })
      end,
    })

    -- Agenda state colors (DONE / Deadline).
    --
    -- Confirmed via :Inspect that orgmode's OWN agenda-color setup runs
    -- lazily whenever the agenda plugin/buffer actually loads — which is
    -- AFTER a one-shot ColorScheme-based override — so it wins the race
    -- for some of these groups even with "hi default". Setting them here,
    -- reapplied every time an orgagenda buffer opens, guarantees these
    -- always run last regardless of load order.
    --
    --   DONE                    -> readable gray
    --   Deadline, exceeding (overdue) -> purple
    --   Deadline, within 7 days (incl. due today) -> yellow
    local function apply_agenda_state_colors()
      local hl = vim.api.nvim_set_hl
      hl(0, "@org.keyword.done", { fg = "#909DAB", bold = true })
      hl(0, "@org.agenda.deadline.upcoming", { fg = "#C69026", bold = true })
      hl(0, "@org.agenda.deadline", { fg = "#B083F0", bold = true })
      hl(0, "@org.agenda.scheduled", { link = "Normal" })
      hl(0, "@org.agenda.scheduled_past", { link = "Normal" })
    end

    -- Whole-line agenda state coloring.
    --
    --   DONE line                       -> entire line, readable gray
    --   Deadline, overdue (exceeding)   -> entire line purple
    --   Deadline, within 7 days
    --     (incl. due today)             -> entire line yellow
    --   Deadline, more than 7 days out,
    --     Scheduled, and everything else -> entire line white/plain (untouched)
    --
    -- In every case the TODO keyword itself is carved out and left alone so
    -- it keeps its own distinct color (pink) — the line color is painted
    -- around it, not over it. This is done via direct text-pattern matching
    -- on the rendered agenda line rather than orgmode's internal highlight
    -- groups: those groups only colored the label word (not the whole
    -- line), and for "In N d.:" entries didn't appear to be wired up at
    -- all regardless of how far out N was.
    local org_line_ns = vim.api.nvim_create_namespace("org_agenda_line_color")
    vim.api.nvim_set_hl(0, "OrgAgendaLineDone", { fg = "#909DAB", bold = true }) -- readable gray
    vim.api.nvim_set_hl(0, "OrgAgendaLineDeadlineExceeding", { fg = "#B083F0", bold = true }) -- purple
    vim.api.nvim_set_hl(0, "OrgAgendaLineDeadlineNear", { fg = "#C69026", bold = true }) -- yellow

    -- Paint [0, #line) with hl_group, except the span occupied by "TODO"
    -- (if present on the line), which is left untouched.
    local function paint_line_around_todo(bufnr, lnum0, line, hl_group)
      local todo_s, todo_e = line:find("TODO")
      if todo_s then
        if todo_s > 1 then
          vim.api.nvim_buf_set_extmark(bufnr, org_line_ns, lnum0, 0, {
            end_col = todo_s - 1,
            hl_group = hl_group,
            priority = 4096,
          })
        end
        if todo_e < #line then
          vim.api.nvim_buf_set_extmark(bufnr, org_line_ns, lnum0, todo_e, {
            end_col = #line,
            hl_group = hl_group,
            priority = 4096,
          })
        end
      else
        vim.api.nvim_buf_set_extmark(bufnr, org_line_ns, lnum0, 0, {
          end_col = #line,
          hl_group = hl_group,
          priority = 4096,
        })
      end
    end

    local function colorize_agenda_lines(bufnr)
      vim.api.nvim_buf_clear_namespace(bufnr, org_line_ns, 0, -1)
      local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
      for i, line in ipairs(lines) do
        local lnum0 = i - 1

        if line:find("DONE") then
          paint_line_around_todo(bufnr, lnum0, line, "OrgAgendaLineDone")
        elseif not line:find("Scheduled:") then
          local hl_group
          local _, _, days = line:find("In (%d+) d%.:")
          if days then
            -- >7 days out: leave as plain/white (no override)
            if tonumber(days) <= 7 then
              hl_group = "OrgAgendaLineDeadlineNear"
            end
          elseif line:find("%d+ d%. ago:") then
            hl_group = "OrgAgendaLineDeadlineExceeding" -- overdue
          elseif line:find("Deadline:") then
            hl_group = "OrgAgendaLineDeadlineNear" -- due today
          end

          if hl_group then
            paint_line_around_todo(bufnr, lnum0, line, hl_group)
          end
        end
        -- Scheduled lines and >7-day deadlines: no override, plain/white.
      end
    end

    local function refresh_agenda_highlights(bufnr)
      apply_agenda_state_colors()
      colorize_agenda_lines(bufnr)
    end

    vim.api.nvim_create_autocmd("FileType", {
      pattern = "orgagenda",
      callback = function(args)
        vim.schedule(function()
          refresh_agenda_highlights(args.buf)
        end)
        -- Agenda content can be rebuilt in place (e.g. navigating days/weeks)
        -- without re-firing FileType, so re-apply on redraw too.
        vim.api.nvim_create_autocmd({ "BufEnter", "CursorHold" }, {
          buffer = args.buf,
          callback = function()
            refresh_agenda_highlights(args.buf)
          end,
        })
      end,
    })

    -- NOTE: If you are using nvim-treesitter with ~ensure_installed = "all"~ option
    -- add ~org~ to ignore_install
    -- require('nvim-treesitter.configs').setup({
    --   ensure_installed = 'all',
    --   ignore_install = { 'org' },
    -- })
  end,
}
