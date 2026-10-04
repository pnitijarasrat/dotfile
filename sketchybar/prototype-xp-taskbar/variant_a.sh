#!/bin/bash
# PROTOTYPE (issue #9), variant A: "Frame colors only".
# Today's bar, unchanged in shape (floating top, same item order), with Frame
# colors, Purist corners/blur, and every Nerd Font icon replaced by a text label.
VARIANT=A
source "$CONFIG_DIR/prototype-xp-taskbar/common.sh"

sketchybar --bar position=top height=30 margin=6 y_offset=6 corner_radius=0 blur_radius=0 \
  color=$GREY border_color=$DARK border_width=1 padding_left=14 padding_right=14

sketchybar --default padding_left=4 padding_right=4 icon.font="$FONT" label.font="$FONT" \
  icon.color=$BLACK label.color=$BLACK icon.padding_left=4 icon.padding_right=4 \
  label.padding_left=4 label.padding_right=4 background.corner_radius=0

SEP=(icon="|" icon.color=$DARK label.drawing=off padding_left=6 padding_right=6)

sketchybar --add item start left --set start icon.drawing=off label="Mac" label.font="$BOLD" \
  --add item sepy left --set sepy "${SEP[@]}"

for sid in $(yabai -m query --spaces | jq '.[].index'); do
  sketchybar --add space space.$sid left --set space.$sid space=$sid icon="$sid" label.drawing=off \
    icon.padding_left=6 icon.padding_right=6 background.color=$NAVY background.height=20 \
    script="$PP/space.sh navy" click_script="yabai -m space --focus $sid"
done

sketchybar --add item sepx left --set sepx "${SEP[@]}" \
  --add item weather left --set weather icon.drawing=off update_freq=600 script="$PP/weather.sh text" \
  --add item front_app center --set front_app icon.drawing=off label.font="$BOLD" script="$PP/front_app.sh" \
  --subscribe front_app front_app_switched

add_switcher "Frame colors only"

sketchybar --add item clock right --set clock icon.drawing=off update_freq=10 script="$PP/clock.sh '%a %b %-d %-H:%M'" \
  --add item sep1 right --set sep1 "${SEP[@]}" \
  --add item volume right --set volume icon.drawing=off script="$PP/volume.sh text" --subscribe volume volume_change \
  --add item sep2 right --set sep2 "${SEP[@]}" \
  --add item battery right --set battery icon.drawing=off update_freq=120 script="$PP/battery.sh text" \
  --subscribe battery system_woke power_source_change \
  --add item sep3 right --set sep3 "${SEP[@]}" \
  --add item language right --set language icon.drawing=off update_freq=1 script="$PP/language.sh" \
  --add item sep4 right --set sep4 "${SEP[@]}" \
  --add item wifi right --set wifi icon.drawing=off update_freq=5 script="$PP/wifi.sh text"

sketchybar --update
