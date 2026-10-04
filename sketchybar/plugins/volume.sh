#!/bin/sh

source "$CONFIG_DIR/color.sh"
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
[4-9][0-9] | 100) ICON="volume" ;;
0) ICON="volume_mute" ;;
*) ICON="volume_low" ;;
esac

sketchybar --set "$NAME" icon.background.image="$ICONS/$ICON.png"
