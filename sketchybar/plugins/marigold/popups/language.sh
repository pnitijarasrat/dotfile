#!/bin/bash

# The language popup: the keyboard input sources, a check on the active one.
# Clicking one switches to it.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
source "$CONFIG_DIR/plugins/input_source.sh"
INPUT_SOURCES="$CONFIG_DIR/plugins/marigold/input_sources.js"

popup_begin language
popup_header title "Input source"
INDEX=0
while IFS=$'\t' read -r ID SOURCE; do
  [ -z "$ID" ] && continue
  CHECKED=off
  [ "$ID" = "$SOURCE_ID" ] && CHECKED=on
  popup_check "source_$INDEX" "$SOURCE" "$CHECKED" \
    "osascript -l JavaScript $(printf '%q' "$INPUT_SOURCES") $(printf '%q' "$ID") >/dev/null; sketchybar --set language popup.drawing=off"
  INDEX=$((INDEX + 1))
done < <(osascript -l JavaScript "$INPUT_SOURCES")
popup_draw
