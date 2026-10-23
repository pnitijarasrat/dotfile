#!/bin/bash

# The clock popup: the date, then the month's calendar, Monday first, today
# in frame_selection. Each week is one row of the Nerd Font, three characters
# a day; today's week leaves today's place blank in its text and draws today
# as its label, highlighted, at that place: the text is given a width that
# ends where today begins.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
TODAY="$(date +%Y-%m-%d)"
DAY="$((10#${TODAY##*-}))"
FIRST="$(date -j -v1d -f %Y-%m-%d "$TODAY" +%u)"
DAYS="$(date -j -v1d -v+1m -v-1d -f %Y-%m-%d "$TODAY" +%d)"
# JetBrainsMonoNL's advance is 0.6 em, at 13pt.
CHAR_WIDTH=7.8

# calendar_row <id> <text> [<props>...]: one line of the calendar.
calendar_row() {
  local id="$POPUP_ITEM.$1" text="$2"
  shift 2
  ROWS+=(--add item "$id" popup."$POPUP_ITEM"
    --set "$id" width="$ROW_WIDTH" background.drawing=off
    icon="$text" icon.font="$POPUP_FONT" icon.color="$frame_text" icon.align=left icon.padding_left=8 icon.padding_right=0
    label.drawing=off "$@")
}

popup_begin clock
popup_big date "$(date -j -f %Y-%m-%d "$TODAY" '+%A %-d')"
popup_header month "$(date -j -f %Y-%m-%d "$TODAY" '+%B %Y')"
calendar_row weekdays " Mo Tu We Th Fr Sa Su" icon.color="$frame_gray_text"

WEEK=""
COLUMN=$((FIRST - 1))
for ((i = 0; i < COLUMN; i++)); do WEEK+="   "; done
TODAY_COLUMN=""
ROW=0
for ((d = 1; d <= DAYS; d++)); do
  if [ "$d" = "$DAY" ]; then
    WEEK+="   "
    TODAY_COLUMN="$COLUMN"
  else
    WEEK+="$(printf '%3d' "$d")"
  fi
  COLUMN=$((COLUMN + 1))
  if [ "$COLUMN" = 7 ] || [ "$d" = "$DAYS" ]; then
    if [ -n "$TODAY_COLUMN" ]; then
      # Today's digits start one character into its place.
      calendar_row "week_$ROW" "$WEEK" \
        icon.width="$(awk -v at=$((TODAY_COLUMN * 3 + 1)) -v w="$CHAR_WIDTH" 'BEGIN { printf "%.0f", at * w }')" \
        label="$(printf '%2d' "$DAY")" label.drawing=on label.font="$POPUP_BOLD" label.color="$frame_selection_text" \
        label.padding_left=0 label.padding_right=0 \
        label.background.drawing=on label.background.color="$frame_selection" \
        label.background.corner_radius=4 label.background.height=18
      TODAY_COLUMN=""
    else
      calendar_row "week_$ROW" "${WEEK%"${WEEK##*[! ]}"}"
    fi
    WEEK=""
    COLUMN=0
    ROW=$((ROW + 1))
  fi
done
popup_draw
