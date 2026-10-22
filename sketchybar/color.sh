#!/bin/sh

# The active Theme's Frame palette (#136), shared with JankyBorders (borders/bordersrc),
# which has no CONFIG_DIR. Vintage unless a Switch wrote active-theme, which git
# ignores (ADR 0006), and its palette exists. themes/generate.mjs writes each
# Theme's palette.
active_theme=vintage
[ -f "$HOME/.config/sketchybar/active-theme" ] && . "$HOME/.config/sketchybar/active-theme"
[ -f "$HOME/.config/sketchybar/themes/$active_theme.sh" ] || active_theme=vintage
. "$HOME/.config/sketchybar/themes/$active_theme.sh"

export FONT="Microsoft Sans Serif:Regular:14.0"
# Microsoft Sans Serif ships no bold, so bold text (Start, task button) uses Tahoma.
export BOLD="Tahoma:Bold:13.0"
export ICONS="$CONFIG_DIR/icons"
