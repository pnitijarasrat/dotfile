#!/bin/bash

# A status item's click_script: opens its popup, closing any other, or closes
# it if it's open. plugins/marigold/popups/<item>.sh, if there is one, fills
# the popup before it opens; the rest keep theirs current themselves.
STATUS_ITEMS="media cpu memory weather language volume wifi battery clock"

if [ "$(sketchybar --query "$NAME" | jq -r '.popup.drawing' 2>/dev/null)" = "on" ]; then
  sketchybar --set "$NAME" popup.drawing=off
  exit 0
fi

CLOSE=()
for item in $STATUS_ITEMS; do
  [ "$item" = "$NAME" ] || CLOSE+=(--set "$item" popup.drawing=off)
done
sketchybar "${CLOSE[@]}"

FILL="$CONFIG_DIR/plugins/marigold/popups/$NAME.sh"
[ -x "$FILL" ] && "$FILL"
sketchybar --set "$NAME" popup.drawing=on
