#!/bin/sh

# Vintage theme Frame palette (JankyBorders is to share it, per #8). Variable names
# are the Theme spec's role names (#8); one hex can play several roles.
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

export FONT="Microsoft Sans Serif:Regular:14.0"
# Microsoft Sans Serif ships no bold, so bold text (Start, task button) uses Tahoma.
export BOLD="Tahoma:Bold:13.0"
export ICONS="$CONFIG_DIR/icons"
