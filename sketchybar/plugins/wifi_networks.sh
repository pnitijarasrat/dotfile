#!/bin/bash

# The Wi-Fi networks for each Theme's Wi-Fi popup: CURRENT_SSID, the network
# en0 is on; KNOWN_LIST, the saved networks, one per line; NETWORKS, those in
# range, one "<ssid>\t<security mode>" per line, sorted by name.
CURRENT_SSID=$(networksetup -getairportnetwork en0 2>/dev/null | sed 's/^Current Wi-Fi Network: //')
KNOWN_LIST=$(networksetup -listpreferredwirelessnetworks en0 2>/dev/null | tail -n +2 | sed 's/^[[:space:]]*//')

SCAN_JSON=$(system_profiler SPAirPortDataType -json 2>/dev/null)
NETWORKS=$(echo "$SCAN_JSON" | jq -r '
  .SPAirPortDataType[0].spairport_airport_interfaces[0].spairport_airport_other_local_wireless_networks[]? |
  [(._name // "Unknown"), (.spairport_security_mode // "")] | @tsv
' | sort -u -t $'\t' -k1,1)
