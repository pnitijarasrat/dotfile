#!/bin/bash

# The memory popup: the memory used of the total, then the top processes by
# memory.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
source "$CONFIG_DIR/plugins/marigold/memory_use.sh"
GB=1073741824
TOP="$(ps -Aceo rss=,comm= -m | head -5)"

popup_begin memory
popup_header total "Memory · $(awk -v used="$USED" -v gb="$GB" 'BEGIN { printf "%.1f", used / gb }') of $((TOTAL / GB)) GB"
popup_meter meter $((USED * 100 / TOTAL)) "$frame_data_orange"
INDEX=0
while read -r RSS COMMAND; do
  [ -z "$COMMAND" ] && continue
  popup_row "process_$INDEX" "$COMMAND" "$(awk -v kb="$RSS" 'BEGIN { printf "%.1f GB", kb / 1048576 }')" ""
  INDEX=$((INDEX + 1))
done <<<"$TOP"
popup_draw
