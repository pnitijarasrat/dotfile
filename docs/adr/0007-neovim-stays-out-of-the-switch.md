# Neovim stays out of the Switch

#134 would have had Neovim join the **Switch**: a generated colorscheme per **Theme**, and running sessions recoloring on `theme <name>`. Neovim isn't used much any more, so it doesn't join. Its hand-written `nvim/colors/vintage.lua` stays as it is, with the old dark IBM 5153 **Work surface** (the light one, #45, was never built), and it isn't generated from `themes/vintage.json`.

## Considered options

- **Join the Switch as planned**: rejected. Vintage's Neovim values aren't in the **Theme source file**, so joining meant either turning Neovim light or carrying Neovim-only overrides in the Theme source file, plus a pointer file and a signal handler, all for a tool that's rarely opened.

## Consequences

- Narrows ADR 0006's "the rule holds again once the last one joins": the rule holds for every tool except Neovim, which always shows Vintage's dark colorscheme whatever Theme is active.
- Neovim's test keeps its own literals for the dark values, as ADR 0004 describes, and doesn't run once per Theme.
- To bring Neovim back, pick up #134 again.
