#!/bin/sh
# Sets the Shortcuts macOS owns (#114, #125) in com.apple.symbolichotkeys,
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

# Desktop 1–10 (ids 118–127) are not touched here: the user sets them by
# hand in System Settings, and nothing may change them unless they say so.

# ── Move focus to next window (was Hyper+Q): off ──
hotkey 27 false 113 12 "$hyper"

[ -n "${HOTKEYS_DOMAIN:-}" ] && exit 0

# Make the running session pick the new hotkeys up.
/System/Library/PrivateFrameworks/SystemAdministration.framework/Resources/activateSettings -u
