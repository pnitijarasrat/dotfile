#!/bin/bash

# Win95 bevels. SketchyBar draws one border color per item, so the second
# edge is faked with a hard shadow toward the bottom-right.
RAISED=(background.drawing=on background.color="$frame_face" background.corner_radius=0
        background.border_width=1 background.border_color="$frame_highlight"
        background.shadow.drawing=on background.shadow.color="$frame_dark_shadow"
        background.shadow.angle=45 background.shadow.distance=2)
SUNKEN=(background.drawing=on background.color="$frame_face" background.corner_radius=0
        background.border_width=1 background.border_color="$frame_shadow"
        background.shadow.drawing=on background.shadow.color="$frame_highlight"
        background.shadow.angle=45 background.shadow.distance=2)
