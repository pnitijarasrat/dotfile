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

# Clicking a status item opens its popup under it (plugins/marigold/popup.sh),
# Frame as the spec's "Where popups go"; moving the mouse off the bar and
# the popup closes it, as SketchyBar can't see clicks outside its windows. Rows are a fixed height, so a row's highlight doesn't resize it.
POPUP=(
  click_script="$MARIGOLD_PLUGINS/popup.sh"
  popup.align=right
  popup.y_offset=2
  popup.height=24
  popup.blur_radius=0
  popup.background.color="$frame_face"
  popup.background.border_color="$frame_highlight"
  popup.background.border_width=1
  popup.background.corner_radius="$bar_radius"
)
STATUS=("${HOVER[@]}" mouse.exited.global)

##### center: now playing #####
# A popup across the track's row: what's playing, then its controls.
sketchybar --add item media center \
           --set media icon="$sf_music" icon.color="$frame_data_magenta" label.max_chars=40 script="$MARIGOLD_PLUGINS/media.sh" \
                       "${POPUP[@]}" popup.align=center popup.horizontal=on \
           --subscribe media media_change "${STATUS[@]}"

##### right: clock, battery, Wi-Fi, volume, language, weather, memory, CPU, right to left #####
# Each with its icon in its own Frame data color. language follows the input
# source as macOS announces it changing.
sketchybar --add event input_change AppleSelectedInputSourcesChangedNotification \
           --add item clock right \
           --set clock icon="$sf_clock" icon.color="$frame_data_yellow" update_freq=10 script="$MARIGOLD_PLUGINS/clock.sh" "${POPUP[@]}" \
           --subscribe clock "${STATUS[@]}" \
           --add item battery right \
           --set battery icon="$sf_battery_100" icon.color="$frame_data_green" update_freq=120 script="$MARIGOLD_PLUGINS/battery.sh" "${POPUP[@]}" \
           --subscribe battery system_woke power_source_change "${STATUS[@]}" \
           --add item wifi right \
           --set wifi icon="$sf_wifi" icon.color="$frame_data_blue" update_freq=5 script="$MARIGOLD_PLUGINS/wifi.sh" "${POPUP[@]}" \
           --subscribe wifi "${STATUS[@]}" \
           --add item wifi_scanner right \
           --set wifi_scanner drawing=off update_freq=20 script="$MARIGOLD_PLUGINS/wifi_scan.sh" \
           --add item volume right \
           --set volume icon="$sf_volume" icon.color="$frame_data_magenta" script="$MARIGOLD_PLUGINS/volume.sh" "${POPUP[@]}" \
           --subscribe volume volume_change "${STATUS[@]}" \
           --add item language right \
           --set language icon="$sf_keyboard" icon.color="$frame_data_cyan" script="$MARIGOLD_PLUGINS/language.sh" "${POPUP[@]}" \
           --subscribe language input_change "${STATUS[@]}" \
           --add item weather right \
           --set weather icon="$sf_partly_cloudy" icon.color="$frame_data_yellow" update_freq=600 script="$MARIGOLD_PLUGINS/weather.sh" "${POPUP[@]}" \
           --subscribe weather system_woke "${STATUS[@]}" \
           --add item memory right \
           --set memory icon="$sf_memory" icon.color="$frame_data_orange" update_freq=5 script="$MARIGOLD_PLUGINS/memory.sh" "${POPUP[@]}" \
           --subscribe memory "${STATUS[@]}" \
           --add item cpu right \
           --set cpu icon="$sf_cpu" icon.color="$frame_data_cyan" update_freq=5 script="$MARIGOLD_PLUGINS/cpu.sh" "${POPUP[@]}" \
           --subscribe cpu "${STATUS[@]}"

# Tiled windows start a window gap below the bar, and need no room at the bottom.
reserve_in_yabai $((BAR_Y_OFFSET + BAR_HEIGHT)) 0
