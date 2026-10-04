#!/bin/sh

# front_app_switched passes the newly focused app in $INFO. On load there is
# no event yet, so ask System Events for the frontmost app instead.
if [ "$SENDER" = "front_app_switched" ]; then
  APP="$INFO"
else
  APP="$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true')"
fi

sketchybar --set "$NAME" label="$APP"
