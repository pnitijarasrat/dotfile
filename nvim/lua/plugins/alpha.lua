return {
  "goolord/alpha-nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  config = function()
    local theme = require("alpha.themes.startify")
    theme.section.header.val = {
      [[             _ _   _ _                               _   ]],
      [[            |_| | |_|_|                             | |  ]],
      [[ _ __  _ __  _| |_ _ _  __ _ _ __ __ _ ___ _ __ __ _| |_ ]],
      [[| '_ \| '_ \| | __| | |/ _` | '__/ _` / __| '__/ _` | __|]],
      [[| |_) | | | | | |_| | | (_| | | | (_| \__ \ | | (_| | |_ ]],
      [[| .__/|_| |_|_|\__|_| |\__,_|_|  \__,_|___/_|  \__,_|\__|]],
      [[| |                _/ |                                  ]],
      [[|_|               |__/                                   ]],
    }
    theme.section.top_buttons.val = {}
    theme.file_icons.provider = "devicons"
    theme.section.mru.val = { { type = "padding", val = 0 } }
    require("alpha").setup(theme.config)
  end,
}
