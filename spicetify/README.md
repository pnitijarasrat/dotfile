# Spotify

Spotify in the **Vintage theme** ([#53](https://github.com/pnitijarasrat/dotfile/issues/53)), as a hand-written local [Spicetify](https://spicetify.app) theme named `Vintage`. Spotify is one maximized Win95 window, so it's all **Frame**; see the Spotify row in `docs/theme-spec.md`. No Marketplace, extensions or custom apps.

- `Themes/Vintage/color.ini`: the color scheme. Every slot is a Frame role, commented with its name.
- `Themes/Vintage/user.css`: role-named tokens (`--frame_face`, ...) plus the `--raised` and `--sunken` bevels, for what the color scheme can't reach.
- `Themes/Vintage/theme.js`: marks the window inactive (`html.vintage-window-inactive`) while another app has focus, so the title bar can grey out. CSS has no selector for window focus.
- `config-xpui.ini`: selects `Vintage` with the color scheme, CSS and theme.js injection on. Spicetify also writes its own state here (the `prefs_path` and the `[Backup]` version), so expect a diff after a backup.
- `Backup`, `Extracted`, `CustomApps` and `Extensions` are Spicetify's own and are gitignored.

## Apply

Spicetify reads its config from `~/.config/spicetify`, which is this folder, so nothing is symlinked.

```sh
spicetify backup apply   # first time: back up the stock Spotify, then patch it
spicetify apply          # after editing color.ini, user.css or theme.js
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

Run `node spicetify/tests/vintage_test.mjs` after any change. It checks the slot-to-role mapping against the spec row, that hex only appears in the token block, Purist fidelity (no rounded corners, blur, gradients or translucency; box-shadows only as the bevels), that only the Frame and Work surface font stacks appear and that bold Microsoft Sans Serif is Tahoma Bold, that buttons are raised push buttons that sink when pressed, with gray disabled glyphs and black icons, that the bright accent (the playing track, the on states) is navy, that track lists are sunken white list boxes with a navy selected row and no hover on rows or cards, that menus are raised with a navy hovered item, the tooltips, the Win95 scrollbars and the dotted focus outline, that the top bar is a navy title bar that theme.js greys out when Spotify loses focus, with a sunken white search box, that every `Deviation:` comment in `user.css` has a Spotify row in the spec's Deviations table, and the config.

Then check by eye in the running app (the list grows as #53 lands):

- [ ] Background, sidebar, player bar and cards are `frame_face` grey; no dark surfaces.
- [ ] Square corners everywhere: cover art, artist photos, cards, buttons, chips, the search box, menus, dialogs and the panels' edges.
- [ ] No gradients, blur or translucent surfaces: no dark fade under headers or cards, no blurred cover behind Now Playing, no frosted page header, no drop shadows under menus or cards.
- [ ] Playlist, album and artist headers, the sticky page header and the Now Playing view are flat grey, not tinted from the cover, and their text is black.
- [ ] Cover art and artist photos still show in full color, including the artist header photo.
- [ ] Home: the band behind the shortcuts is flat grey, not tinted from the cover.
- [ ] The top bar is navy across the whole window while Spotify has focus; click another app and it turns grey, click back and it's navy again. The traffic lights keep their system colors.
- [ ] The search box in the top bar is a sunken white field with a black icon and grey placeholder; the back, forward, Home and browse buttons are grey push buttons on the bar.
- [ ] Filter chips (All, Music, Podcasts) are grey push buttons; the selected one is navy with white text.
- [ ] Connect panel: the "This computer" card is grey, not black.
- [ ] Seek and volume bars have a light grey track with a navy fill.
- [ ] Buttons are raised grey push buttons with black glyphs: Home, back and forward, Play and the transport buttons, the play-on-hover buttons on cards, More, Add, Preview. No circles, no growing on hover.
- [ ] Pressing a button sinks it (sunken bevel, lighter grey face) until released; it doesn't fade.
- [ ] Disabled buttons (back with no history) have a grey glyph on a solid face, not a faded button, and don't sink when clicked.
- [ ] Icons are black: the top bar, the search box, the Now Playing placeholder, dialog close buttons.
- [ ] Shuffle and repeat on, and the liked heart, are navy (until the Media Rack's LEDs, #63); the playing track's title in a track list is navy.
- [ ] Text is black; secondary text (artists, captions) is grey.
- [ ] All text is Microsoft Sans Serif 14: sidebar, track lists, the player bar, menus, buttons, the search box. No Spotify Mix (Circular-like) text anywhere.
- [ ] Bold text (section headings such as "Made For You", "Your Library", the track list's column headers) is Tahoma Bold, not a smeared fake bold, and text Spotify draws regular stays Microsoft Sans Serif.
- [ ] Playlist, album and artist titles are Tahoma Bold 24, not huge; long titles still fit the header.
- [ ] No Spotify green anywhere: Play button, shuffle/repeat on, liked heart, the playing track's title, the progress and volume fill are navy.
- [ ] Track lists (playlist, album, Liked Songs, search songs) are sunken white list boxes; the Library sidebar stays grey.
- [ ] Clicking a track selects it in navy with white text: title, artist, album, duration and icons, the playing track's title too. Shift-click selects several.
- [ ] Track rows and cards don't change color or grow on hover, and the play-on-hover button still appears on rows (in place of the number) and cards, and still plays.
- [ ] Right-click a track: the context menu is a raised grey box with black text; the hovered item, and one whose submenu is open, is navy with white text and icon. Same for the Library's sort dropdown and the profile menu.
- [ ] Checked menu items (the Library's sort order) are black, not green.
- [ ] Tooltips (hover the back button, Shuffle) are pale yellow with a black hairline and black text.
- [ ] Scrollbars in the main view, the sidebar and menus are 16px, always shown when there's more to scroll: a light grey track with a raised grey thumb.
- [ ] Tab through the page: the focused control has a 1px dotted black outline inside it (white on a selected row or menu item); clicking with the mouse shows none.
- [ ] Error toasts are dark red.

`user.css` also remaps Spotify's own color sets (`.encore-*-set`), which the palette can't reach: they hard-code dark hex, or turn black once white becomes `frame_text` (#64). Known gaps still open in #53: black text on the dark red error toast.
