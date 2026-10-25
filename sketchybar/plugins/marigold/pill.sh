#!/bin/bash

# The pill every highlight on the bar and in its popups is (#186): inset from
# the bar's edge, its corners the bar's radius less the inset, so it sits
# concentric with the bar, a dark gap inside its border. Sourced after
# color.sh, for bar_radius; a square bar has square pills.
PILL_INSET=5
PILL_RADIUS=$((bar_radius > PILL_INSET ? bar_radius - PILL_INSET : 0))
