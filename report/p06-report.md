# CTE412 Practical 15 — Assessed Lab Report

Student: Damber Khatiwara  
Student number: 02230123

## 1. Objective
The objective was to deploy the Campus Notice Board API to Kubernetes, continuously measure availability, and compare Recreate, RollingUpdate, failed-release rollback, blue/green switching and feature-flag behaviour using observed logs.

## 2. Environment
- Operating system: [fill in]
- Docker version: [fill in]
- kind version: [fill in]
- kubectl version: [fill in]
- Kubernetes version: [fill in]
- Application language: JavaScript / Node.js
- Base image: Alpine-based `node:22-alpine`; monitor uses BusyBox.

## 3. Results
Fill this table using the actual summariser output and timestamps in `evidence/`. Do not estimate or invent measurements.

| Release/action | Requests observed | Failed requests | Mixed-version window (seconds) | Peak notice-board Pods |
|---|---:|---:|---:|---:|
| Recreate to 1.1.0 | | | | |
| RollingUpdate to 1.1.0 | | | | |
| Broken release and rollback | | | | |
| Blue/green switch 1 (blue to green) | | | | |
| Blue/green switch 2 (green to blue) | | | | |
| Blue/green switch 3 (blue to green) | | | | |
| Feature flag change | | | | |

## 4. Analysis

### A1. Rank strategies by failed requests
[Use the measured failed-request totals from the evidence logs. Explain the observed result using the deployment and Service behaviour.]

### A2. Why the broken release did or did not cause failures
[Refer to `readinessProbe`, `livenessProbe`, `progressDeadlineSeconds`, `maxUnavailable`, `maxSurge` and the Service selectors in the manifests. Predict what would change if relevant fields were left at defaults.]

### A3. RollingUpdate versus blue/green
[Compare measured mixed-version window, peak Pod/resource use against ResourceQuota, and rollback time. Cite exact evidence filenames.]

### A4. When Recreate is correct
[Give a realistic example where two application versions cannot safely run concurrently, so a brief planned outage is acceptable.]

### A5. What the feature flag changed
[Explain that FEATURE_PINNED changes notice ordering without rebuilding the image. State that changing a ConfigMap-backed environment variable does not update already-running processes, so a declarative Pod-template change/restart is still needed.]

## 5. Reflection
- Error encountered: [describe one real error]
- Output that revealed it: [quote the relevant line and evidence filename]
- Reasoning and fix: [explain briefly]
- One thing that remains unclear: [state honestly]

## 6. References
[List only documentation actually consulted, with access dates.]
