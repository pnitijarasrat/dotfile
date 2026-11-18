-- Markdown reads rendered in the buffer: render-markdown.nvim comes from
-- LazyVim's lang.markdown extra (lazyvim.json); these opts tune it for reading.
-- The cursor line shows raw markdown; insert mode shows it all raw.
return {
  {
    "MeanderingProgrammer/render-markdown.nvim",
    opts = {
      pipe_table = {
        preset = "round", -- rounded box-drawing borders
        cell = "padded", -- align columns, padding every cell to the widest
        style = "full",
      },
      heading = { width = "block", left_pad = 1, right_pad = 2 },
      code = { width = "block", left_pad = 2, right_pad = 2 },
    },
  },
}
