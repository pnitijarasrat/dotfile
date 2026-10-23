#!/bin/bash

# The battery's charge, its icon frame_data_red when low and not charging.
source "$CONFIG_DIR/color.sh"
PERCENTAGE="$(pmset -g batt | grep -Eo "\d+%" | cut -d% -f1)"
CHARGING="$(pmset -g batt | grep 'AC Power')"

if [ "$PERCENTAGE" = "" ]; then
  exit 0
fi

COLOR="$frame_selection"
case "${PERCENTAGE}" in
9[0-9] | 100) ICON=$'' ;;
[6-8][0-9]) ICON=$'' ;;
[3-5][0-9]) ICON=$'' ;;
[2][0-9]) ICON=$'' ;;
*) ICON=$'' COLOR="$frame_data_red" ;;
esac

if [ "$CHARGING" != "" ]; then
  ICON=$''
  COLOR="$frame_selection"
fi

sketchybar --set "$NAME" icon="$ICON" icon.color="$COLOR" label="${PERCENTAGE}%"
