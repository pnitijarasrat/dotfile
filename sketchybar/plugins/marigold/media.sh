#!/bin/bash

# The track and artist of what's playing, hidden when nothing is. media_change
# passes them, and the app, in $INFO; on load, ask nowplaying-cli instead. Keeps
# them in MEDIA_CACHE for the popup, and its play/pause, if drawn, current.
source "$CONFIG_DIR/plugins/marigold/hover.sh"
source "$CONFIG_DIR/sf_symbols.sh"

if [ "$SENDER" = "media_change" ]; then
  STATE="$(jq -r '.state' <<<"$INFO")"
  TITLE="$(jq -r '.title // empty' <<<"$INFO")"
  ARTIST="$(jq -r '.artist // empty' <<<"$INFO")"
  APP="$(jq -r '.app // empty' <<<"$INFO")"
else
  { read -r TITLE; read -r ARTIST; read -r RATE; } < <(nowplaying-cli get title artist playbackRate 2>/dev/null)
  [ "$TITLE" = "null" ] && TITLE=""
  [ "$ARTIST" = "null" ] && ARTIST=""
  case "$RATE" in
  0 | null | "") STATE="paused" ;;
  *) STATE="playing" ;;
  esac
fi

if [ "$TITLE" = "" ] || [ "$STATE" = "stopped" ]; then
  sketchybar --set "$NAME" drawing=off popup.drawing=off
  exit 0
fi

MEDIA_CACHE="${TMPDIR:-/tmp}/sketchybar_media"
printf '%s\t%s\t%s\t%s\n' "$TITLE" "$ARTIST" "$APP" "$STATE" >"$MEDIA_CACHE"

ICON="$sf_music" PLAY="$sf_pause"
[ "$STATE" = "playing" ] || ICON="$sf_pause" PLAY="$sf_play"
sketchybar --set "$NAME" drawing=on icon="$ICON" label="$TITLE${ARTIST:+ · $ARTIST}"
sketchybar --query media.play >/dev/null 2>&1 && sketchybar --set media.play icon="$PLAY"
