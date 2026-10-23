#!/bin/bash

# A layout whose bar follows yabai's spaces asks yabai to tell it (#172), so
# yabairc adds no signals. `trigger_on_yabai_spaces <event>` triggers the
# SketchyBar event whenever yabai's spaces or displays change, and
# `stop_yabai_space_signals` stops it. Both do nothing if yabai isn't running,
# so the bar still loads.
YABAI_SPACE_EVENTS=(space_created space_destroyed display_added display_removed display_moved mission_control_exit)

trigger_on_yabai_spaces() {
  local event
  for event in "${YABAI_SPACE_EVENTS[@]}"; do
    yabai -m signal --add event="$event" label="sketchybar_$event" action="sketchybar --trigger $1" 2>/dev/null
  done
  return 0
}

stop_yabai_space_signals() {
  local event
  for event in "${YABAI_SPACE_EVENTS[@]}"; do
    yabai -m signal --remove "sketchybar_$event" 2>/dev/null
  done
  return 0
}
