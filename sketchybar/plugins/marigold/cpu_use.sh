#!/bin/bash

# Sets CORES to the number of cores and USE to the CPU in use across all of
# them, as a whole percent of the machine.
CORES="$(sysctl -n hw.ncpu)"
USE="$(ps -Aceo pcpu=,comm= | awk -v cores="$CORES" '{ total += $1 } END { printf "%.0f", total / cores }')"
