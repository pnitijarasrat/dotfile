#!/bin/bash

# The battery's charge, its icon frame_data_green, or frame_data_red when low
# and not charging.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/sf_symbols.sh"
PERCENTAGE="$(pmset -g batt | grep -Eo "\d+%" | cut -d% -f1)"
CHARGING="$(pmset -g batt | grep 'AC Power')"

if [ "$PERCENTAGE" = "" ]; then
  exit 0
fi

COLOR="$frame_data_green"
case "${PERCENTAGE}" in
9[0-9] | 100) ICON="$sf_battery_100" ;;
[6-8][0-9]) ICON="$sf_battery_75" ;;
[3-5][0-9]) ICON="$sf_battery_50" ;;
[2][0-9]) ICON="$sf_battery_25" ;;
*) ICON="$sf_battery_0" COLOR="$frame_data_red" ;;
esac

if [ "$CHARGING" != "" ]; then
  ICON="$sf_battery_charging"
  COLOR="$frame_data_green"
fi

sketchybar --set "$NAME" icon="$ICON" icon.color="$COLOR" label="${PERCENTAGE}%"
