#!/bin/bash

# The Wi-Fi icon, struck through when there's no connection. A VPN shows as a
# "VPN" label, as on Vintage's taskbar.
WIFI=$(ipconfig getsummary en0 | awk -F ' SSID : ' '/ SSID : / {print $2}')
HOTSPOT=$(ipconfig getsummary en0 | grep sname | awk '{print $3}')
IP_ADDRESS=$(scutil --nwi | grep address | sed 's/.*://' | tr -d ' ' | head -1)
VPN=$(scutil --nwi | grep -m1 'VPN' | awk '{ print $4 }')

if [ "$HOTSPOT" != "" ] || [ "$WIFI" != "" ] || [ "$IP_ADDRESS" != "" ]; then
  ICON=$''
else
  # nf-md-wifi_off as UTF-8: bash 3.2 has no \U escapes.
  ICON=$'\xf3\xb0\x96\xaa'
fi

if [ "$VPN" != "" ]; then
  sketchybar --set "$NAME" icon="$ICON" label="VPN" label.drawing=on
else
  sketchybar --set "$NAME" icon="$ICON" label.drawing=off
fi
