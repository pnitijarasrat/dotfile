#!/bin/bash

# The current space is a pushed-in taskbar button; the rest stay raised.
source "$CONFIG_DIR/color.sh"
source "$CONFIG_DIR/bevel.sh"

if [ "$SELECTED" = "true" ]; then
  sketchybar --set "$NAME" "${SUNKEN[@]}" background.color="$frame_light" icon.font="$BOLD"
else
  sketchybar --set "$NAME" "${RAISED[@]}" icon.font="$FONT"
fi
