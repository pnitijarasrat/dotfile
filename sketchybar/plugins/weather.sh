#!/usr/bin/env zsh

source "$CONFIG_DIR/color.sh"
LOCATION_ICON="󰍎"
THERMO_ICON="󰔏"

IP=$(curl -s --max-time 5 https://ipinfo.io/ip)
LOCATION_JSON=$(curl -s --max-time 5 "https://ipinfo.io/$IP/json")

LOCATION="$(echo $LOCATION_JSON | jq '.city' | tr -d '"')"
REGION="$(echo $LOCATION_JSON | jq '.region' | tr -d '"')"

if [ -z "$LOCATION" ] || [ "$LOCATION" = "null" ]; then
  sketchybar --set weather icon="$LOCATION_ICON" label="Unknown  $THERMO_ICON --°C"
  sketchybar --set weather.cond icon="" icon.color="$GREY2"
  return
fi

LOCATION_ESCAPED="${LOCATION// /+}+${REGION// /+}"
WEATHER_JSON=$(curl -s --max-time 5 "https://wttr.in/$LOCATION_ESCAPED?format=j1")

if [ -z "$WEATHER_JSON" ]; then
  sketchybar --set weather icon="$LOCATION_ICON" label="$LOCATION  $THERMO_ICON --°C"
  sketchybar --set weather.cond icon="" icon.color="$GREY2"
  return
fi

TEMPERATURE=$(echo $WEATHER_JSON | jq '.current_condition[0].temp_C' | tr -d '"')
CONDITION=$(echo $WEATHER_JSON | jq '.current_condition[0].weatherDesc[0].value' | tr -d '"')

case "$CONDITION" in
*Sunny* | *Clear*)
  COND_ICON="󰖙"
  COND_COLOR="$YELLOW"
  ;;
*"Partly cloudy"*)
  COND_ICON="󰖕"
  COND_COLOR="$GREY2"
  ;;
*Cloudy* | *Overcast*)
  COND_ICON="󰖐"
  COND_COLOR="$AQUA"
  ;;
*Mist* | *Fog* | *Haze*)
  COND_ICON="󰖑"
  COND_COLOR="$BLUE"
  ;;
*"Light rain"* | *Drizzle* | *Shower*)
  COND_ICON="󰖗"
  COND_COLOR="$BLUE"
  ;;
*Rain* | *Thunderstorm* | *Torrential*)
  COND_ICON="󰖖"
  COND_COLOR="$PURPLE"
  ;;
*Snow* | *Sleet* | *Ice*)
  COND_ICON="󰖘"
  COND_COLOR="$FG"
  ;;
*)
  COND_ICON="󰖐"
  COND_COLOR="$GREY2"
  ;;
esac

sketchybar --set weather icon="$LOCATION_ICON" label="$LOCATION  $THERMO_ICON ${TEMPERATURE}°C"
sketchybar --set weather.cond icon="$COND_ICON" icon.color="$COND_COLOR"
