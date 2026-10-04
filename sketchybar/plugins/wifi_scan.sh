#!/bin/sh
source "$CONFIG_DIR/color.sh"
# Rebuilds the wifi popup's item list. Runs silently on a background timer
# (see the wifi_scanner item in sketchybarrc) so the list is already current
# by the time the user clicks - no "Scanning..." flash and no popup resize
# animation on open. If the popup is currently open, bail out instead of
# mutating items out from under the user, since that mid-open swap is what
# caused the visible slide/collapse animation.
STATE_FILE="/tmp/sketchybar_wifi_popup_state"
[ "$(cat "$STATE_FILE" 2>/dev/null)" = "on" ] && exit 0

POPUP="wifi"
ICON_WIFI_ITEM=""     # nf-fa-wifi
ICON_LOCK=""          # nf-fa-lock
ICON_CURRENT=""       # nf-fa-check
ICON_HOTSPOT="􀉤"       # same glyph as the bar's own hotspot icon

# Fixed row width instead of measuring rendered text: bounding_rects only
# reflects the actual on-screen frame, which doesn't exist while the popup
# is closed (which is always, since this script runs in the background) -
# querying it right after --add just raced sketchybar's layout pass and
# returned garbage (0 or 1px). A constant is also closer to how the native
# Wi-Fi menu behaves anyway (fixed-width dropdown, not content-hugging).
#
# Item padding_left/right shift the item's own box (a real margin, not
# subtracted from width), so ROW_PAD here is set to match add_header's
# padding_left=10 exactly - that's what lines up row content with header
# text. ROW_WIDTH is the *content* box width; total row footprint is
# ROW_PAD + ROW_WIDTH + ROW_PAD.
ROW_PAD=10
ROW_WIDTH=240

CURRENT_SSID=$(networksetup -getairportnetwork en0 2>/dev/null | sed 's/^Current Wi-Fi Network: //')
KNOWN_LIST=$(networksetup -listpreferredwirelessnetworks en0 2>/dev/null | tail -n +2 | sed 's/^[[:space:]]*//')

SCAN_JSON=$(system_profiler SPAirPortDataType -json 2>/dev/null)
NETWORKS=$(echo "$SCAN_JSON" | jq -r '
  .SPAirPortDataType[0].spairport_airport_interfaces[0].spairport_airport_other_local_wireless_networks[]? |
  [(._name // "Unknown"), (.spairport_security_mode // "")] | @tsv
' | sort -u -t $'\t' -k1,1)

# Bail if the popup was opened while we were scanning - don't mutate items
# out from under the user mid-open.
[ "$(cat "$STATE_FILE" 2>/dev/null)" = "on" ] && exit 0

# --- build the whole popup body in one sketchybar call: remove old dynamic
#     items and add the new ones together so the swap is atomic and nothing
#     is visible mid-rebuild ---
ARGS=()
for name in $(sketchybar --query bar | jq -r '.items[]' | grep '^wifi_' | grep -v '^wifi_scanner$'); do
  ARGS+=(--remove "$name")
done

add_row() {
  local id="$1" ssid="$2" icon="$3" bg="$4" click="$5" icon_drawing="on"
  [ -z "$icon" ] && icon_drawing="off"
  ARGS+=(--add item "wifi_$id" popup.$POPUP \
    --set "wifi_$id" \
      width=$ROW_WIDTH padding_left=$ROW_PAD padding_right=$ROW_PAD \
      icon="$icon" icon.drawing="$icon_drawing" icon.color="$FG" icon.font="Hack Nerd Font:Bold:13.0" \
      label="$ssid" label.color="$FG" label.font="JetBrains Mono:Bold:13.0" \
      background.color="$bg" background.corner_radius=6 background.height=26 \
      click_script="$click")
}

add_header() {
  ARGS+=(--add item "wifi_hdr_$1" popup.$POPUP \
    --set "wifi_hdr_$1" label="$2" label.color="$GREY0" label.font="JetBrains Mono:Bold:10.0" \
                         icon.drawing=off padding_left=10)
}

# --- Connected network ---
if [ -n "$CURRENT_SSID" ]; then
  add_header connected "CONNECTED"
  add_row "current" "$CURRENT_SSID" "$ICON_CURRENT" "$BG3" ""
fi

# --- Personal hotspots (iPhone/iPad/iPod broadcasting a Personal Hotspot) ---
FIRST_HOTSPOT=1
INDEX=0
while IFS=$'\t' read -r SSID SECURITY; do
  [ -z "$SSID" ] && continue
  [ "$SSID" = "$CURRENT_SSID" ] && continue
  case "$SSID" in
    *iPhone*|*iPad*|*iPod*) ;;
    *) continue ;;
  esac
  if [ "$FIRST_HOTSPOT" = 1 ]; then
    add_header hotspot "PERSONAL HOTSPOT"
    FIRST_HOTSPOT=0
  fi
  SECURED="false"
  echo "$SECURITY" | grep -qvi "none" && SECURED="true"
  add_row "hotspot_$INDEX" "$SSID" "$ICON_HOTSPOT" "$BG1" "$CONFIG_DIR/plugins/wifi_join.sh '$SSID' '$SECURED'"
  INDEX=$((INDEX + 1))
done <<< "$NETWORKS"

# --- Known networks (excludes current + personal hotspots already listed) ---
FIRST_KNOWN=1
INDEX=0
while IFS=$'\t' read -r SSID SECURITY; do
  [ -z "$SSID" ] && continue
  [ "$SSID" = "$CURRENT_SSID" ] && continue
  case "$SSID" in
    *iPhone*|*iPad*|*iPod*) continue ;;
  esac
  if echo "$KNOWN_LIST" | grep -Fxq "$SSID"; then
    if [ "$FIRST_KNOWN" = 1 ]; then
      add_header known "KNOWN NETWORKS"
      FIRST_KNOWN=0
    fi
    ICON="$ICON_WIFI_ITEM"
    echo "$SECURITY" | grep -qvi "none" && ICON="$ICON_WIFI_ITEM   $ICON_LOCK"
    add_row "known_$INDEX" "$SSID" "$ICON" "$BG1" "$CONFIG_DIR/plugins/wifi_join.sh '$SSID' 'true'"
    INDEX=$((INDEX + 1))
  fi
done <<< "$NETWORKS"

# --- Footer: hand off to the native Wi-Fi settings pane instead of listing
#     every unknown network in range ---
add_header settings ""
add_row "open_settings" "Open Wi-Fi Settings…" "" "$BG1" \
  "open 'x-apple.systempreferences:com.apple.Wi-Fi-Settings.extension'; sketchybar --set wifi popup.drawing=off; echo off >/tmp/sketchybar_wifi_popup_state"

sketchybar "${ARGS[@]}"
