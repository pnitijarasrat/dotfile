#!/bin/bash
# PROTOTYPE (issue #9). $1 = text|pixel
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"
VOL="$INFO"
[ "$SENDER" != volume_change ] && VOL=$(osascript -e 'output volume of (get volume settings)')
MUTED=$(osascript -e 'output muted of (get volume settings)')
[ "$MUTED" = true ] && VOL=0

if [ "$1" = pixel ]; then
  if [ "$VOL" -eq 0 ]; then IMG=volume_mute
  elif [ "$VOL" -lt 40 ]; then IMG=volume_low
  else IMG=volume; fi
  sketchybar --set "$NAME" icon.background.image="$ICONS/$IMG.png"
else
  if [ "$VOL" -eq 0 ]; then
    sketchybar --set "$NAME" label="MUTE" label.color=$D_RED
  else
    sketchybar --set "$NAME" label="VOL $VOL%" label.color=$BLACK
  fi
fi
