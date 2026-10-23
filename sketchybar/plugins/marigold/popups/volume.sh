#!/bin/bash

# The volume popup: the output volume, which a click sets, then the output
# devices, a check on the active one. Clicking a device switches to it.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
VOLUME="$(osascript -e 'output volume of (get volume settings)')"
CURRENT="$(SwitchAudioSource -c -t output 2>/dev/null)"

popup_begin volume
popup_header title "Output volume"
popup_meter level "$VOLUME" "$frame_data_magenta" "$CONFIG_DIR/plugins/marigold/volume_set.sh"
popup_header output "Output"
INDEX=0
while read -r DEVICE; do
  [ -z "$DEVICE" ] && continue
  CHECKED=off
  [ "$DEVICE" = "$CURRENT" ] && CHECKED=on
  popup_check "device_$INDEX" "$DEVICE" "$CHECKED" "SwitchAudioSource -t output -s $(printf '%q' "$DEVICE") >/dev/null; sketchybar --set volume popup.drawing=off"
  INDEX=$((INDEX + 1))
done < <(SwitchAudioSource -a -t output 2>/dev/null)
popup_draw
