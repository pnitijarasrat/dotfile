# Raycast and the Event Viewer stay Vintage

#140 and #158 keep Raycast and the Claude Code Event Viewer out of the **Switch**: whatever **Theme** is active, Raycast keeps its "Vintage" theme selected, and the Event Viewer keeps its Win95 window and its **Display**. This is the owner's choice; neither issue records a reason beyond it.

## Considered options

- **Both join the Switch**: rejected. It meant a Marigold design for each (a Raycast theme, and an Event Viewer window without a Display, since the **Marigold theme** has none) and a place for each in the Switch and its test.

## Consequences

- Narrows ADR 0004's "tools never mix Themes" and ADR 0007's "the rule holds for every tool except Neovim": the rule holds for every tool in the Switch. Neovim, Raycast and the Event Viewer always show the **Vintage theme**, so under any other Theme the Mac shows two at once.
- Their Vintage tests keep running once, against `themes/vintage.json`, and the Switch test doesn't check them.
- The Marigold **Theme spec**'s Per tool table and Out of scope list say so (#158).
- To bring either in, give it a row of its own in the Marigold spec and add it to the Switch.
