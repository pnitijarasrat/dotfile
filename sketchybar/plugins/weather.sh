#!/usr/bin/env zsh

source "$CONFIG_DIR/color.sh"

IP=$(curl -s --max-time 5 https://ipinfo.io/ip)
LOCATION_JSON=$(curl -s --max-time 5 "https://ipinfo.io/$IP/json")

LOCATION="$(echo $LOCATION_JSON | jq '.city' | tr -d '"')"
REGION="$(echo $LOCATION_JSON | jq '.region' | tr -d '"')"

if [ -z "$LOCATION" ] || [ "$LOCATION" = "null" ]; then
  sketchybar --set weather icon.background.image="$ICONS/cloud.png" label="--°C"
  return
fi

LOCATION_ESCAPED="${LOCATION// /+}+${REGION// /+}"
WEATHER_JSON=$(curl -s --max-time 5 "https://wttr.in/$LOCATION_ESCAPED?format=j1")

if [ -z "$WEATHER_JSON" ]; then
  sketchybar --set weather icon.background.image="$ICONS/cloud.png" label="--°C"
  return
fi

TEMPERATURE=$(echo $WEATHER_JSON | jq '.current_condition[0].temp_C' | tr -d '"')
CONDITION=$(echo $WEATHER_JSON | jq '.current_condition[0].weatherDesc[0].value' | tr -d '"')

case "$CONDITION" in
*Sunny* | *Clear*) ICON="sun" ;;
*"Partly cloudy"*) ICON="partly_cloudy" ;;
*Thunder*) ICON="storm" ;;
*Rain* | *rain* | *Drizzle* | *Shower*) ICON="rain" ;;
*Snow* | *Sleet* | *Ice*) ICON="snow" ;;
*Mist* | *Fog* | *Haze*) ICON="fog" ;;
*) ICON="cloud" ;;
esac

# ${TEMPERATURE} braced: unbraced, a non-UTF-8 locale reads the first byte of ° as part of the name.
sketchybar --set weather icon.background.image="$ICONS/$ICON.png" label="${TEMPERATURE}°C"
