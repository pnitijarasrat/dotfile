# A third surface, the Display, for LCD readouts

Spotify's player bar became a Media Rack unit (#63), modelled on the CD unit in Windows' multimedia app: its time and track readouts are black LCDs with lit cyan text over unlit "ghost" segments. Neither existing surface fits. The **Frame** is grey with black text, and the **Work surface** is white with navy text, for text that's read and edited. So we added a third surface, the **Display**, with its own roles: `display_bg` (`#000000`), `display_fg` (`#00FFFF`) and `display_ghost` (`#008080`).

Every Display value is a VGA color already in the ANSI table (`ansi_0`, `ansi_14`, `ansi_6`), so the theme gets no new colors, only new roles. Its text is the Work surface font, Fixedsys Excelsior at 16px, not a seven-segment font, so **Purist fidelity** still has only two font stacks. A Display always sits inside the Frame, in a sunken bevel; it never stands alone as a tool's palette.

## Considered options

- **Draw the LCDs with Work surface roles**: rejected; `work_bg` is white, and a black readout would mean reusing `ansi_*` roles by color rather than by meaning, which the spec forbids.
- **Use the `ansi_*` roles directly**: rejected for the same reason; Spotify isn't a terminal, and the roles say what the element is.
- **A seven-segment font**: rejected; it would be a third font stack, and Fixedsys Excelsior already reads as an LCD at 16px.

## Consequences

- The spec gains a Display table, `CONTEXT.md` the **Display** term, and the Spotify test checks the Display tokens like the others.
- In the player bar, Spotify's on states (shuffle, repeat, liked) show as `frame_data_green` LEDs rather than the navy bright accent.
