#!/bin/bash

# CPU use across every core, as a share of the whole machine.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/plugins/marigold/cpu_use.sh"

sketchybar --set "$NAME" label="${USE}%"
