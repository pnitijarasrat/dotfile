#!/bin/bash
# PROTOTYPE (issue #9). $1 = text|pixel
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"
SSID=$(ipconfig getsummary en0 | awk -F ' SSID : ' '/ SSID : / {print $2}')
[ -z "$SSID" ] && SSID=$(ipconfig getsummary en0 | awk '/sname/ {print $3}')
IP=$(scutil --nwi | grep address | sed 's/.*://' | tr -d ' ' | head -1)
[ -z "$SSID" ] && [ -n "$IP" ] && SSID="Online"

if [ "$1" = pixel ]; then
  [ -n "$SSID" ] && IMG=wifi || IMG=wifi_off
  sketchybar --set "$NAME" icon.background.image="$ICONS/$IMG.png"
else
  if [ -n "$SSID" ]; then
    sketchybar --set "$NAME" label="$SSID" label.color=$BLACK
  else
    sketchybar --set "$NAME" label="Offline" label.color=$D_RED
  fi
fi
