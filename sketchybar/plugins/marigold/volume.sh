#!/bin/bash

# The volume, or muted. volume_change passes the new volume in $INFO; on load,
# read it directly.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/sf_symbols.sh"
if [ "$SENDER" = "volume_change" ]; then
  VOLUME="$INFO"
else
  VOLUME="$(osascript -e 'output volume of (get volume settings)')"
fi
LABEL="${VOLUME}%"
if [ "$(osascript -e 'output muted of (get volume settings)')" = "true" ]; then
  VOLUME=0
  LABEL="muted"
fi

case "$VOLUME" in
[4-9][0-9] | 100) ICON="$sf_volume" ;;
0) ICON="$sf_volume_off" ;;
*) ICON="$sf_volume_low" ;;
esac

sketchybar --set "$NAME" icon="$ICON" label="$LABEL"
