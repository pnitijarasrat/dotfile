#!/bin/sh
# Sets the Shortcuts macOS owns (#114, #125, #126) in com.apple.symbolichotkeys,
# then applies them without logging out. Safe to re-run: every entry is
# written whole, and entries not listed here are left alone.
#
# Run: sh ~/.config/macos/hotkeys.sh
# HOTKEYS_DOMAIN points it at another plist (the test uses a scratch one)
# and skips applying.
set -eu

domain=${HOTKEYS_DOMAIN:-com.apple.symbolichotkeys}

# Modifier masks as macOS stores them.
cmd=1048576      # 0x100000
meh=917504       # ctrl+alt+shift
hyper=1966080    # ctrl+alt+shift+cmd, what Karabiner sends for Right Option

# hotkey <id> <enabled: true|false> <char> <keycode> <modifiers>
hotkey() {
  defaults write "$domain" AppleSymbolicHotKeys -dict-add "$1" "
    <dict>
      <key>enabled</key><$2/>
      <key>value</key>
      <dict>
        <key>parameters</key>
        <array><integer>$3</integer><integer>$4</integer><integer>$5</integer></array>
        <key>type</key><string>standard</string>
      </dict>
    </dict>"
}

# ── Input source (ABC ⇄ Thai) on ⌘Space; Spotlight stays off it ──
hotkey 60 true 32 49 "$cmd"
hotkey 64 false 65535 49 "$cmd"

# ── Screenshots on Hyper+3 / 4 / 5, freeing ⇧⌘3/4/5 ──
hotkey 28 true 51 20 "$hyper"    # whole screen
hotkey 30 true 52 21 "$hyper"    # area
hotkey 184 true 53 23 "$hyper"   # toolbar

# ── Desktop 1–10: off ──
# Spaces are switched in Mission Control (#126): these hotkeys always slide.
# Written whole so the old ⌃⌥⇧ + 1–0 chords stay recorded if turned back on.
hotkey 118 false 49 18 "$meh"     # Desktop 1
hotkey 119 false 50 19 "$meh"     # Desktop 2
hotkey 120 false 51 20 "$meh"     # Desktop 3
hotkey 121 false 52 21 "$meh"     # Desktop 4
hotkey 122 false 53 23 "$meh"     # Desktop 5
hotkey 123 false 54 22 "$meh"     # Desktop 6
hotkey 124 false 55 26 "$meh"     # Desktop 7
hotkey 125 false 56 28 "$meh"     # Desktop 8
hotkey 126 false 57 25 "$meh"     # Desktop 9
hotkey 127 false 48 29 "$meh"     # Desktop 10

# ── Move focus to next window (was Hyper+Q): off ──
hotkey 27 false 113 12 "$hyper"

[ -n "${HOTKEYS_DOMAIN:-}" ] && exit 0

# Make the running session pick the new hotkeys up.
/System/Library/PrivateFrameworks/SystemAdministration.framework/Resources/activateSettings -u
