# CTE412 Practical 15 — Campus Notice Board on Kubernetes


This repository implements the Campus Notice Board API and Kubernetes manifests for the CTE412 assessed lab. Measurements in `evidence/` and the report must come from your own run; do not invent failure counts or timestamps.

## A. Prerequisites

Install and start Docker Desktop, then install `kubectl`, `kind`, Git, and Node is not required on the host because Node runs in the container. Run PowerShell from this repository folder.

Check:
```powershell
docker version
kubectl version --client
kind version
git --version
```

## B. Start from a clean state

If you have already created this exact cluster and want to restart the lab, remove it first:
```powershell
kind delete cluster --name cte412-02230123
```
Do not delete unrelated clusters. If this is the first run, skip the delete command.

## C. Task 1 — Cluster, namespace and quota

Create the three-node cluster. The cluster config binds host port 30090 to 127.0.0.1:
```powershell
kind create cluster --name cte412-02230123 --config cluster/kind-cluster.yaml --wait 120s
```

Apply namespace, quota and LimitRange, then set the current context namespace:
```powershell
kubectl apply -f manifests/base/namespace-quota.yaml
kubectl config set-context --current --namespace=nb-02230123
kubectl get nodes -o wide | Out-File evidence/t1-nodes.txt
kubectl describe quota notice-board-quota -n nb-02230123 | Out-File evidence/t1-quota.txt
kubectl config get-contexts | Out-File evidence/t1-context.txt
kubectl get namespace nb-02230123 --show-labels | Out-File evidence/t1-namespace.txt
```
Expected: one control-plane and two worker nodes, all Ready.

## D. Task 2 — Build three images and load them locally

Build from the same source tree:
```powershell
docker build --build-arg APP_VERSION=1.0.0 -t notice-board:02230123-1.0.0 app
docker build --build-arg APP_VERSION=1.1.0 -t notice-board:02230123-1.1.0 app
docker build --build-arg APP_VERSION=1.2.0-broken --build-arg BROKEN_HEALTH=true -t notice-board:02230123-1.2.0-broken app
```

Load the app images into the kind cluster (no app registry is used):
```powershell
kind load docker-image notice-board:02230123-1.0.0 --name cte412-02230123
kind load docker-image notice-board:02230123-1.1.0 --name cte412-02230123
kind load docker-image notice-board:02230123-1.2.0-broken --name cte412-02230123
```

Build/load the BusyBox monitor image too, to avoid node-side image pulls:
```powershell
docker pull busybox:1.36
kind load docker-image busybox:1.36 --name cte412-02230123
docker images notice-board | Out-File evidence/t2-local-images.txt
docker run -d --name nb-test-100 -p 18080:8080 -e APP_VERSION=1.0.0 -e STUDENT_ID=02230123 notice-board:02230123-1.0.0
Start-Sleep -Seconds 2
curl.exe -i http://127.0.0.1:18080/version | Out-File evidence/t2-version-under-5s.txt
curl.exe -i http://127.0.0.1:18080/healthz | Out-File evidence/t2-health-under-5s.txt
Start-Sleep -Seconds 5
curl.exe -i http://127.0.0.1:18080/healthz | Out-File evidence/t2-health-over-5s.txt
docker rm -f nb-test-100
```
Capture image presence inside a worker:
```powershell
docker exec cte412-02230123-worker crictl images | Out-File evidence/t2-worker-images.txt
```
If `crictl` is not in PATH inside the node, use:
```powershell
docker exec cte412-02230123-worker ctr -n k8s.io images list | Out-File evidence/t2-worker-images.txt
```

## E. Task 3 — Deploy version 1.0.0

```powershell
kubectl apply -f manifests/rolling/notice-board.yaml
kubectl rollout status deployment/notice-board --timeout=120s
kubectl get deployment,replicaset,pods -l app=notice-board -o wide | Out-File evidence/t3-workloads.txt
kubectl get endpointslice -l kubernetes.io/service-name=notice-board -o yaml | Out-File evidence/t3-endpointslice.txt
1..6 | ForEach-Object { curl.exe -s http://127.0.0.1:30090/version; Start-Sleep -Milliseconds 250 } | Out-File evidence/t3-version-responses.txt
```
Check:
```powershell
curl.exe http://127.0.0.1:30090/notices
curl.exe http://127.0.0.1:30090/version
```
The version responses should show student `02230123`. The `pod` field should vary across responses eventually.

