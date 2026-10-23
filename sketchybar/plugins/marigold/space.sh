#!/bin/bash

# The current space is marigold with frame_selection_text; the rest are frame_gray_text.
source "$CONFIG_DIR/color.sh"

if [ "$SELECTED" = "true" ]; then
  sketchybar --set "$NAME" background.drawing=on icon.color="$frame_selection_text"
else
  sketchybar --set "$NAME" background.drawing=off icon.color="$frame_gray_text"
fi
