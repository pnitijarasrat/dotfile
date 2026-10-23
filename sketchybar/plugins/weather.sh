#!/usr/bin/env zsh

source "$CONFIG_DIR/color.sh"
source "$CONFIG_DIR/plugins/weather_data.sh"

if ! fetch_weather; then
  sketchybar --set weather icon.background.image="$ICONS/cloud.png" label="--°C"
  exit 0
fi

TEMPERATURE=$(echo $WEATHER_JSON | jq '.current_condition[0].temp_C' | tr -d '"')
CONDITION=$(echo $WEATHER_JSON | jq '.current_condition[0].weatherDesc[0].value' | tr -d '"')
weather_icon "$CONDITION"

# ${TEMPERATURE} braced: unbraced, a non-UTF-8 locale reads the first byte of ° as part of the name.
sketchybar --set weather icon.background.image="$ICONS/$WEATHER_ICON.png" label="${TEMPERATURE}°C"
