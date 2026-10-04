#!/bin/sh
source "$CONFIG_DIR/color.sh"

WIFI=$(ipconfig getsummary en0 | awk -F ' SSID : ' '/ SSID : / {print $2}')
HOTSPOT=$(ipconfig getsummary en0 | grep sname | awk '{print $3}')
IP_ADDRESS=$(scutil --nwi | grep address | sed 's/.*://' | tr -d ' ' | head -1)
VPN=$(scutil --nwi | grep -m1 'VPN' | awk '{ print $4 }')

if [ "$HOTSPOT" != "" ] || [ "$WIFI" != "" ] || [ "$IP_ADDRESS" != "" ]; then
  ICON="wifi"
else
  ICON="wifi_off"
fi

# A VPN shows as a "VPN" label next to the signal bars.
if [ "$VPN" != "" ]; then
  sketchybar --set "$NAME" icon.background.image="$ICONS/$ICON.png" label="VPN" label.drawing=on
else
  sketchybar --set "$NAME" icon.background.image="$ICONS/$ICON.png" label.drawing=off
fi
