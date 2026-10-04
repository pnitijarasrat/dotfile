#!/bin/bash

# Win95 bevels. SketchyBar draws one border color per item, so the second
# edge is faked with a hard shadow toward the bottom-right.
RAISED=(background.drawing=on background.color="$GREY" background.corner_radius=0
        background.border_width=1 background.border_color="$WHITE"
        background.shadow.drawing=on background.shadow.color="$BLACK"
        background.shadow.angle=45 background.shadow.distance=2)
SUNKEN=(background.drawing=on background.color="$GREY" background.corner_radius=0
        background.border_width=1 background.border_color="$DARK"
        background.shadow.drawing=on background.shadow.color="$WHITE"
        background.shadow.angle=45 background.shadow.distance=2)
