#!/bin/bash

# The Marigold theme's layout (#156, docs/theme-spec-marigold.md). sketchybarrc
# sources it after color.sh and sets PLUGIN_DIR. Clock and front app share
# Vintage's plugins; spaces, battery, Wi-Fi and volume have Marigold's own.
source "$CONFIG_DIR/yabai_padding.sh"
MARIGOLD_PLUGINS="$PLUGIN_DIR/marigold"
FONT="SF Pro:Regular:13.0"
BOLD="SF Pro Text:Semibold:13.0"
ICON_FONT="JetBrainsMonoNL Nerd Font:Regular:14.0"

# A floating bar at the top, inset from the screen edges: frame_face at the
# Theme's opacity, with blur, corners and a hairline border from its rules.
BAR_HEIGHT=32
BAR_Y_OFFSET=4
# The same as yabai's window_gap, so the bar lines up with the tiled windows.
BAR_MARGIN=8
sketchybar --bar position=top height="$BAR_HEIGHT" margin="$BAR_MARGIN" y_offset="$BAR_Y_OFFSET" \
                 corner_radius="$bar_radius" blur_radius="$bar_blur" \
                 color="0x$bar_alpha${frame_face#0xff}" border_color="$frame_highlight" border_width=1 \
                 padding_left=6 padding_right=6 topmost=window

default=(
  padding_left=2
  padding_right=2
  icon.font="$ICON_FONT"
  label.font="$FONT"
  icon.color="$frame_selection"
  label.color="$frame_text"
  icon.padding_left=4
  icon.padding_right=4
  label.padding_left=0
  label.padding_right=4
)
sketchybar --default "${default[@]}"

##### left: spaces, front app #####
for sid in 1 2 3 4 5 6 7 8 9 10
do
  space=(
    space="$sid"
    icon="$((sid % 10))"
    icon.font="$BOLD"
    icon.color="$frame_gray_text"
    icon.width=24
    icon.align=center
    label.drawing=off
    background.color="$frame_selection"
    background.corner_radius=6
    background.height=22
    background.drawing=off
    script="$MARIGOLD_PLUGINS/space.sh"
    click_script="yabai -m space --focus $sid"
  )
  sketchybar --add space space."$sid" left --set space."$sid" "${space[@]}"
done

sketchybar --add item front_app left \
           --set front_app icon.drawing=off label.font="$BOLD" padding_left=10 \
                           script="$PLUGIN_DIR/front_app.sh" \
           --subscribe front_app front_app_switched

##### right: clock, battery, Wi-Fi, volume, right to left #####
sketchybar --add item clock right \
           --set clock icon=$'' update_freq=10 script="$PLUGIN_DIR/clock.sh" \
           --add item battery right \
           --set battery icon=$'' update_freq=120 script="$MARIGOLD_PLUGINS/battery.sh" \
           --subscribe battery system_woke power_source_change \
           --add item wifi right \
           --set wifi icon=$'' label.drawing=off update_freq=5 script="$MARIGOLD_PLUGINS/wifi.sh" \
           --add item volume right \
           --set volume icon=$'' label.drawing=off script="$MARIGOLD_PLUGINS/volume.sh" \
           --subscribe volume volume_change

# Tiled windows start a window gap below the bar, and need no room at the bottom.
reserve_in_yabai $((BAR_Y_OFFSET + BAR_HEIGHT)) 0
