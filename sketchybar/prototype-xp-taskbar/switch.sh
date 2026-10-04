#!/bin/bash
# PROTOTYPE (issue #9): flips the live bar between variants.
#   switch.sh A|B|C   jump to a variant
#   switch.sh next|prev
#   switch.sh off     back to the normal sketchybarrc
# The choice lives in /tmp, so a reboot also returns to normal.
STATE=/tmp/sketchybar_proto_variant
ALL=(A B C)
CUR=$(cat "$STATE" 2>/dev/null || echo off)

idx=0
for i in "${!ALL[@]}"; do [ "${ALL[i]}" = "$CUR" ] && idx=$i; done

case "$1" in
  next) NEW=${ALL[$(((idx + 1) % ${#ALL[@]}))]} ;;
  prev) NEW=${ALL[$(((idx + ${#ALL[@]} - 1) % ${#ALL[@]}))]} ;;
  A|B|C|off) NEW=$1 ;;
  *) echo "usage: $0 A|B|C|next|prev|off  (now: $CUR)"; exit 1 ;;
esac

echo "$NEW" >"$STATE"

# Make room for the bar where it now sits. Runtime-only; ~/.yabairc is untouched.
case "$NEW" in
  B) yabai -m config top_padding 8; yabai -m config bottom_padding 38 ;;
  C) yabai -m config top_padding 38; yabai -m config bottom_padding 8 ;;
  *) yabai -m config top_padding 44; yabai -m config bottom_padding 8 ;;
esac

sketchybar --reload
echo "variant: $NEW"
