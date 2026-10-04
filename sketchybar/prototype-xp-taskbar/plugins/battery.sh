#!/bin/bash
# PROTOTYPE (issue #9). $1 = text|pixel
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"
BATT=$(pmset -g batt)
PCT=$(echo "$BATT" | grep -Eo "\d+%" | cut -d% -f1)
[ -z "$PCT" ] && exit 0
CHARGING=$(echo "$BATT" | grep 'AC Power')

if [ "$1" = pixel ]; then
  if [ -n "$CHARGING" ]; then IMG=battery_charging
  elif [ "$PCT" -ge 90 ]; then IMG=battery_100
  elif [ "$PCT" -ge 60 ]; then IMG=battery_75
  elif [ "$PCT" -ge 30 ]; then IMG=battery_50
  elif [ "$PCT" -ge 10 ]; then IMG=battery_25
  else IMG=battery_low; fi
  sketchybar --set "$NAME" icon.background.image="$ICONS/$IMG.png" label="$PCT%"
else
  COLOR=$BLACK
  [ "$PCT" -lt 20 ] && COLOR=$D_RED
  [ -n "$CHARGING" ] && LABEL="AC $PCT%" || LABEL="BAT $PCT%"
  sketchybar --set "$NAME" label="$LABEL" label.color=$COLOR
fi
