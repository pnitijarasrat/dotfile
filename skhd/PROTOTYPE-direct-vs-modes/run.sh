#!/bin/sh
# PROTOTYPE (#112), throwaway. Logs a Shortcut press, then runs its command.
# usage: run.sh <style> <action> <command...>
style=$1 action=$2
shift 2
printf '%s %-6s %s\n' "$(date +%H:%M:%S)" "$style" "$action" >> /tmp/PROTOTYPE-skhd-trial.log
"$@"
