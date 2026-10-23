#!/bin/bash

# Sourced by each Marigold plugin before it draws its item: under the mouse
# the item is highlighted frame_light, and nothing else about it changes.
source "$CONFIG_DIR/color.sh"

case "$SENDER" in
mouse.entered)
  sketchybar --set "$NAME" background.drawing=on background.color="$frame_light"
  exit 0
  ;;
mouse.exited)
  sketchybar --set "$NAME" background.drawing=off
  exit 0
  ;;
esac
