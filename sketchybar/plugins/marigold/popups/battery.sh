#!/bin/bash

# The battery popup: the percent, charging or the time left, and a meter,
# frame_data_red when low and not charging, as the battery item's icon.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
REPORT="$(pmset -g batt | grep InternalBattery)"
PERCENTAGE="$(grep -Eo '[0-9]+%' <<<"$REPORT" | cut -d% -f1)"
STATE="$(awk -F '; ' '{ print $2 }' <<<"$REPORT")"
LEFT="$(grep -Eo '[0-9]+:[0-9]+ remaining' <<<"$REPORT" | cut -d' ' -f1)"

case "$STATE" in
charging) STATUS="Charging${LEFT:+ · full in $LEFT}" ;;
charged | finishing*) STATUS="Charged" ;;
*) STATUS="Battery${LEFT:+ · $LEFT left}" ;;
esac
COLOR="$frame_data_green"
[ "$STATE" = "discharging" ] && [ "${PERCENTAGE:-100}" -lt 20 ] && COLOR="$frame_data_red"

popup_begin battery
popup_big percent "${PERCENTAGE}%"
popup_header status "$STATUS"
popup_meter meter "$PERCENTAGE" "$COLOR"
popup_draw
