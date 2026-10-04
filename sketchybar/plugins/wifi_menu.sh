#!/bin/sh
# Toggles the wifi popup. Purely an instant show/hide - the popup's item
# list is kept current in the background by the wifi_scanner timer (see
# wifi_scan.sh / sketchybarrc), so opening never triggers a scan or a
# resize/rebuild of the popup's contents.
#
# sketchybar's `--query` does not expose popup drawing state (at least as of
# v2.24.0), so we can't ask sketchybar whether the popup is currently open.
# Instead we track our own last-known state in a file, and use the
# officially supported `popup.drawing=toggle` value to flip the actual popup
# (this stays correct even if the popup was dismissed by an outside click).
STATE_FILE="/tmp/sketchybar_wifi_popup_state"
STATE=$(cat "$STATE_FILE" 2>/dev/null)

sketchybar --set wifi popup.drawing=toggle

if [ "$STATE" = "on" ]; then
  echo off >"$STATE_FILE"
else
  echo on >"$STATE_FILE"
fi
