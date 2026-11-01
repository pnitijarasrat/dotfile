# Neovim shows the Marigold theme

Supersedes ADR 0007's "always shows Vintage's dark colorscheme"; Neovim still stays out of the **Switch**.

ADR 0007 kept Neovim on its hand-written dark Vintage colorscheme because Vintage's Neovim values aren't in the **Theme source file**. The **Marigold theme** is dark, and every value Neovim needs is already in `themes/marigold.json`. So `nvim/colors/marigold.lua` reads its roles from that file when it loads, with no hex of its own, and LazyVim's default colorscheme is now `marigold`.

## Considered options

- **Join the Switch**: not done. Neovim is still rarely opened, and Vintage would still need Neovim-only values or a light Neovim, as ADR 0007 found.
- **Generate `colors/marigold.lua` with `themes/generate.mjs`**: not done. Reading the source file at load keeps one source with no generated copy to drift. This is the only tool file that reads a Theme source file at runtime (ADR 0005 commits generated files for the others).

## Consequences

- Neovim always shows Marigold, whatever Theme is active. Under Vintage it's the one dark Marigold tool beside the Vintage ones.
- `nvim/colors/vintage.lua` stays as it is and can still be picked with `:colorscheme vintage`.
- `nvim/tests/marigold_test.lua` reads its expected values from `themes/marigold.json` and checks that LazyVim's default is `marigold`.
