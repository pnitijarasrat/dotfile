#!/bin/bash
# PROTOTYPE (issue #9). $1 = text|pixel
# Cached for 10 minutes so flipping variants doesn't hammer wttr.in.
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"
CACHE=/tmp/sketchybar_proto_weather
if [ ! -s "$CACHE" ] || [ $(($(date +%s) - $(stat -f %m "$CACHE"))) -gt 600 ]; then
  LOC=$(curl -s --max-time 5 https://ipinfo.io/json | jq -r '.city')
  W=$(curl -s --max-time 5 "https://wttr.in/${LOC// /+}?format=j1")
  TEMP=$(echo "$W" | jq -r '.current_condition[0].temp_C')
  COND=$(echo "$W" | jq -r '.current_condition[0].weatherDesc[0].value')
  printf '%s\t%s\t%s\n' "$LOC" "$TEMP" "$COND" >"$CACHE"
fi
IFS=$'\t' read -r LOC TEMP COND <"$CACHE"
[ -z "$TEMP" ] || [ "$TEMP" = null ] && TEMP="--"

case "$COND" in
  *Sunny* | *Clear*) IMG=sun ;;
  *"Partly cloudy"*) IMG=partly_cloudy ;;
  *Thunder*) IMG=storm ;;
  *Rain* | *rain* | *Drizzle* | *Shower*) IMG=rain ;;
  *Snow* | *Sleet* | *Ice*) IMG=snow ;;
  *Mist* | *Fog* | *Haze*) IMG=fog ;;
  *) IMG=cloud ;;
esac

if [ "$1" = pixel ]; then
  sketchybar --set "$NAME" icon.background.image="$ICONS/$IMG.png" label="${TEMP}°C"
else
  sketchybar --set "$NAME" label="$LOC ${TEMP}°C ${COND% }"
fi
