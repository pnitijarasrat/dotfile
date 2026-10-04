#!/bin/bash
# PROTOTYPE (issue #9): shared by the three variants. Frame palette from #7,
# font from #6. Delete this whole directory once the verdict is folded in.

PROTO_DIR="$CONFIG_DIR/prototype-xp-taskbar"
ICONS="$PROTO_DIR/icons"
PP="$PROTO_DIR/plugins"

# Frame
GREY=0xffc0c0c0
DARK=0xff808080
WHITE=0xffffffff
BLACK=0xff000000
NAVY=0xff000080
# Frame data colors
D_RED=0xff800000
D_GREEN=0xff008000
D_YELLOW=0xff808000
D_BLUE=0xff000080

FONT="Microsoft Sans Serif:Regular:14.0"
BOLD="Tahoma:Bold:13.0"

# Win95 bevels, faked with a 1px border plus a 2px shadow toward the bottom-right.
RAISED=(background.drawing=on background.color=$GREY background.corner_radius=0
        background.border_width=1 background.border_color=$WHITE
        background.shadow.drawing=on background.shadow.color=$BLACK
        background.shadow.angle=45 background.shadow.distance=2)
SUNKEN=(background.drawing=on background.color=$GREY background.corner_radius=0
        background.border_width=1 background.border_color=$DARK
        background.shadow.drawing=on background.shadow.color=$WHITE
        background.shadow.angle=45 background.shadow.distance=2)

# Not part of the design: the variant switcher, deliberately loud.
add_switcher() {
  local name="$1"
  local SW=(background.drawing=on background.color=0xffff00ff background.corner_radius=0
            background.height=20 icon.drawing=off label.color=$BLACK label.font="Menlo:Bold:12.0"
            padding_left=0 padding_right=0)
  sketchybar --add item proto_prev center --set proto_prev "${SW[@]}" label="<" \
               click_script="$PROTO_DIR/switch.sh prev" \
             --add item proto_label center --set proto_label "${SW[@]}" label="$VARIANT: $name" \
               click_script="$PROTO_DIR/switch.sh off" \
             --add item proto_next center --set proto_next "${SW[@]}" label=">" \
               click_script="$PROTO_DIR/switch.sh next"
}
