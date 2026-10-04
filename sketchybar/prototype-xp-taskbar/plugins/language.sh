#!/bin/bash
# PROTOTYPE (issue #9)
SRC=$(defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleCurrentKeyboardLayoutInputSourceID 2>/dev/null)
case "$SRC" in *Thai*) L=TH ;; *) L=EN ;; esac
sketchybar --set "$NAME" label="$L"
