#!/bin/sh
# PROTOTYPE (#112), throwaway. Swaps the trial skhdrc into the live skhd and back.
# usage: ./trial.sh start | stop | log | tally
dir="$HOME/.config/skhd/PROTOTYPE-direct-vs-modes"
live="$HOME/.skhdrc"
backup="$HOME/.skhdrc.PROTOTYPE-backup"
log=/tmp/PROTOTYPE-skhd-trial.log

case "$1" in
  start)
    if [ -L "$live" ]; then echo "trial already running"; exit 0; fi
    mv "$live" "$backup"
    ln -s "$dir/PROTOTYPE.skhdrc" "$live"
    skhd --restart-service
    echo "$(date +%H:%M:%S) ------ trial start" >> "$log"
    cat <<'SHEET'
Trial on. Your old ~/.skhdrc is at ~/.skhdrc.PROTOTYPE-backup.

 DIRECT                      MODE (Hyper+W, border goes navy)
 Hyper+hjkl   focus          h j k l        focus
 ⌃⌥+hjkl      swap           ⇧ + hjkl       swap
 ⌃⌘+hjkl      resize         ⌃ + hjkl       resize
 Hyper+F/T/E  zoom/float/bal f / t / e      zoom/float/bal, then exit
                             Esc / Return / Hyper+W   exit

Switch Thai/English mid-mode at least once. ./trial.sh stop to put things back.
SHEET
    ;;
  stop)
    if [ ! -L "$live" ]; then echo "trial not running"; exit 0; fi
    rm "$live"
    mv "$backup" "$live"
    skhd --restart-service
    borders active_color=0xffc0c0c0
    echo "$(date +%H:%M:%S) ------ trial stop" >> "$log"
    echo "Restored ~/.skhdrc."
    ;;
  log) tail -n 40 -f "$log" ;;
  tally) awk '$2 != "------" { n[$2]++; a[$2" "$3]++ } END { for (s in n) print s, n[s]; print ""; for (k in a) print a[k], k }' "$log" | sort -k1,1 ;;
  *) echo "usage: $0 start | stop | log | tally"; exit 1 ;;
esac
