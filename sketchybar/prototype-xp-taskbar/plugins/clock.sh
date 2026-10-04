#!/bin/bash
# PROTOTYPE (issue #9). $1 = date(1) format
sketchybar --set "$NAME" label="$(date "+$1")"
