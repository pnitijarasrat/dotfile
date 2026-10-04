#!/bin/bash
# PROTOTYPE (issue #9), variant C: "Win95 taskbar dragged to the top, pixel icons".
# Docked edge to edge at the top. Start button, flat numbered spaces with a navy
# selection, the front app as a navy active-title-bar strip in the middle, and
# a sunken tray of 16px pixel icons (no text except temperature and clock).
VARIANT=C
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"

sketchybar --bar position=top height=30 margin=0 y_offset=0 corner_radius=0 blur_radius=0 \
  color=$GREY border_color=$DARK border_width=1 padding_left=2 padding_right=2

sketchybar --default padding_left=2 padding_right=2 icon.font="$FONT" label.font="$FONT" \
  icon.color=$BLACK label.color=$BLACK icon.padding_left=0 icon.padding_right=0 \
  label.padding_left=4 label.padding_right=4 background.height=22 \
  icon.background.image.scale=0.5

PIX=(icon="" icon.width=16 icon.background.drawing=on)

sketchybar --add item start left --set start "${RAISED[@]}" "${PIX[@]}" \
  icon.background.image="$ICONS/start.png" icon.padding_left=4 \
  label="Start" label.font="$BOLD" label.padding_right=6 padding_right=8

for sid in $(yabai -m query --spaces | jq '.[].index'); do
  sketchybar --add space space.$sid left --set space.$sid space=$sid icon="$sid" icon.width=20 icon.align=center \
    label.drawing=off background.color=$NAVY background.height=20 background.corner_radius=0 \
    script="$PP/space.sh navy" click_script="yabai -m space --focus $sid"
done

sketchybar --add item front_app center --set front_app background.drawing=on background.color=$NAVY \
  background.corner_radius=0 background.height=20 icon.drawing=off label.color=$WHITE label.font="$BOLD" \
  label.width=260 label.padding_left=6 script="$PP/front_app.sh" --subscribe front_app front_app_switched

add_switcher "Win95 top, pixel icons"

sketchybar --add item clock right --set clock icon.drawing=off update_freq=10 script="$PP/clock.sh %-H:%M" \
    label.padding_left=6 label.padding_right=8 \
  --add item volume right --set volume "${PIX[@]}" label.drawing=off script="$PP/volume.sh pixel" \
  --subscribe volume volume_change \
  --add item battery right --set battery "${PIX[@]}" update_freq=120 script="$PP/battery.sh pixel" \
  --subscribe battery system_woke power_source_change \
  --add item language right --set language icon.drawing=off update_freq=1 script="$PP/language.sh" \
  --add item wifi right --set wifi "${PIX[@]}" label.drawing=off update_freq=5 script="$PP/wifi.sh pixel" \
  --add item weather right --set weather "${PIX[@]}" update_freq=600 script="$PP/weather.sh pixel" \
    icon.padding_left=6 \
  --add bracket tray weather wifi language battery volume clock --set tray "${SUNKEN[@]}"

sketchybar --update
