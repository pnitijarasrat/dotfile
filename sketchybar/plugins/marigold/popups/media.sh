#!/bin/bash

# The now playing popup, across one row: the track, its artist and app, then
# previous, play/pause and next, from what media.sh last saw playing.
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
IFS=$'\t' read -r TITLE ARTIST APP STATE <"${TMPDIR:-/tmp}/sketchybar_media" 2>/dev/null

PLAY="$sf_play"
[ "$STATE" = "playing" ] && PLAY="$sf_pause"
DETAIL="$ARTIST${APP:+${ARTIST:+ · }$APP}"

# control <id> <symbol> <nowplaying-cli command>: a button, highlighted under the mouse.
control() {
  ROWS+=(--add item "media.$1" popup.media
    --set "media.$1" icon="$2" icon.font="$POPUP_SYMBOL_FONT" icon.color="$frame_text" icon.padding_left=8 icon.padding_right=8
    label.drawing=off background.color="$frame_light" background.corner_radius=6 background.height=22 background.drawing=off
    script="$CONFIG_DIR/plugins/marigold/hover.sh" click_script="nowplaying-cli $3"
    --subscribe "media.$1" mouse.entered mouse.exited)
}

popup_begin media
ROWS+=(--add item media.track popup.media
  --set media.track icon="$TITLE" icon.font="$POPUP_BOLD" icon.color="$frame_text" icon.padding_left=8 icon.padding_right=8
  label="$DETAIL" label.font="$POPUP_FONT" label.color="$frame_gray_text" label.drawing="$([ -n "$DETAIL" ] && echo on || echo off)"
  label.padding_right=8 background.drawing=off)
control previous "$sf_previous" previous
control play "$PLAY" togglePlayPause
control next "$sf_next" next
popup_draw
