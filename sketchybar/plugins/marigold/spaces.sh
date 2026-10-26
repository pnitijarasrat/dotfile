#!/bin/bash

# The spaces on the left (#172): an item for each space yabai has, on its own
# display's bar, so each display lists only its own spaces. A full-screen
# space has none, as its bar hides. The layout runs this on load, and its
# hidden spaces item runs it again as spaces come, go and move between
# displays. Each item moves before that item in turn, so they stay in order,
# ahead of the front app.
source "$CONFIG_DIR/color.sh"
MARIGOLD_PLUGINS="$CONFIG_DIR/plugins/marigold"

# "<index> <display>" for each space, in order. Without yabai, spaces 1 to
# 10 with no display, which SketchyBar puts on their own display's bar itself.
SPACES="$(yabai -m query --spaces 2>/dev/null | jq -r '.[] | select(."is-native-fullscreen" | not) | "\(.index) \(.display)"')"
[ "$SPACES" = "" ] && SPACES="$(seq 1 10)"
SHOWN="$(sketchybar --query bar 2>/dev/null | jq -r '.items[] | select(startswith("space."))')"

args=()
for item in $SHOWN; do
  grep -qE "^${item#space.}( |$)" <<<"$SPACES" || args+=(--remove "$item")
done

while read -r sid display; do
  [ "$sid" = "" ] && continue
  if grep -qx "space.$sid" <<<"$SHOWN"; then
    [ "$display" = "" ] || args+=(--set space."$sid" display="$display")
    args+=(--move space."$sid" before spaces)
    continue
  fi
  # Spaces past the tenth have no ⌘ key, so show their whole number.
  icon=$((sid > 10 ? sid : sid % 10))
  space=(
    space="$sid"
    icon="$icon"
    icon.font="$bar_label_bold_font"
    icon.color="$frame_gray_text"
    icon.padding_right=6
    label.font="$bar_app_font"
    label.drawing=off
    background.color="$frame_selection"
    script="$MARIGOLD_PLUGINS/space.sh"
    click_script="yabai -m space --focus $sid"
  )
  [ "$display" = "" ] || space+=(display="$display")
  args+=(--add space space."$sid" left --set space."$sid" "${space[@]}"
         --subscribe space."$sid" space_windows_change mouse.entered mouse.exited
         --move space."$sid" before spaces)
done <<<"$SPACES"

# Spaces that moved between displays show other windows now.
sketchybar "${args[@]}" --trigger space_windows_change
