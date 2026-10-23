#!/bin/bash

# volume_change passes the new volume in $INFO; on load, read it directly.
if [ "$SENDER" = "volume_change" ]; then
  VOLUME="$INFO"
else
  VOLUME="$(osascript -e 'output volume of (get volume settings)')"
fi
if [ "$(osascript -e 'output muted of (get volume settings)')" = "true" ]; then
  VOLUME=0
fi

case "$VOLUME" in
[4-9][0-9] | 100) ICON=$'' ;;
# nf-md-volume_off as UTF-8: bash 3.2 has no \U escapes.
0) ICON=$'\xf3\xb0\x96\x81' ;;
*) ICON=$'' ;;
esac

sketchybar --set "$NAME" icon="$ICON"
