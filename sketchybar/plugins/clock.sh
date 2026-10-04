#!/bin/sh

# The $NAME variable is passed from sketchybar and holds the name of
# the item invoking this script:
# https://felixkratz.github.io/SketchyBar/config/events#events-and-scripting

source "$CONFIG_DIR/color.sh"

HOUR=$(date '+%-H')

if [ "$HOUR" -ge 0 ] && [ "$HOUR" -lt 5 ]; then
  # Midnight (00:00 - 04:59)
  ICON="󰽥"
  COLOR="$FG" # github fg
elif [ "$HOUR" -ge 5 ] && [ "$HOUR" -lt 12 ]; then
  # Morning (05:00 - 11:59)
  ICON="󰖜"
  COLOR="$YELLOW" # github yellow
elif [ "$HOUR" -ge 12 ] && [ "$HOUR" -lt 17 ]; then
  # Afternoon (12:00 - 16:59)
  ICON="󰖙"
  COLOR="$ORANGE" # github orange
elif [ "$HOUR" -ge 17 ] && [ "$HOUR" -lt 21 ]; then
  # Evening (17:00 - 20:59)
  ICON="󰖛"
  COLOR="$RED" # github red
else
  # Night (21:00 - 23:59)
  ICON="󰽤"
  COLOR="$BLUE" # github blue
fi

sketchybar --set "$NAME" icon="$ICON" icon.color="$COLOR" icon.font="Hack Nerd Font:Bold:20.0" \
  label="$(date '+%a %b %-d %-H:%M')"
