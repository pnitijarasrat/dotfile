#!/bin/bash

# Sets USED and TOTAL to the memory in use and installed, in bytes. In use is
# as Activity Monitor counts it: app memory (anonymous pages less purgeable),
# wired and compressed.
TOTAL="$(sysctl -n hw.memsize)"
USED="$(vm_stat | awk '
  /page size of/ { size = $8 }
  /^Anonymous pages:/ { pages += $3 }
  /^Pages purgeable:/ { pages -= $3 }
  /^Pages wired down:/ { pages += $4 }
  /^Pages occupied by compressor:/ { pages += $5 }
  END { printf "%.0f", pages * size }')"
