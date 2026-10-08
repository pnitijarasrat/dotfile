# Spotify

Spotify in the **Vintage theme** ([#53](https://github.com/pnitijarasrat/dotfile/issues/53)), as a hand-written local [Spicetify](https://spicetify.app) theme named `Vintage`. Spotify is one maximized Win95 window, so it's all **Frame**; see the Spotify row in `docs/theme-spec.md`. No Marketplace, extensions or custom apps.

- `Themes/Vintage/color.ini`: the color scheme. Every slot is a Frame role, commented with its name.
- `Themes/Vintage/user.css`: role-named tokens (`--frame_face`, ...) plus the `--raised` and `--sunken` bevels, for what the color scheme can't reach.
- `config-xpui.ini`: selects `Vintage` with the color scheme and CSS injection on. Spicetify also writes its own state here (the `prefs_path` and the `[Backup]` version), so expect a diff after a backup.
- `Backup`, `Extracted`, `CustomApps` and `Extensions` are Spicetify's own and are gitignored.

## Apply

Spicetify reads its config from `~/.config/spicetify`, which is this folder, so nothing is symlinked.

```sh
spicetify backup apply   # first time: back up the stock Spotify, then patch it
spicetify apply          # after editing color.ini or user.css
```

Spotify restarts with the theme.

## After Spotify updates itself

An update replaces the patched app, and Spotify comes back stock (dark and green). Re-apply:

```sh
spicetify backup apply
```

If Spicetify says the backup is from another Spotify version, run `spicetify restore backup apply`.

To go back to stock Spotify: `spicetify restore`.

## Check

Run `node spicetify/tests/vintage_test.mjs` after any change. It checks the slot-to-role mapping against the spec row, that hex only appears in the token block, Purist fidelity (no rounded corners, blur, gradients or translucency; box-shadows only as the bevels), and the config.

Then check by eye in the running app (the list grows as #53 lands):

- [ ] Background, sidebar, player bar and cards are `frame_face` grey; no dark surfaces.
- [ ] Square corners everywhere: cover art, artist photos, cards, buttons, chips, the search box, menus, dialogs and the panels' edges.
- [ ] No gradients, blur or translucent surfaces: no dark fade under headers or cards, no blurred cover behind Now Playing, no frosted top bar, no drop shadows under menus or cards.
- [ ] Playlist, album and artist headers, the top bar and the Now Playing view are flat grey, not tinted from the cover, and their text is black.
- [ ] Cover art and artist photos still show in full color, including the artist header photo.
- [ ] Home: the band behind the shortcuts is flat grey, not tinted from the cover. The Home button is a grey push button and the search box is a sunken white field.
- [ ] Filter chips (All, Music, Podcasts) are grey push buttons; the selected one is navy with white text.
- [ ] Connect panel: the "This computer" card is grey, not black.
- [ ] Seek and volume bars have a light grey track with a navy fill.
- [ ] Play-on-hover buttons on cards are navy with a white glyph.
- [ ] Text is black; secondary text (artists, captions) is grey.
- [ ] No Spotify green anywhere: Play button, shuffle/repeat on, liked heart, the playing track's title, the progress and volume fill are navy.
- [ ] Track rows and cards don't change color on hover.
- [ ] Error toasts are dark red.

`user.css` also remaps Spotify's own color sets (`.encore-*-set`), which the palette can't reach: they hard-code dark hex, or turn black once white becomes `frame_text` (#64). Known gaps still open in #53: black text on selected rows (#57) and on the dark red error toast.
