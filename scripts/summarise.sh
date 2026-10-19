#!/bin/sh
# Purpose: Summarise monitor output: request totals, failures, time span and version counts.
# Run command: sh scripts/summarise.sh evidence/t4-monitor-at-rest.log
set -eu
LOG="${1:?Usage: summarise.sh monitor-log-file}"
TOTAL=$(wc -l < "$LOG" | tr -d ' ')
FAILED=$(grep -c ' FAIL ' "$LOG" || true)
FIRST=$(head -n 1 "$LOG" | awk '{print $1}')
LAST=$(tail -n 1 "$LOG" | awk '{print $1}')
echo "Total requests: $TOTAL"
echo "Failed requests: $FAILED"
echo "First timestamp: ${FIRST:-N/A}"
echo "Last timestamp: ${LAST:-N/A}"
echo "Responses per version:"
grep ' OK ' "$LOG" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p' | sort | uniq -c | awk '{print "  " $2 ": " $1}'
