---
created: 2026-06-01 15:00
updated: 2026-06-01 15:00
tags: [til, kubernetes, devops, troubleshooting, debugging]
publish: true
---

# TIL: Pod가 CrashLoopBackOff에 빠졌을 때 원인 추적하기

CrashLoopBackOff는 에러 코드가 아니다. kubelet이 "컨테이너가 계속 죽으니까 재시작을 지수 백오프로 늦추는 중"이라는 상태다. STATUS 자체보단 **왜 죽는지**를 추적하는 게 전부.

## 상황

`kubectl get pods`에서 아래 상태를 마주쳤다.

```
NAME              READY   STATUS             RESTARTS   AGE
api-7d9f8b-xkp2   0/1     CrashLoopBackOff   8          12m
```

RESTARTS 카운트가 계속 올라가고, 로그를 보려 해도 비어있다. 이 상태에서 원인 추적하는 흐름을 정리한다.

## 추적 순서

### 1. describe로 Exit Code와 Last State 확인

```bash
kubectl describe pod <pod> -n <namespace>
```

Events 섹션과 `Containers > Last State`를 본다.

```
Containers:
  api:
    Last State:  Terminated
      Reason:    OOMKilled
      Exit Code: 137
      Started:   Sun, 01 Jun 2026 14:48:00 +0900
      Finished:  Sun, 01 Jun 2026 14:48:03 +0900
```

Exit Code가 핵심 단서다.

| Exit Code | 의미 | 대응 방향 |
|-----------|------|-----------|
| `0` | 정상 종료인데 재시작됨 | `restartPolicy` 확인, 앱이 의도치 않게 종료되는 흐름 점검 |
| `1` | 앱 에러 (일반) | 로그 확인 |
| `137` | SIGKILL (OOMKilled, 128+9) | 메모리 limit 상향 또는 누수 점검 |
| `143` | SIGTERM (128+15) | liveness probe 실패 또는 외부 kill |

### 2. --previous로 죽기 직전 로그 확인

```bash
kubectl logs <pod> -n <namespace> --previous
```

`--previous` 없이 실행하면 새로 뜬 컨테이너의 로그 — 거의 비어있다. CrashLoopBackOff 상황에서 `--previous`는 필수다.

컨테이너가 여럿이면 `-c <container-name>`으로 지정한다.

```bash
kubectl logs <pod> -n <namespace> -c <container> --previous
```

### 3. 종료 상태 raw 확인

```bash
kubectl get pod <pod> -n <namespace> \
  -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'
```

출력 예시:

```json
{
  "exitCode": 137,
  "finishedAt": "2026-06-01T05:48:03Z",
  "reason": "OOMKilled",
  "startedAt": "2026-06-01T05:48:00Z"
}
```

`describe`보다 raw JSON이 더 정밀할 때가 있다. `reason`과 `exitCode`를 동시에 보는 게 포인트.

## 흔한 원인 4가지와 대응

### 앱 자체 에러 / 설정 누락

가장 흔한 케이스. env 미설정, ConfigMap/Secret 마운트 실패, DB 연결 실패 등.

```bash
# 로그에서 원인 확인
kubectl logs <pod> --previous

# ConfigMap/Secret 마운트 확인
kubectl describe pod <pod> | grep -A5 "Mounts:"
kubectl get configmap <cm> -o yaml
kubectl get secret <secret> -o yaml
```

Secret이 아예 없으면 Pod 자체가 뜨지 않고 `CreateContainerConfigError`가 뜨는 경우도 있다.

### liveness probe가 정상 앱을 죽임

앱은 멀쩡한데 kubelet이 liveness probe 실패를 판정하고 kill한다. 특히 앱 기동 시간이 긴 경우.

```bash
kubectl describe pod <pod> | grep -A10 "Liveness:"
```

```
Liveness:  http-get http://:8080/health delay=5s timeout=1s period=10s #success=1 #failure=3
```

`delay=5s`인데 앱이 뜨는 데 30초 걸리면 → probe 3회 실패 → kubelet이 kill.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30   # 앱 기동 시간 + 여유
  timeoutSeconds: 5          # 응답 지연 허용
  failureThreshold: 3
```

`initialDelaySeconds` 또는 `startupProbe`로 기동 여유를 줘야 한다.

### OOMKilled (exit 137)

컨테이너가 `resources.limits.memory`를 초과하면 커널이 SIGKILL을 보낸다.

```bash
# 현재 limits 확인
kubectl get pod <pod> -o jsonpath='{.spec.containers[0].resources}'

# 노드 메모리 상태
kubectl top node
kubectl top pod <pod>
```

대응 방향 두 가지:
1. limits 상향 — 즉각적이지만 근본 해결은 아님
2. 메모리 누수 점검 — heap dump, pprof 등 언어별 프로파일링 도구 사용

```yaml
resources:
  requests:
    memory: "256Mi"
  limits:
    memory: "512Mi"   # 상향 검토
```

### command/args 잘못 → 즉시 종료

컨테이너가 시작하자마자 종료되는 케이스. exit 0이면 앱이 정상적으로 끝났지만 컨테이너가 재시작되는 것이므로 `restartPolicy` 문제, exit 1이면 실행 자체가 실패한 것.

```bash
kubectl describe pod <pod> | grep -A3 "Command:"
```

확인 후 임시 디버깅:

```bash
# 셸로 직접 진입해서 실행
kubectl run debug --image=<image> --restart=Never -it --rm -- /bin/sh
```

## 작동한 개념

**CrashLoopBackOff = kubelet의 지수 백오프 재시작**
컨테이너가 죽으면 kubelet이 10s → 20s → 40s → ... 최대 5분 간격으로 재시작 시도. 상태 이름은 에러가 아니라 "지금 backoff 대기 중"이라는 뜻이다.

**restartPolicy**
- `Always` — 기본값. Deployment, DaemonSet. 정상 종료(exit 0)도 재시작.
- `OnFailure` — exit 0이 아닐 때만 재시작. Job에서 주로 사용.
- `Never` — 재시작 안 함.

CrashLoopBackOff는 `restartPolicy: Always`(기본)인 상황에서 앱이 계속 죽을 때 나타난다.

**liveness probe 실패 → kubelet이 컨테이너 kill 후 재시작**
probe는 kubelet이 직접 실행한다. 실패 횟수가 `failureThreshold`를 초과하면 kubelet이 컨테이너를 강제 종료 후 재시작. 앱 자체는 멀쩡해도 probe 설정이 너무 빡빡하면 반복 kill이 일어난다.

**exit code 컨벤션**
Unix 시그널 기반. `128 + 시그널 번호` 형식.
- `137 = 128 + 9 (SIGKILL)` — OOM, 강제 종료
- `143 = 128 + 15 (SIGTERM)` — 정상 종료 요청, probe 실패 시 kubelet이 먼저 SIGTERM 보냄

## 관련

- [[K8s Control Plane]]
- [[Karpenter Consolidation Long Init Pod]]
