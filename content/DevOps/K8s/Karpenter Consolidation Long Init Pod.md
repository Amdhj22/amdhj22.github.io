---
created: '2026-05-29 21:45'
updated: '2026-05-29 21:45'
tags:
  - til
  - kubernetes
  - karpenter
  - devops
  - incident
publish: true
---

# TIL: Karpenter consolidation이 long init Pod를 죽인다 — do-not-disrupt로 막는다

init 시간이 긴 Pod는 Karpenter의 `WhenEmptyOrUnderutilized` 정책 아래서 evict → reschedule → init 재시작의 무한 루프에 빠진다.

## 상황

ML inference 서비스(TorchInductor JIT 컴파일, 대용량 모델 warm-up)를 EKS에 배포했을 때 Pod가 Running에 진입했다가 곧바로 재시작되는 현상 반복. restart count가 계속 올라가는데 OOM도 아니고 probe 실패도 아니었다.

Karpenter 로그를 뒤졌더니 원인은 consolidation이었다.

## 원인

Karpenter consolidation의 `Underutilized` 판정은 **init container가 돌아가는 동안의 리소스 사용량**을 기준으로 노드를 평가한다. init이 수 분~수십 분 걸리는 Pod는 그 시간 동안 노드를 "거의 비어있는 것처럼" 보이게 만든다.

```
Pod 생성
  → init 시작 (수분~수십분)
  → Karpenter: "이 노드 underutilized" → evict
  → 다른 노드로 reschedule → init 재시작
  → reschedule된 노드도 underutilized 판정 → 또 evict
  → ...
```

v1에서 정책 이름이 `WhenEmptyOrUnderutilized`로 변경됐고, 이 설정일 때 발생 빈도가 높다.

## 진단

```bash
# eviction 이유 확인
kubectl describe pod <pod> -n <ns> | grep -A5 Events

# Karpenter disruption 로그
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter --tail=100 \
  | grep -i "consolidat\|evict\|disrupt"
```

`karpenter.sh/disruption: consolidating` 또는 `Underutilized` 이유면 이 패턴이다.

## 해결

### 핵심 해결: Pod에 do-not-disrupt annotation

```yaml
# deployment.yaml — spec.template.metadata
spec:
  template:
    metadata:
      annotations:
        karpenter.sh/do-not-disrupt: "true"
```

이 annotation이 붙은 Pod가 있는 노드는 Karpenter가 **절대 건드리지 않는다.** init이 끝날 때까지, 아니 Pod가 삭제될 때까지.

임시 적용이 필요하면:

```bash
kubectl annotate pod <pod> karpenter.sh/do-not-disrupt=true --overwrite -n <ns>
```

단, Pod 재생성 시 annotation이 사라지므로 deployment template에 박는 게 정석.

### 대안: PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ml-inference-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ml-inference
```

Karpenter는 PDB를 존중한다. 단, PDB는 이동을 허용하므로 init 재시작 가능성이 남는다. long init Pod에는 `do-not-disrupt`가 더 강하다.

### NodePool 정책 보수적으로 변경 (부분 해결)

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
spec:
  disruption:
    consolidationPolicy: WhenEmpty   # WhenEmptyOrUnderutilized → WhenEmpty
    consolidateAfter: 30m
```

`WhenEmpty`는 Pod가 하나도 없는 노드만 consolidation. 클러스터 전체에 영향이 가므로 다른 워크로드의 consolidation 효율도 낮아진다.

## 교훈

- Karpenter disruption 우선순위: `do-not-disrupt` annotation > PDB > NodePool 정책
- `WhenEmptyOrUnderutilized`는 v1에서 바뀐 이름 (`WhenUnderutilized` → 이 이름으로 바뀜). v1beta1 쓰던 설정 그대로 적용하면 이름 mismatch에 주의.
- init 시간 자체를 줄이는 게 근본 해결 — PVC로 컴파일 캐시를 영구화하면 cold-start 대폭 단축.
- long init Pod를 배포할 때는 `do-not-disrupt: "true"`를 기본값으로 달고 시작하는 게 방어적.

## 관련

- [[K8s Control Plane]]
