#!/bin/bash

# app_icon <app name> sets icon_result to the app's sketchybar-app-font glyph.
# The installed font has no Ghostty glyph, so Ghostty draws as the terminal.
source "$CONFIG_DIR/icon_map.sh"

app_icon() {
  case "$1" in
  Ghostty) icon_result=":terminal:" ;;
  *) __icon_map "$1" ;;
  esac
}