## F. Task 4 — Monitor and summariser

Start the monitor once. Do not restart it between Task 4–8:
```powershell
kubectl apply -f manifests/base/monitor.yaml
kubectl wait --for=condition=Ready pod/monitor --timeout=120s
Start-Sleep -Seconds 60
kubectl logs monitor --since=70s | Out-File evidence/t4-monitor-at-rest.log
Get-Content evidence/t4-monitor-at-rest.log -TotalCount 10 | Out-File evidence/t4-first-10-lines.txt
```
Run the summariser from Git Bash or WSL:
```bash
bash scripts/summarise.sh evidence/t4-monitor-at-rest.log
```
Save the summariser output by adding `> evidence/t4-summary.txt` to the command. If `bash` is unavailable, run it from Git Bash installed with Git for Windows.

## G. Task 5 — Recreate versus RollingUpdate

Keep the monitor running throughout. Before each release, note the start time and collect logs that include at least 10 seconds before and after the rollout.

### G1. Recreate release to 1.1.0
Edit `manifests/rolling/notice-board.yaml`:
- Change `strategy.type` to `Recreate`.
- Change the Pod template image to `notice-board:02230123-1.1.0`.
- Change the Pod template `version` label to `"1.1.0"`.
- Update the `kubernetes.io/change-cause` annotation with a unique Task 5 description.

Apply and capture:
```powershell
kubectl logs monitor --since=2m | Out-File evidence/t5-recreate-before.log
kubectl apply -f manifests/rolling/notice-board.yaml
kubectl rollout status deployment/notice-board --timeout=120s
kubectl logs monitor --since=2m | Out-File evidence/t5-recreate-after.log
kubectl rollout history deployment/notice-board | Out-File evidence/t5-recreate-history.txt
kubectl get pods -w
```
Run the watch in a separate terminal while applying the manifest. Combine before/after logs into one log if your instructor expects one continuous capture.

### G2. Return to 1.0.0 declaratively
Edit the same manifest: set image and version label back to 1.0.0; use a new change-cause. Apply and wait for rollout.

### G3. RollingUpdate release to 1.1.0
Edit the same manifest:
- `strategy.type: RollingUpdate`
- `maxUnavailable: 0`
- `maxSurge: 1`
- `minReadySeconds: 5`
- Image and version label to 1.1.0
- New change-cause annotation

Apply and collect the equivalent logs and Pod watch as above. Summarize each release log with `scripts/summarise.sh`. Use timestamps and response versions to determine any mixed-version interval; don't guess.

## H. Task 6 — Failed release and rollback

Set the manifest to RollingUpdate with `maxUnavailable: 0`, `maxSurge: 1`, and `progressDeadlineSeconds: 60`. Change the image to `notice-board:02230123-1.2.0-broken`, version label to `"1.2.0-broken"`, and change-cause annotation to describe the broken release.

Apply and wait long enough for Kubernetes to report failure:
```powershell
kubectl apply -f manifests/rolling/notice-board.yaml
Start-Sleep -Seconds 70
kubectl describe deployment notice-board | Out-File evidence/t6-deployment-conditions.txt
kubectl get pods -o wide | Out-File evidence/t6-pods-during-failure.txt
kubectl logs monitor --since=3m | Out-File evidence/t6-monitor.log
```
The broken image never becomes Ready. With `maxUnavailable: 0`, old ready Pods should continue serving traffic while the new ReplicaSet fails to progress. Verify this in your own logs.

Rollback is the one imperative change allowed by the assignment:
```powershell
kubectl rollout undo deployment/notice-board
kubectl rollout status deployment/notice-board --timeout=120s
```
Immediately edit the repository manifest so its image, version label, strategy and relevant template fields match the rolled-back live Deployment. Compare:
```powershell
kubectl diff -f manifests/rolling/notice-board.yaml
kubectl get deployment notice-board -o yaml | Out-File evidence/t6-live-deployment-after-rollback.yaml
```
An empty `kubectl diff` means no differences are found (ignore server-generated fields not present in the file if your kubectl reports them).

## I. Task 7 — Blue/green

