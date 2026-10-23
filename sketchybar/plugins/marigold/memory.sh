#!/bin/bash

# The share of memory in use.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/plugins/marigold/memory_use.sh"

sketchybar --set "$NAME" label="$((USED * 100 / TOTAL))%"
