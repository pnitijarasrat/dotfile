# Themes, switched together, with values in one source file

Supersedes the "the **Vintage theme** has one look" reasoning in `docs/adr/0001-light-k95-work-surface.md`.

There was one look, the **Vintage theme**, and its role values lived in the **Theme spec**'s markdown tables. Every tool's test scraped its expected hex values out of those tables. ADR 0001 turned down a second (dark) palette partly because the Vintage theme has one look. Now several looks are the goal. So we name the idea: a **Theme** is one complete look applied to every themed tool, exactly one is active, and a **Switch** changes it for every themed tool together. Tools never mix Themes. The Vintage theme is the first Theme.

To make that change easy, each Theme's values move into one **Theme source file** (#131). The Vintage theme's is `themes/vintage.json`: every role's hex grouped by palette (Frame, Work surface, ANSI, syntax, Frame data colors, Display) and its fonts. The Theme spec still names the roles and says where each one goes, but it no longer holds their values. Every Vintage test (Ghostty, VSCode, Chrome, Raycast, Spotify, Neovim) reads its expected values from the source file, and `themes/tests/vintage_test.mjs` checks that the source file and the spec name the same roles.

**Purist fidelity** becomes the Vintage theme's own rules, not a rule for every Theme: each Theme carries its own rules for corners, blur and icons.

## Considered options

- **Keep values in the spec's markdown tables**: rejected. A second Theme would need a second spec just to hold values, and tests would keep parsing prose tables with a regex.
- **A module per tool language (JS and Lua)**: rejected. The tests are Node and headless Neovim; both read JSON (`JSON.parse`, `vim.json.decode`), so one JSON file serves both without a copy.
- **Switch with macOS appearance** (ADR 0001's rejected option): still rejected. A Switch is chosen, not tied to light or dark mode.

## Consequences

- No tool's colors or fonts change in this step; only where the tests read them from.
- The Work surface still has no dark variant inside the Vintage theme. A dark look would be a separate Theme, not a mode of this one.
- Neovim's colorscheme still uses the old dark Work surface values (the spec marks the light one "to do again"), so its test reads from the source file only the roles it still shares (`work_selection`, `work_selection_text`, `work_popup_border`) and keeps its own literals for the rest.
- Adding a Theme means adding a source file under `themes/` with the same roles; switching between Themes is later work.