Remove the single Deployment before starting the two-colour setup:
```powershell
kubectl delete deployment notice-board
```
Keep the Services if present; the following apply updates/recreates them:
```powershell
kubectl apply -f manifests/bluegreen/flags.yaml
kubectl apply -f manifests/bluegreen/deployments.yaml
kubectl apply -f manifests/bluegreen/services.yaml
kubectl rollout status deployment/notice-board-blue --timeout=120s
kubectl rollout status deployment/notice-board-green --timeout=120s
```
Capture the starting state:
```powershell
kubectl get endpointslice -l kubernetes.io/service-name=notice-board -o yaml | Out-File evidence/t7-production-blue-endpoints.txt
kubectl get endpointslice -l kubernetes.io/service-name=notice-board-preview -o yaml | Out-File evidence/t7-preview-green-endpoints.txt
kubectl exec monitor -- wget -qO- http://notice-board-preview/version
curl.exe http://127.0.0.1:30090/version
```
Initially, production selects blue (1.0.0) and preview selects green (1.1.0).

For each switch, edit `manifests/bluegreen/services.yaml` so the `slot` selector on both `notice-board` and `notice-board-ext` is `green` or `blue`, then apply it:
```powershell
kubectl apply -f manifests/bluegreen/services.yaml
kubectl get endpointslice -l kubernetes.io/service-name=notice-board -o yaml
curl.exe http://127.0.0.1:30090/version
```
Perform and record the three switches: blue→green, green→blue, blue→green. Mark each switch time in your notes and capture monitor logs covering all switches. Do not change the preview Service selector; it must always point to green.

## J. Task 8 — Feature flag

First verify green is running with `FEATURE_PINNED: "false"`:
```powershell
kubectl exec monitor -- wget -qO- http://notice-board-preview/notices
```
Change `FEATURE_PINNED` to `"true"` in `manifests/bluegreen/flags.yaml` and apply:
```powershell
kubectl apply -f manifests/bluegreen/flags.yaml
```
A ConfigMap value consumed as an environment variable does not update inside already-running containers. Prove this by checking `/notices` before restarting green Pods. Then edit the annotation `cte412/flag-restart` in the green Deployment Pod template in `manifests/bluegreen/deployments.yaml` from `"false"` to `"true"` and apply:
```powershell
kubectl apply -f manifests/bluegreen/deployments.yaml
kubectl rollout status deployment/notice-board-green --timeout=120s
kubectl exec monitor -- wget -qO- http://notice-board-preview/notices
```
This restarts green Pods declaratively and the new containers read the true flag. Save before/after responses and the Task 8 monitor log/summary.

## K. Task 9 — Reproducibility and clean-up

Save the full monitor log:
```powershell
kubectl logs monitor -n nb-02230123 | Out-File evidence/t9-monitor-full.log
```
The README and repository manifests are the rebuild instructions. Test them from a clean cluster only when you have saved all evidence; rebuild from the first command in Sections C–J. For Task 9, preserve namespace/quota/LimitRange as instructed, delete other objects in the namespace, and reapply manifests in dependency order.

Before deleting the cluster:
```powershell
kubectl config set-context --current --namespace=default
kind delete cluster --name cte412-02230123
kind get clusters | Out-File evidence/t9-clusters-after-cleanup.txt
```

## L. Git submission

Commit after each task, as the practical requests:
```powershell
git init
git add .
git commit -m "Task 1: cluster namespace and quota"
```
Repeat `git add .` and `git commit -m "Task N: ..."` after each task. Create a GitHub repository and push the commits, then submit its URL on the VLE.

## M. Evidence checklist
- Task 1: `t1-nodes.txt`, `t1-quota.txt`, `t1-context.txt`
- Task 2: `t2-local-images.txt`, `t2-worker-images.txt`, version/health responses under and over 5 seconds
- Task 3: workloads, EndpointSlice, six version responses
- Task 4: first 10 monitor lines, at-rest log, summary
- Task 5: Recreate and RollingUpdate logs/summaries, rollout history, Pod watch
- Task 6: deployment conditions, Pods during failure, monitor log/summary, post-rollback manifest/live comparison
- Task 7: EndpointSlices before/after, preview and production responses, log with switch timestamps, quota usage
- Task 8: responses before/after flag, proof of old Pods not observing env change, monitor log/summary
- Task 9: full monitor log, rebuild evidence, cluster-deleted output

## N. Final report
Complete `report/p06-report.md` using real evidence. Never make up failure counts, mixed-version windows, environment versions, or peak Pod counts.
