#!/bin/sh
# The launch/focus/cycle script behind Hyper+D (#126, owners in #114).
#
#   go.sh App
#
# Launches App if it's closed and brings it forward if it's open. If it's
# already frontmost, its next window gets focus instead.
set -eu

app=$1
focused=$(yabai -m query --windows --window 2>/dev/null || echo '{}')

# The app's windows by id, then the one to focus.
target=$(yabai -m query --windows | jq -r --arg app "$app" --argjson focused "$focused" '
  [.[] | select(.app == $app and (."is-minimized" | not))]
  | sort_by(.id) | map(.id) as $w
  | ($w | index($focused.id // -1)) as $i
  | if $i == null then "open"
    elif ($w | length) == 1 then empty
    else $w[($i + 1) % ($w | length)] end')

case "$target" in
  "") ;;
  open) open -a "$app" ;;
  *) yabai -m window --focus "$target" ;;
esac
