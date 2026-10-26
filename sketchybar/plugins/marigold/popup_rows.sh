#!/bin/bash

# Builds a status item's popup: popup_begin <item>, then a row function per
# row, then popup_draw, which replaces the popup's old rows with the new ones
# in one call, so it never shows half-built. Rows are named <item>.<id>, the
# Frame as the spec's "Where popups go": frame_text on the popup's
# frame_face, headers frame_gray_text, frame_light under the mouse, in the
# bar's pill's corners.
source "$CONFIG_DIR/color.sh"
source "$CONFIG_DIR/plugins/marigold/pill.sh"
source "$CONFIG_DIR/sf_symbols.sh"
POPUP_FONT="JetBrainsMonoNL Nerd Font:Regular:13.0"
POPUP_BOLD="JetBrainsMonoNL Nerd Font:Bold:13.0"
# Deviation (Theme spec): headings at 11 and large readings at 20, beside the bar's 13.
POPUP_HEADER_FONT="JetBrainsMonoNL Nerd Font:Bold:11.0"
POPUP_BIG_FONT="JetBrainsMonoNL Nerd Font:Bold:20.0"
POPUP_SYMBOL_FONT="SF Pro:Regular:13.0"
# A row's text, then its value against the right edge.
ROW_WIDTH=240
VALUE_WIDTH=80

popup_begin() {
  POPUP_ITEM="$1"
  ROWS=()
  for row in $(sketchybar --query "$POPUP_ITEM" 2>/dev/null | jq -r '.popup.items[]?' 2>/dev/null); do
    ROWS+=(--remove "$row")
  done
}

# popup_header <id> <text>: a heading for the rows below it.
popup_header() {
  ROWS+=(--add item "$POPUP_ITEM.$1" popup."$POPUP_ITEM"
    --set "$POPUP_ITEM.$1" width="$ROW_WIDTH" icon.drawing=off
    label="$2" label.font="$POPUP_HEADER_FONT" label.color="$frame_gray_text" label.padding_left=8
    background.drawing=off)
}

# popup_big <id> <text>: a reading in large type, at the top of a popup.
popup_big() {
  ROWS+=(--add item "$POPUP_ITEM.$1" popup."$POPUP_ITEM"
    --set "$POPUP_ITEM.$1" width="$ROW_WIDTH" icon.drawing=off
    label="$2" label.font="$POPUP_BIG_FONT" label.color="$frame_text" label.padding_left=8
    background.drawing=off)
}

# popup_row <id> <text> <value> <click_script> [<prop>=<value>...]: a row,
# highlighted under the mouse, that runs click_script when clicked. value
# and click_script may be empty; props override the row's own.
popup_row() {
  local id="$POPUP_ITEM.$1" text="$2" value="$3" click="$4"
  shift 4
  ROWS+=(--add item "$id" popup."$POPUP_ITEM"
    --set "$id" width="$ROW_WIDTH"
    icon="$text" icon.font="$POPUP_FONT" icon.color="$frame_text" icon.max_chars=26
    icon.width=$((ROW_WIDTH - VALUE_WIDTH - 8)) icon.padding_left=8 icon.padding_right=0
    label="$value" label.font="$POPUP_FONT" label.color="$frame_gray_text" label.drawing="$([ -n "$value" ] && echo on || echo off)"
    label.width="$VALUE_WIDTH" label.align=right label.padding_left=0 label.padding_right=8
    background.color="$frame_light" background.corner_radius="$PILL_RADIUS" background.height=22 background.drawing=off
    script="$CONFIG_DIR/plugins/marigold/hover.sh" click_script="$click" "$@"
    --subscribe "$id" mouse.entered mouse.exited)
}

# popup_check <id> <text> <checked> <click_script>: a row with a check against
# the right edge when checked is "on".
popup_check() {
  local check=""
  [ "$3" = "on" ] && check="$sf_check"
  popup_row "$1" "$2" "$check" "$4" label.font="$POPUP_SYMBOL_FONT" label.color="$frame_selection"
}

# popup_meter <id> <percent> <color> [<script>]: a bar filled to percent.
# Clicking it runs script, if given, with the percent clicked in $PERCENTAGE.
popup_meter() {
  ROWS+=(--add slider "$POPUP_ITEM.$1" popup."$POPUP_ITEM" $((ROW_WIDTH - 16))
    --set "$POPUP_ITEM.$1" padding_left=8 padding_right=8 icon.drawing=off label.drawing=off background.drawing=off
    slider.percentage="$2" slider.highlight_color="$3" slider.knob.drawing=off
    slider.background.color="$frame_light" slider.background.height=6 slider.background.corner_radius=3)
  if [ -n "$4" ]; then
    ROWS+=(--set "$POPUP_ITEM.$1" script="$4" --subscribe "$POPUP_ITEM.$1" mouse.clicked)
  fi
}

popup_draw() {
  sketchybar "${ROWS[@]}"
}
