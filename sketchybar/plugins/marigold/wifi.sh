#!/bin/bash

# The Wi-Fi icon and network, struck through and "off" when there's no
# connection. A VPN shows as a "VPN" label, as on Vintage's taskbar.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/sf_symbols.sh"
WIFI=$(ipconfig getsummary en0 | awk -F ' SSID : ' '/ SSID : / {print $2}')
HOTSPOT=$(ipconfig getsummary en0 | grep sname | awk '{print $3}')
IP_ADDRESS=$(scutil --nwi | grep address | sed 's/.*://' | tr -d ' ' | head -1)
VPN=$(scutil --nwi | grep -m1 'VPN' | awk '{ print $4 }')

if [ "$HOTSPOT" != "" ] || [ "$WIFI" != "" ] || [ "$IP_ADDRESS" != "" ]; then
  ICON="$sf_wifi"
  # Connected with no network name, as over Ethernet.
  LABEL="${WIFI:-${HOTSPOT:-on}}"
else
  ICON="$sf_wifi_off"
  LABEL="off"
fi

if [ "$VPN" != "" ]; then
  LABEL="VPN"
fi

sketchybar --set "$NAME" icon="$ICON" label="$LABEL"
