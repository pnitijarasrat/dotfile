#!/bin/bash

# The weather popup: now, then the next three of the report's three-hourly
# readings (into tomorrow's, late in the day), and tomorrow, from the report
# weather.sh last fetched, so opening never fetches.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
source "$CONFIG_DIR/plugins/weather_data.sh"

popup_begin weather
if [ ! -s "$WEATHER_CACHE" ]; then
  popup_header none "No weather yet"
  popup_draw
  exit 0
fi

REPORT="$(cat "$WEATHER_CACHE")"
NOW="$(date +%H%M)"
popup_big now "$(jq -r '.current_condition[0] | "\(.temp_C)° \(.weatherDesc[0].value)"' <<<"$REPORT")"
popup_header today "$(jq -r '"\(.location) · H \(.weather[0].maxtempC)° L \(.weather[0].mintempC)°"' <<<"$REPORT")"
INDEX=0
while IFS=$'\t' read -r TIME CONDITION TEMPERATURE; do
  [ -z "$TIME" ] && continue
  popup_row "hour_$INDEX" "$TIME $CONDITION" "$TEMPERATURE°" ""
  INDEX=$((INDEX + 1))
done < <(jq -r --argjson now "$((10#$NOW))" '
  ([.weather[0].hourly[] | select((.time | tonumber) > $now)] + .weather[1].hourly)[:3][] |
  [(.time | tonumber / 100 | floor | tostring | if length == 1 then "0" + . else . end) + ":00", .weatherDesc[0].value, .tempC] | @tsv
' <<<"$REPORT")
popup_row tomorrow "$(jq -r '"Tomorrow \(.weather[1].hourly[4].weatherDesc[0].value)"' <<<"$REPORT")" \
  "$(jq -r '"\(.weather[1].maxtempC)° \(.weather[1].mintempC)°"' <<<"$REPORT")" ""
popup_draw
