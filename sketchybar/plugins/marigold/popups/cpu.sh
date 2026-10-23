#!/bin/bash

# The CPU popup: the total use, then the top processes by CPU, each as a
# share of the whole machine, as the total is.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
source "$CONFIG_DIR/plugins/marigold/cpu_use.sh"
TOP="$(ps -Aceo pcpu=,comm= -r | head -5)"

popup_begin cpu
popup_header total "CPU · ${USE}%"
INDEX=0
while read -r PCPU COMMAND; do
  [ -z "$COMMAND" ] && continue
  popup_row "process_$INDEX" "$COMMAND" "$(awk -v pcpu="$PCPU" -v cores="$CORES" 'BEGIN { printf "%.1f%%", pcpu / cores }')" ""
  INDEX=$((INDEX + 1))
done <<<"$TOP"
popup_draw
