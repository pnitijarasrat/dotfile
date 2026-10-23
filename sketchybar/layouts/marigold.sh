#!/bin/bash

# The Marigold theme's layout (#156, docs/theme-spec-marigold.md), in the shape
# chosen in #165 (#170). sketchybarrc sources it after color.sh and sets
# PLUGIN_DIR. Every item runs one of Marigold's own plugins.
source "$CONFIG_DIR/yabai_padding.sh"
source "$CONFIG_DIR/sf_symbols.sh"
MARIGOLD_PLUGINS="$PLUGIN_DIR/marigold"
FONT="JetBrainsMonoNL Nerd Font:Regular:13.0"
BOLD="JetBrainsMonoNL Nerd Font:Bold:13.0"
ICON_FONT="SF Pro:Regular:13.0"
APP_FONT="sketchybar-app-font:Regular:13.0"
# The front app's icon is a size up, as in the #165 mockup.
FRONT_APP_FONT="sketchybar-app-font:Regular:15.0"

# A floating bar at the top, inset from the screen edges: frame_face at the
# bar's own opacity and blur (#169), with corners from the Theme rules and a
# hairline border. Its top and side insets are yabai's window_gap, so the bar
# lines up with the tiled windows.
BAR_HEIGHT=28
BAR_Y_OFFSET=8
BAR_MARGIN=8
sketchybar --bar position=top height="$BAR_HEIGHT" margin="$BAR_MARGIN" y_offset="$BAR_Y_OFFSET" \
                 corner_radius="$bar_radius" blur_radius="$bar_blur" \
                 color="0x$bar_alpha${frame_face#0xff}" border_color="$frame_highlight" border_width=1 \
                 padding_left=6 padding_right=6 topmost=window

# No gap between items: each pads its own icon and label, so its frame_light
# highlight under the mouse (plugins/marigold/hover.sh) covers both.
default=(
  padding_left=0
  padding_right=0
  icon.font="$ICON_FONT"
  label.font="$FONT"
  label.color="$frame_text"
  icon.padding_left=6
  icon.padding_right=5
  label.padding_left=0
  label.padding_right=6
  background.color="$frame_light"
  background.corner_radius=6
  background.height=$((BAR_HEIGHT - 8))
  background.drawing=off
)
sketchybar --default "${default[@]}"
HOVER=(mouse.entered mouse.exited)

##### left: spaces, front app #####
# Each space is its number, then its windows' apps (plugins/marigold/space.sh).
for sid in 1 2 3 4 5 6 7 8 9 10
do
  space=(
    space="$sid"
    icon="$((sid % 10))"
    icon.font="$BOLD"
    icon.color="$frame_gray_text"
    icon.padding_right=6
    label.font="$APP_FONT"
    label.drawing=off
    background.color="$frame_selection"
    script="$MARIGOLD_PLUGINS/space.sh"
    click_script="yabai -m space --focus $sid"
  )
  sketchybar --add space space."$sid" left --set space."$sid" "${space[@]}" \
             --subscribe space."$sid" space_windows_change "${HOVER[@]}"
done

# Set off from the spaces by the window gap, outside its highlight.
sketchybar --add item front_app left \
           --set front_app padding_left="$BAR_MARGIN" icon.font="$FRONT_APP_FONT" icon.color="$frame_text" \
                           label.font="$BOLD" \
                           script="$MARIGOLD_PLUGINS/front_app.sh" \
           --subscribe front_app front_app_switched "${HOVER[@]}"

##### right: clock, battery, Wi-Fi, volume, right to left #####
# Each with its icon in its own Frame data color.
sketchybar --add item clock right \
           --set clock icon="$sf_clock" icon.color="$frame_data_yellow" update_freq=10 script="$MARIGOLD_PLUGINS/clock.sh" \
           --subscribe clock "${HOVER[@]}" \
           --add item battery right \
           --set battery icon="$sf_battery_100" icon.color="$frame_data_green" update_freq=120 script="$MARIGOLD_PLUGINS/battery.sh" \
           --subscribe battery system_woke power_source_change "${HOVER[@]}" \
           --add item wifi right \
           --set wifi icon="$sf_wifi" icon.color="$frame_data_blue" update_freq=5 script="$MARIGOLD_PLUGINS/wifi.sh" \
           --subscribe wifi "${HOVER[@]}" \
           --add item volume right \
           --set volume icon="$sf_volume" icon.color="$frame_data_magenta" script="$MARIGOLD_PLUGINS/volume.sh" \
           --subscribe volume volume_change "${HOVER[@]}"

# Tiled windows start a window gap below the bar, and need no room at the bottom.
reserve_in_yabai $((BAR_Y_OFFSET + BAR_HEIGHT)) 0
