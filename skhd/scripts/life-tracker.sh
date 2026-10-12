#!/bin/sh
# ⌘0 (#126): life-tracker lives on space 10 as an installed Chrome app. Its
# server listens on 4173; if nothing answers there, start it in the
# background (no browser tab) and wait for it, then hand over to go.sh.
# LIFE_TRACKER_BIN points it at another launcher (the test uses a stub).
set -eu

server=${LIFE_TRACKER_BIN:-$HOME/project/life-tracker/bin/life-tracker}
answering() { nc -z -G 1 127.0.0.1 4173 >/dev/null 2>&1; }

if ! answering; then
  LIFE_TRACKER_NO_OPEN=1 nohup "$server" >/tmp/life-tracker.log 2>&1 &
  # A first run may rebuild the client, so allow up to 30 s.
  tries=0
  until answering; do
    tries=$((tries + 1))
    [ "$tries" -ge 150 ] && break
    sleep 0.2
  done
fi

exec "$(dirname "$0")/go.sh" -s 10 life-tracker
