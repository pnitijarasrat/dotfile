#!/bin/sh

# Vintage theme Frame palette, shared with JankyBorders (borders/bordersrc). Variable names
# are the Theme spec's role names (#8); one hex can play several roles.
# Roles from docs/theme-spec.md, values from themes/vintage.json
export frame_face="0xffc0c0c0"
export frame_highlight="0xffffffff"   # outer top-left bevel
export frame_light="0xffe0e0e0"       # inner top-left bevel; pushed-in button face
export frame_shadow="0xff808080"      # inner bottom-right bevel
export frame_dark_shadow="0xff000000" # outer bottom-right bevel
export frame_text="0xff000000"
export frame_gray_text="0xff808080"
export frame_selection="0xff000080"
export frame_selection_text="0xffffffff"

# Frame data colors: data on grey, where Work surface brights are unreadable.
export frame_data_red="0xff800000"
export frame_data_green="0xff008000"
export frame_data_yellow="0xff808000"
export frame_data_blue="0xff000080"
export frame_data_magenta="0xff800080"
export frame_data_cyan="0xff008080"
export frame_data_orange="0xff804000"

# JankyBorders: style from the radius rule, width and colors from the Theme's borders.
export border_style="square"
export border_width="4.0"
export border_active_color="$frame_face"
export border_inactive_color="$frame_shadow"

# SketchyBar: the opacity and blur of a Theme's own bar (#169), from its source
# file's bar. The alpha is opacity as two hex digits, for 0xAARRGGBB colors.
# The bar wears the active window's ring (#183): JankyBorders' active color and
# width, and corners that curve like the ring's outline, the radius rule plus
# the width; square Themes stay square. Popups keep the window corners, the
# radius rule.
export bar_alpha="ff"
export bar_blur="0"
export bar_border_color="$frame_face"
export bar_border_width="4"
export bar_radius="0"
export popup_radius="0"
