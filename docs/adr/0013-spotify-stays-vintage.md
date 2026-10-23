# Spotify stays Vintage

#158 keeps Spotify out of the **Switch**, as ADR 0012 does Raycast and the Event Viewer: whatever **Theme** is active, Spotify keeps its Spicetify "Vintage" theme, with the Media Rack player bar and its **Display**. This is the owner's choice. #140 already listed Spotify as staying Vintage; #157, which planned a Marigold Spicetify theme, was dropped unbuilt.

## Considered options

- **Spotify joins the Switch** (#157): rejected. It meant a Marigold Spicetify theme, its `color.ini` taken from `themes/marigold.json`, a player bar without a Display, and a Switch step to apply it, since Spicetify patches and restarts Spotify.

## Consequences

- ADR 0012's narrowing of "tools never mix Themes" covers Spotify too: under any Theme but Vintage, Spotify shows the **Vintage theme**.
- Spotify's Vintage test keeps running once, against `themes/vintage.json`, and the Switch test doesn't check it.
- The Marigold **Theme spec**'s Per tool table, Manual checklist and Out of scope list say so (#158).
- To bring it in, give it a Marigold design in the Marigold spec's Spotify row and add it to the Switch.
