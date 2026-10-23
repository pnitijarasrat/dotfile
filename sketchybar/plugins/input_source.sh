#!/bin/sh

# Sets SOURCE_ID to the active input source's ID and INPUT_LABEL to its short
# name on the bar. Sourced by each Theme's language plugin.
SOURCE_ID=$(defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleCurrentKeyboardLayoutInputSourceID 2>/dev/null)

case "$SOURCE_ID" in
*Thai*)
  INPUT_LABEL="TH"
  ;;
*)
  INPUT_LABEL="EN"
  ;;
esac
