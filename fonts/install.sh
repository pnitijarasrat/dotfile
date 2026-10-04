#!/bin/sh

# Copies the repo's fonts into the user font folder (#12).
set -e

src="$(cd "$(dirname "$0")" && pwd)"
dest="$HOME/Library/Fonts"

mkdir -p "$dest"
cp "$src"/*.ttf "$dest"/
echo "Installed fonts into $dest"
