#!/bin/sh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Restart yabai
# @raycast.mode silent

# Optional parameters:
# @raycast.packageName Shortcuts
# @raycast.description Restart the yabai launchd service.

# Raycast doesn't get Homebrew's PATH, so use the absolute path.
/opt/homebrew/bin/yabai --restart-service && echo "yabai restarted"
