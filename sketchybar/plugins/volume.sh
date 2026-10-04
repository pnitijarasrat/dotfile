#!/bin/sh

source "$CONFIG_DIR/color.sh"
# The volume_change event supplies a $INFO variable in which the current volume
# percentage is passed to the script.

if [ "$SENDER" = "volume_change" ]; then
  VOLUME="$INFO"

  case "$VOLUME" in
  [6-9][0-9] | 100)
    ICON="󰕾" ICON_COLOR="$FG"
    ;;
  [3-5][0-9])
    ICON="󰖀" ICON_COLOR="$FG"
    ;;
  [1-9] | [1-2][0-9])
    ICON="󰕿" ICON_COLOR="$FG"
    ;;
  *) ICON="󰖁" ICON_COLOR="$RED" ;;
  esac

  sketchybar --set "$NAME" icon="$ICON" label="$VOLUME%" icon.color="$ICON_COLOR"
fi
