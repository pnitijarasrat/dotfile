#!/bin/sh

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Restart skhd
# @raycast.mode silent

# Optional parameters:
# @raycast.packageName Shortcuts
# @raycast.description Restart the skhd launchd service. Also the fix when Shortcuts stop working under Secure Input.

# Raycast doesn't get Homebrew's PATH, so use the absolute path.
/opt/homebrew/bin/skhd --restart-service && echo "skhd restarted"
