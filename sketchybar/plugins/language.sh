#!/bin/sh

source "$CONFIG_DIR/color.sh"

# Read the currently active input source ID
SOURCE_ID=$(defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleCurrentKeyboardLayoutInputSourceID 2>/dev/null)

case "$SOURCE_ID" in
*Thai*)
  LABEL="TH"
  ;;
*U.S.* | *US* | *ABC*)
  LABEL="EN"
  ;;
*)
  LABEL="EN"
  ;;
esac

sketchybar --set "$NAME" label="$LABEL" label.color="$FG"
