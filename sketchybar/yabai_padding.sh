#!/bin/bash

# Each layout reserves its bar's room in yabai (#166), so yabairc sets no top
# or bottom padding. `reserve_in_yabai <top> <bottom>` pads tiled windows that many
# points beyond yabai's window_gap at the top and bottom of the screen. It does
# nothing if yabai isn't running, so the bar still loads.
reserve_in_yabai() {
  local gap
  gap=$(yabai -m config window_gap 2>/dev/null) || return 0
  yabai -m config top_padding $(($1 + gap))
  yabai -m config bottom_padding $(($2 + gap))
}
