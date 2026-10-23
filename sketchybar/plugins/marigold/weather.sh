#!/bin/bash

# The temperature, its icon the condition's, fetched as on Vintage's taskbar.
# The popup draws from the report fetch_weather keeps.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/plugins/weather_data.sh"
source "$CONFIG_DIR/sf_symbols.sh"

if ! fetch_weather; then
  sketchybar --set "$NAME" icon="$sf_cloud" label="--°"
  exit 0
fi

TEMPERATURE="$(jq -r '.current_condition[0].temp_C' <<<"$WEATHER_JSON")"
weather_icon "$(jq -r '.current_condition[0].weatherDesc[0].value' <<<"$WEATHER_JSON")"
ICON="sf_$WEATHER_ICON"
sketchybar --set "$NAME" icon="${!ICON}" label="${TEMPERATURE}°"
