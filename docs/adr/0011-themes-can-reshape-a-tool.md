# Themes can reshape a tool, not just recolor it

Until now a **Switch** only recolored: every tool kept the **Vintage theme**'s shapes, and the **Theme spec** said SketchyBar's "layout stays this taskbar for every Theme". The second Theme, the **Marigold theme** (#139), is dark and modern, with rounded corners, translucency and blur, and Nerd Font icons. Recolored Win95 shapes can't give it that look. So a Theme may now reshape a tool as well as recolor it: each Theme's spec lists the tools that get a design of their own under it, and the rest only take its colors.

Each Theme's **Theme rules** (Purist fidelity is the Vintage theme's) become values in its **Theme source file**, as a `rules` block: `opacity`, `blur`, `radius` and `icons`. Every Theme has the block, so generators read numbers instead of asking which Theme is active.

The tools Marigold reshapes, and the setting each one moves:

- **SketchyBar**: its layout becomes per-Theme. Vintage keeps the XP taskbar at the bottom; Marigold has a floating, translucent bar at the top.
- **Ghostty**: opacity, blur and window decoration come from the active Theme, not only its colors.
- **VSCode**: the settings rewrite (ADR 0008) also sets `workbench.experimental.modernUI` and the title bar style per Theme.
- **JankyBorders**: style and width come from the Theme, not only its colors.
- **Starship**: joins the Switch, with one config per Theme, so Marigold's prompt can show icons.

## Considered options

- **Colors only, as before**: rejected. Marigold would be Win95 shapes in dark colors, not a modern look, and wouldn't show that Themes are general.
- **Rules as prose in each spec, with generators branching on the Theme's name**: rejected. Every generator would grow an `if vintage`, and a third Theme would mean editing all of them.
- **A Display for Marigold**: rejected. The LCD readout is a Vintage skeuomorph. The Display palette becomes optional: a Theme without one draws those places in Frame roles.

## Consequences

- A Theme source file may leave out the Display palette. Wherever Vintage draws a Display, other Themes use Frame roles.
- A tool's files can differ in structure between Themes, not only in values. Each reshaped tool needs its own build issue, and its tests check each Theme's shape.
- Generated files that bake in a Vintage choice need to take it per Theme. The first is VSCode's editor selection, which Vintage paints `ansi_11`; under Marigold that's pale yellow and unreadable.
- Neovim stays out of the Switch (ADR 0007) and Deepvue stays out of Marigold, so neither is reshaped.
