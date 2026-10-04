#!/bin/sh
source "$CONFIG_DIR/color.sh"

ICON_HOTSPOT="􀉤"
ICON_WIFI="􀙇"
ICON_WIFI_OFF="􀙈"
ICON_VPN="󰒘"
COLOR_DEFAULT="$FG"
COLOR_CYAN_BRIGHT="$FG"
COLOR_NO_WIFI="$GREY0"

WIFI=$(ipconfig getsummary en0 | awk -F ' SSID : ' '/ SSID : / {print $2}')
HOTSPOT=$(ipconfig getsummary en0 | grep sname | awk '{print $3}')
if [[ $HOTSPOT != "" ]]; then
  COLOR=$COLOR_DEFAULT
  ICON=$ICON_HOTSPOT
  LABEL=$HOTSPOT
elif [[ $WIFI != "" ]]; then
  COLOR=$COLOR_DEFAULT
  ICON=$ICON_WIFI
  LABEL=$WIFI
fi
IP_ADDRESS=$(scutil --nwi | grep address | sed 's/.*://' | tr -d ' ' | head -1)
VPN=$(scutil --nwi | grep -m1 'VPN' | awk '{ print $4 }')

if [[ $VPN != "" ]]; then
  COLOR=$COLOR_CYAN_BRIGHT
  ICON=$ICON_VPN
  LABEL=$LABEL
  sketchybar --add item vpn right --set vpn label="Secured" padding_left=8 padding_right=2 background.border_width=0 background.height=24 \
    --add bracket conn vpn status --set conn \
    --set vpn conn drawing=on
else
  sketchybar --set vpn conn drawing=off
  if [[ $HOTSPOT != "" ]]; then
    COLOR=$COLOR_DEFAULT
    ICON=$ICON_HOTSPOT
    LABEL=$HOTSPOT
  elif [[ $WIFI != "" ]]; then
    COLOR=$COLOR_CYAN_BRIGHT
    ICON=$ICON_WIFI
    LABEL=$WIFI
  elif [[ $IP_ADDRESS != "" ]]; then
    COLOR=$COLOR_DEFAULT
    ICON=$ICON_WIFI
    LABEL="on"
  else
    COLOR=$COLOR_NO_WIFI
    ICON=$ICON_WIFI_OFF
    LABEL="off"
  fi
fi

sketchybar --set $NAME icon=$ICON label="$LABEL" icon.color="$COLOR"
