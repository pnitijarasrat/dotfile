#!/bin/sh

# Marigold theme Frame palette, shared with JankyBorders (borders/bordersrc). Variable names
# are the Theme spec's role names (#8); one hex can play several roles.
# Roles from docs/theme-spec.md, values from themes/marigold.json
export frame_face="0xff1e1e1e"
export frame_highlight="0xff383838"   # outer top-left bevel
export frame_light="0xff2a2a2a"       # inner top-left bevel; pushed-in button face
export frame_shadow="0xff111111"      # inner bottom-right bevel
export frame_dark_shadow="0xff000000" # outer bottom-right bevel
export frame_text="0xfff5e3da"
export frame_gray_text="0xff8c817b"
export frame_selection="0xfff2c45a"
export frame_selection_text="0xff161616"

# Frame data colors: data on grey, where Work surface brights are unreadable.
export frame_data_red="0xffe06c7a"
export frame_data_green="0xffa8c08a"
export frame_data_yellow="0xfff2c45a"
export frame_data_blue="0xff8fa4e0"
export frame_data_magenta="0xffc9a6d6"
export frame_data_cyan="0xff7fbfb4"
export frame_data_orange="0xfff0b878"

# JankyBorders: style from the radius rule, width and colors from the Theme's borders.
export border_style="round"
export border_width="2.0"
export border_active_color="$frame_selection"
export border_inactive_color="$frame_shadow"

# SketchyBar: the opacity and blur of a Theme's own bar (#169), from its source
# file's bar. The alpha is opacity as two hex digits, for 0xAARRGGBB colors.
# The bar wears the active window's ring (#183): JankyBorders' active color, and
# corners that curve like the ring's outline, the radius rule plus the width;
# square Themes stay square.
export bar_alpha="d9"
export bar_blur="20"
export bar_border_color="$frame_selection"
export bar_radius="12"
