#!/bin/sh
# The launch/focus/cycle script behind ⌘1–0 and Hyper+D (#126, owners in #114).
#
#   go.sh [-s N] [App]
#
# -s N goes to space N (1–10) by sending the hidden Desktop N chord that
# macos/hotkeys.sh sets (⌃⌥⇧ + 1–0), so it works with SIP on. Then App, if
# given: if one of its windows on space N has focus, the next one there gets
# it; otherwise its first window there does; with none there, it's launched
# or brought forward with `open -a`. Without -s (Finder), cycling covers
# every space, and an app that isn't frontmost is left to `open -a`.
set -eu

space=
if [ "${1:-}" = -s ]; then
  space=$2
  shift 2
fi
app=${1:-}

# Read before switching space: the switch itself changes what has focus.
focused=$(yabai -m query --windows --window 2>/dev/null || echo '{}')

if [ -n "$space" ]; then
  skhd -k "ctrl + alt + shift - $((space % 10))"
  # The switch animates; wait up to 1 s for it to land before focusing.
  tries=0
  until [ "$(yabai -m query --spaces --space | jq .index)" = "$space" ] || [ "$tries" -ge 20 ]; do
    tries=$((tries + 1))
    sleep 0.05
  done
fi
[ -z "$app" ] && exit 0

# The app's windows on space N (or anywhere), by id, then the one to focus.
target=$(yabai -m query --windows | jq -r \
  --arg app "$app" --argjson space "${space:-null}" --argjson focused "$focused" '
  [.[] | select(.app == $app and (."is-minimized" | not) and ($space == null or .space == $space))]
  | sort_by(.id) | map(.id) as $w
  | ($w | index($focused.id // -1)) as $i
  | if ($w | length) == 0 or ($i == null and $space == null) then "open"
    elif $i == null then $w[0]
    elif ($w | length) == 1 then empty
    else $w[($i + 1) % ($w | length)] end')

case "$target" in
  "") ;;
  open) open -a "$app" ;;
  *) yabai -m window --focus "$target" ;;
esac
