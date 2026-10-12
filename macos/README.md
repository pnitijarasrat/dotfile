# macOS Shortcuts

`hotkeys.sh` sets the Shortcuts macOS owns (#114, #125) and applies them without logging out. Re-running it changes nothing.

| Shortcut | Chord |
|---|---|
| Switch input source (ABC ⇄ Thai), id 60 | ⌘Space |
| Screenshot of the screen / an area / toolbar, ids 28 / 30 / 184 | Hyper+3 / 4 / 5 |
| Switch to Desktop 1–10, ids 118–127 | ⌃⌥⇧ + 1–0 (hidden: no Karabiner layer sends ⌃⌥⇧ without ⌘, so only skhd sends these) |
| Move focus to next window, id 27 | off |

Spotlight (id 64) stays off ⌘Space. The clipboard screenshot variants (ids 29 and 31, ⌃⇧⌘3/4) are left alone. Screenshots already go to the clipboard.

## Raycast checklist

Raycast keeps these two settings in its own UI. Do them **before** running the script: Raycast holds ⌘Space until it's moved.

1. Raycast Settings → General → Raycast Hotkey: record **⌃Space**.
2. Raycast Settings → Extensions → **+** → Add Script Directory: pick `~/.config/raycast/scripts` (press Cmd+Shift+. in the file picker to show `.config`). This adds "Restart yabai" and "Restart skhd". Don't give them hotkeys.

Then run:

```sh
sh ~/.config/macos/hotkeys.sh
```

Check the script with `node macos/tests/hotkeys_test.mjs`. The test writes to a scratch plist, not your live settings.
