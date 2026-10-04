#!/bin/sh

source "$CONFIG_DIR/color.sh"
PERCENTAGE="$(pmset -g batt | grep -Eo "\d+%" | cut -d% -f1)"
CHARGING="$(pmset -g batt | grep 'AC Power')"

if [ "$PERCENTAGE" = "" ]; then
  exit 0
fi

case "${PERCENTAGE}" in
9[0-9] | 100) ICON="battery_100" ;;
[6-8][0-9]) ICON="battery_75" ;;
[3-5][0-9]) ICON="battery_50" ;;
[1-2][0-9]) ICON="battery_25" ;;
*) ICON="battery_low" ;;
esac

if [ "$CHARGING" != "" ]; then
  ICON="battery_charging"
fi

sketchybar --set "$NAME" icon.background.image="$ICONS/$ICON.png" label="${PERCENTAGE}%"
