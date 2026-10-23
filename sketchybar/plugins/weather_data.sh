#!/bin/bash

# Weather for where this Mac is, shared by each Theme's weather plugin. Works
# under bash and zsh.

# fetch_weather sets LOCATION to the city and WEATHER_JSON to wttr.in's report
# for it, and keeps the report for the popup in WEATHER_CACHE. WEATHER_JSON is
# empty when either can't be fetched.
WEATHER_CACHE="${TMPDIR:-/tmp}/sketchybar_weather.json"
fetch_weather() {
  WEATHER_JSON=""
  IP=$(curl -s --max-time 5 https://ipinfo.io/ip)
  LOCATION_JSON=$(curl -s --max-time 5 "https://ipinfo.io/$IP/json")

  LOCATION="$(echo "$LOCATION_JSON" | jq -r '.city')"
  REGION="$(echo "$LOCATION_JSON" | jq -r '.region')"

  if [ -z "$LOCATION" ] || [ "$LOCATION" = "null" ]; then
    return 1
  fi

  LOCATION_ESCAPED="${LOCATION// /+}+${REGION// /+}"
  WEATHER_JSON=$(curl -s --max-time 5 "https://wttr.in/$LOCATION_ESCAPED?format=j1")
  [ -z "$WEATHER_JSON" ] && return 1
  echo "$WEATHER_JSON" | jq --arg location "$LOCATION" '. + { location: $location }' >"$WEATHER_CACHE"
}

# weather_icon <condition> sets WEATHER_ICON to the condition's icon name.
weather_icon() {
  case "$1" in
  *Sunny* | *Clear*) WEATHER_ICON="sun" ;;
  *"Partly cloudy"*) WEATHER_ICON="partly_cloudy" ;;
  *Thunder*) WEATHER_ICON="storm" ;;
  *Rain* | *rain* | *Drizzle* | *Shower*) WEATHER_ICON="rain" ;;
  *Snow* | *Sleet* | *Ice*) WEATHER_ICON="snow" ;;
  *Mist* | *Fog* | *Haze*) WEATHER_ICON="fog" ;;
  *) WEATHER_ICON="cloud" ;;
  esac
}
