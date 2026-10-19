# Purpose: Save common observation outputs into evidence. Run from repository root in PowerShell.
# Usage: .\scripts\capture-task.ps1 -Task 3
param([Parameter(Mandatory=$true)][ValidateRange(1,9)][int]$Task)
$ErrorActionPreference = "Continue"
$dir = "evidence"
New-Item -ItemType Directory -Force $dir | Out-Null
kubectl get nodes -o wide 2>&1 | Out-File "$dir/t$Task-nodes.txt"
kubectl get all -n nb-02230123 -o wide 2>&1 | Out-File "$dir/t$Task-all.txt"
kubectl get resourcequota,limitrange -n nb-02230123 2>&1 | Out-File "$dir/t$Task-quota-limitrange.txt"
kubectl get endpointslice -n nb-02230123 -o wide 2>&1 | Out-File "$dir/t$Task-endpointslices.txt"
kubectl get events -n nb-02230123 --sort-by=.lastTimestamp 2>&1 | Out-File "$dir/t$Task-events.txt"
Write-Host "Captured common observations for Task $Task in evidence/."
