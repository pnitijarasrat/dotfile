#!/bin/bash

# The time, as on Vintage's taskbar.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
sketchybar --set "$NAME" label="$(date '+%-H:%M')"
