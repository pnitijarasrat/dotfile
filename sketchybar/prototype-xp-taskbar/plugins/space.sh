#!/bin/bash
# PROTOTYPE (issue #9). $1 = navy|bevel
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"
if [ "$1" = bevel ]; then
  [ "$SELECTED" = true ] && sketchybar --set "$NAME" "${SUNKEN[@]}" background.color=0xffefefef icon.font="$BOLD" \
                         || sketchybar --set "$NAME" "${RAISED[@]}" icon.font="$FONT"
else
  [ "$SELECTED" = true ] && sketchybar --set "$NAME" background.drawing=on icon.color=$WHITE \
                         || sketchybar --set "$NAME" background.drawing=off icon.color=$BLACK
fi
