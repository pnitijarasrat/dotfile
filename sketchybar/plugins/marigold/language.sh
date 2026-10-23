#!/bin/bash

# The active input source, as on Vintage's taskbar.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/plugins/input_source.sh"
sketchybar --set "$NAME" label="$INPUT_LABEL"
