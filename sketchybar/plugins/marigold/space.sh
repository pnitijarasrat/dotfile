#!/bin/bash

# The current space is marigold with frame_selection_text, under the mouse
# too; the rest are frame_gray_text, highlighted under the mouse. Each shows
# its windows' apps, once each, after its number.
source "$CONFIG_DIR/color.sh"
if [ "$SELECTED" = "true" ]; then
  BACKGROUND=(background.drawing=on background.color="$frame_selection")
  case "$SENDER" in
  mouse.*)
    sketchybar --set "$NAME" "${BACKGROUND[@]}"
    exit 0
    ;;
  esac
fi
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/plugins/marigold/app_icon.sh"

# SketchyBar runs this once per change, each run with SELECTED as it was then,
# and a run that waits on yabai can finish after a later one, leaving two
# spaces marigold. So each run marks itself the latest for its item, and only
# the latest draws.
LATEST="${TMPDIR:-/tmp}/sketchybar_marigold_$NAME"
echo "$$" >"$LATEST"

APPS=""
while read -r app; do
  [ "$app" = "" ] && continue
  app_icon "$app"
  APPS="${APPS:+$APPS }$icon_result"
done < <(yabai -m query --windows --space "$SID" 2>/dev/null | jq -r '.[].app' | awk '!seen[$0]++')

if [ "$APPS" = "" ]; then
  LABEL=(label.drawing=off)
else
  LABEL=(label="$APPS" label.drawing=on)
fi

[ "$(cat "$LATEST" 2>/dev/null)" = "$$" ] || exit 0

if [ "$SELECTED" = "true" ]; then
  sketchybar --set "$NAME" "${BACKGROUND[@]}" icon.color="$frame_selection_text" label.color="$frame_selection_text" "${LABEL[@]}"
else
  sketchybar --set "$NAME" background.drawing=off icon.color="$frame_gray_text" label.color="$frame_text" "${LABEL[@]}"
fi
