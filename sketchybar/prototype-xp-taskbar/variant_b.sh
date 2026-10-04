#!/bin/bash
# PROTOTYPE (issue #9), variant B: "XP taskbar, docked bottom".
# Edge to edge at the bottom, raised Start button, spaces as taskbar buttons
# (pressed = current), the front app as a pressed task button, and a sunken
# tray well on the right holding text-label status and the clock.
VARIANT=B
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"

sketchybar --bar position=bottom height=30 margin=0 y_offset=0 corner_radius=0 blur_radius=0 \
  color=$GREY border_color=$WHITE border_width=1 padding_left=2 padding_right=2

sketchybar --default padding_left=2 padding_right=2 icon.font="$FONT" label.font="$FONT" \
  icon.color=$BLACK label.color=$BLACK icon.padding_left=0 icon.padding_right=0 \
  label.padding_left=4 label.padding_right=4 background.height=22

sketchybar --add item start left --set start "${RAISED[@]}" \
  icon="" icon.background.drawing=on icon.background.image="$ICONS/start.png" icon.background.image.scale=0.5 \
  icon.width=16 icon.padding_left=4 label="Start" label.font="$BOLD" label.padding_right=6 padding_right=6

for sid in $(yabai -m query --spaces | jq '.[].index'); do
  sketchybar --add space space.$sid left --set space.$sid space=$sid "${RAISED[@]}" \
    icon="$sid" icon.width=22 icon.align=center label.drawing=off \
    script="$PP/space.sh bevel" click_script="yabai -m space --focus $sid"
done

sketchybar --add item front_app left --set front_app "${SUNKEN[@]}" background.color=0xffe0e0e0 \
  icon.drawing=off label.font="$BOLD" label.width=180 label.padding_left=8 padding_left=8 \
  script="$PP/front_app.sh" --subscribe front_app front_app_switched

add_switcher "XP taskbar, bottom"

sketchybar --add item clock right --set clock icon.drawing=off update_freq=10 script="$PP/clock.sh %-H:%M" \
    label.padding_right=8 \
  --add item volume right --set volume icon.drawing=off script="$PP/volume.sh text" --subscribe volume volume_change \
  --add item battery right --set battery icon.drawing=off update_freq=120 script="$PP/battery.sh text" \
  --subscribe battery system_woke power_source_change \
  --add item language right --set language icon.drawing=off update_freq=1 script="$PP/language.sh" \
  --add item wifi right --set wifi icon.drawing=off update_freq=5 script="$PP/wifi.sh text" label.padding_left=8 \
  --add item weather right --set weather icon.drawing=off update_freq=600 script="$PP/weather.sh text" \
  --add bracket tray weather wifi language battery volume clock --set tray "${SUNKEN[@]}"

sketchybar --update
