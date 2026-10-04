#!/bin/sh
source "$CONFIG_DIR/color.sh"
SSID="$1"
SECURED="$2"

sketchybar --set wifi popup.drawing=off
echo off >/tmp/sketchybar_wifi_popup_state

KNOWN=$(networksetup -listpreferredwirelessnetworks en0 2>/dev/null | tail -n +2 | sed 's/^[[:space:]]*//' | grep -Fx "$SSID")

if [ -n "$KNOWN" ] || [ "$SECURED" = "false" ]; then
  # already saved, or an open network — no password needed
  networksetup -setairportnetwork en0 "$SSID" >/tmp/wifi_join.log 2>&1
else
  PASSWORD=$(osascript -e "text returned of (display dialog \"Enter password for \\\"$SSID\\\"\" default answer \"\" with hidden answer buttons {\"Cancel\",\"Join\"} default button \"Join\" with title \"Wi-Fi\")" 2>/dev/null)
  if [ $? -ne 0 ]; then
    exit 0 # user hit Cancel
  fi
  if [ -n "$PASSWORD" ]; then
    networksetup -setairportnetwork en0 "$SSID" "$PASSWORD" >/tmp/wifi_join.log 2>&1
  else
    networksetup -setairportnetwork en0 "$SSID" >/tmp/wifi_join.log 2>&1
  fi
fi

sleep 1
NAME=wifi "$CONFIG_DIR/plugins/wifi.sh"
