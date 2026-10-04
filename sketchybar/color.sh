#!/bin/sh

# Vintage theme Frame palette (Win95/XP chrome).
export GREY="0xffc0c0c0"
export DARK="0xff808080"
export WHITE="0xffffffff"
export BLACK="0xff000000"
export NAVY="0xff000080"   # selection
export PRESSED="0xffefefef" # face of a pushed-in button

# Frame data colors: data on grey, where Work surface brights are unreadable.
export RED="0xff800000"
export GREEN="0xff008000"
export YELLOW="0xff808000"
export BLUE="0xff000080"
export MAGENTA="0xff800080"
export CYAN="0xff008080"
export ORANGE="0xff804000"

export FONT="Microsoft Sans Serif:Regular:14.0"
# Microsoft Sans Serif ships no bold, so bold text (Start, task button) uses Tahoma.
export BOLD="Tahoma:Bold:13.0"
export ICONS="$CONFIG_DIR/icons"
