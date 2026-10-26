#!/bin/bash

# The front app's icon and name. front_app_switched passes the newly focused
# app in $INFO. On load there is no event yet, so ask System Events for the
# frontmost app instead.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/icon_map.sh"

if [ "$SENDER" = "front_app_switched" ]; then
  APP="$INFO"
else
  APP="$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true')"
fi

__icon_map "$APP"
sketchybar --set "$NAME" icon="$icon_result" label="$APP"
