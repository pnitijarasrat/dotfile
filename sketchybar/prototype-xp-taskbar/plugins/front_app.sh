#!/bin/bash
# PROTOTYPE (issue #9)
APP="$INFO"
[ "$SENDER" != front_app_switched ] && APP=$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true')
sketchybar --set "$NAME" label="$APP"
