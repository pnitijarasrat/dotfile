#!/bin/bash

# The volume popup's meter's script: a click sets the output volume to where
# it landed. volume_change then redraws the volume item.
[ "$SENDER" = "mouse.clicked" ] || exit 0
osascript -e "set volume output volume $PERCENTAGE"
sketchybar --set "$NAME" slider.percentage="$PERCENTAGE"
