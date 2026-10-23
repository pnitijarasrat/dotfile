#!/bin/bash

# Rebuilds the Wi-Fi popup, Vintage's Wi-Fi menu in Marigold's Frame: on/off,
# the known networks (the current one checked), then other networks in
# range; clicking one joins it through wifi_join.sh. Runs on the hidden
# wifi_scanner's timer, as on Vintage's taskbar, so opening never waits for a
# scan, and leaves the popup alone while it's open.
popup_open() { [ "$(sketchybar --query wifi 2>/dev/null | jq -r '.popup.drawing' 2>/dev/null)" = "on" ]; }
popup_open && exit 0
source "$CONFIG_DIR/plugins/marigold/popup_rows.sh"
source "$CONFIG_DIR/plugins/wifi_networks.sh"
POWER="off"
networksetup -getairportpower en0 2>/dev/null | grep -q ': On$' && POWER="on"
TOGGLE="on"
[ "$POWER" = "on" ] && TOGGLE="off"
# Don't swap the rows under a popup opened during the scan.
popup_open && exit 0

# network_row <id> <ssid> <security> <check>: a network, checked or with a
# lock when it's secured; clicking it joins it.
network_row() {
  local secured="false" value="" color="$frame_gray_text"
  grep -qvi "none" <<<"$3" && secured="true" value="$sf_lock"
  [ "$4" = "on" ] && value="$sf_check" color="$frame_selection"
  popup_row "$1" "$2" "$value" \
    "$CONFIG_DIR/plugins/wifi_join.sh $(printf '%q' "$2") $secured" \
    label.font="$POPUP_SYMBOL_FONT" label.color="$color"
}

popup_begin wifi
popup_row power "Wi-Fi" "$POWER" "networksetup -setairportpower en0 $TOGGLE; sketchybar --set wifi popup.drawing=off"
popup_header known "Known networks"
if [ -n "$CURRENT_SSID" ]; then
  network_row current "$CURRENT_SSID" "$(grep -F "$CURRENT_SSID"$'\t' <<<"$NETWORKS" | cut -f2)" on
fi
OTHERS=()
INDEX=0
while IFS=$'\t' read -r SSID SECURITY; do
  [ -z "$SSID" ] || [ "$SSID" = "$CURRENT_SSID" ] && continue
  if grep -Fxq "$SSID" <<<"$KNOWN_LIST"; then
    network_row "known_$INDEX" "$SSID" "$SECURITY" off
    INDEX=$((INDEX + 1))
  else
    OTHERS+=("$SSID"$'\t'"$SECURITY")
  fi
done <<<"$NETWORKS"
if [ ${#OTHERS[@]} -gt 0 ]; then
  popup_header other "Other networks"
  INDEX=0
  for NETWORK in "${OTHERS[@]}"; do
    network_row "other_$INDEX" "${NETWORK%%$'\t'*}" "${NETWORK#*$'\t'}" off
    INDEX=$((INDEX + 1))
  done
fi
popup_row settings "Wi-Fi Settings…" "" \
  "open 'x-apple.systempreferences:com.apple.Wi-Fi-Settings.extension'; sketchybar --set wifi popup.drawing=off"
popup_draw
