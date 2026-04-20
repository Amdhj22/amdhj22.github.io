---
created: '2026-04-20 19:55'
tags:
  - til
  - devops
  - kubernetes
  - control-plane
  - cka
publish: true
---

## 개요

Kubernetes 클러스터의 "두뇌" 역할을 하는 컴포넌트들. 모두 마스터 노드(또는 관리형 서비스의 제어 영역)에 위치하며, **실제 워크로드는 절대 실행되지 않는다**. 원하는 상태(desired state)를 선언받고, 현재 상태(current state)를 그에 맞추는 reconcile 루프를 돌린다.

kubeadm으로 설치하면 대부분의 컴포넌트가 **static Pod** 형태(`/etc/kubernetes/manifests/*.yaml`)로 kubelet이 직접 띄운다 → kube-apiserver 자신도 Pod로 돌아가지만 kubelet이 manifest 파일을 감시하므로 apiserver 장애 시에도 kubelet이 재시작 가능.

## 통신 토폴로지

모든 컴포넌트는 **kube-apiserver를 통해서만** 통신한다. 컴포넌트 간 직접 통신 없음.

```
  kubectl ──┐
  kubelet ──┼──▶ kube-apiserver ──▶ etcd
 controller ┘           ▲
 scheduler ─────────────┘
```

단 하나의 예외: **etcd**는 kube-apiserver만 직접 붙는다. 다른 컴포넌트는 etcd에 직접 접근 불가. 이 설계 덕에 인증·감사·캐싱이 apiserver 한 곳에 집중된다.

## kube-apiserver

클러스터의 **유일한 진입점**. REST API를 제공하고 모든 오브젝트의 읽기·쓰기를 중계한다.

- **포트**: 6443 (HTTPS), kubeadm 기본 설정
- **stateless** → 수평 확장 가능. HA 구성에서 3개 이상 replica가 일반적
- 처리 흐름: **인증(AuthN) → 인가(AuthZ) → Admission Control → 스키마 검증 → etcd write**
- Admission Controller는 mutating / validating 2단계. OPA Gatekeeper, Kyverno가 여기에 플러그인
- watch API로 long-lived connection 유지 → 컨트롤러·kubelet이 변경사항을 스트리밍으로 수신

### 인증 방식

| 방식 | 용도 |
|---|---|
| X.509 client cert | kubelet, 관리자 (kubeadm 기본) |
| Bearer token | ServiceAccount 토큰 |
| OIDC | SSO 통합 (Keycloak 등) |
| Webhook | 외부 인증 서버 위임 |

## etcd

분산 key-value 스토어. **클러스터 전체 상태의 단일 Source of Truth**.

- **Raft 합의 알고리즘** → 강한 일관성. quorum 필요 (5노드면 3개 생존 필수)
- 홀수 노드로 구성 (3/5/7) — 짝수는 split-brain에 불리
- 저장 내용: 모든 리소스 정의, ConfigMap, Secret(기본 평문 저장, EncryptionConfig 적용 필수), 네트워크 정책, 컨트롤러 상태
- **유일하게 cluster-fatal한 컴포넌트** — 손실 시 cluster 재구성 외 복구 불가 → 백업·암호화가 최우선

### 백업·복구 (CKA 단골)

```bash
# 백업
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%F).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# 복구 (--data-dir을 새 경로로)
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd.db \
  --data-dir=/var/lib/etcd-restore

# /etc/kubernetes/manifests/etcd.yaml의 volume hostPath를
# /var/lib/etcd → /var/lib/etcd-restore 로 변경 후 apiserver 재시작
```

### stacked vs external

- **stacked etcd**: 각 control plane 노드가 etcd도 함께 실행 (kubeadm 기본). 설치 간단, 장애 도메인 결합
- **external etcd**: etcd 전용 3~5노드 클러스터. 운영 복잡도↑, 장애 격리↑. 규모 크거나 apiserver·etcd 각각 튜닝 필요 시

## kube-scheduler

새로 생성된(또는 `nodeName`이 비어있는) Pod을 **적절한 노드에 할당**한다.

### 스케줄링 2단계

1. **Filtering**: 조건을 만족하지 못하는 노드 제거
   - 리소스 부족 (CPU·메모리)
   - taint 미매치
   - PV 접근 불가
   - nodeSelector / nodeAffinity 위반
   - podAntiAffinity 위반
2. **Scoring**: 남은 노드들을 점수화 후 최고점 노드 선택
   - 리소스 밸런싱
   - 이미지 로컬리티 (해당 이미지 이미 있는 노드 선호)
   - inter-pod affinity

결과는 `Pod.spec.nodeName` 필드를 채워 apiserver에 update → kubelet이 해당 노드에서 감지해 실행.

### 중요 특성

- scheduler 자체는 **Pod을 실행하지 않는다** — nodeName 필드를 채울 뿐. kubelet이 실제 실행 주체
- 복수 scheduler 공존 가능 (`Pod.spec.schedulerName`으로 커스텀 scheduler 지정)
- HA 구성 시 **leader election** → 복수 replica 중 1개만 active. Lease 오브젝트 사용

## kube-controller-manager

**reconcile 루프의 집합소**. 여러 컨트롤러를 하나의 바이너리 안에서 goroutine으로 실행.

### 주요 컨트롤러

| 컨트롤러 | 책임 |
|---|---|
| Node Controller | 노드 heartbeat 감시, unreachable 시 Pod eviction |
| Deployment Controller | Deployment → ReplicaSet 생성/업데이트 |
| ReplicaSet Controller | 선언된 replica 수 유지 |
| StatefulSet Controller | 순서·고유 ID 보장 Pod 관리 |
| DaemonSet Controller | 노드마다 Pod 1개 실행 보장 |
| Job / CronJob Controller | 일회성·스케줄 작업 |
| Endpoints / EndpointSlice Controller | Service selector → Endpoint 매핑 |
| ServiceAccount / Token Controller | default SA 생성, 토큰 발급 |
| Namespace Controller | 네임스페이스 삭제 시 리소스 정리 |
| PersistentVolume Controller | PVC ↔ PV 바인딩, reclaim policy 실행 |
| GC Controller | 소유자 리소스 삭제 시 종속 리소스 정리 (ownerReference) |

모든 컨트롤러는 같은 패턴: **watch → diff → act → update status**. CRD + custom controller(operator)도 이 패턴을 따른다.

### leader election

controller-manager도 HA 시 복수 replica. `--leader-elect=true`(기본값)로 Lease 기반 단일 leader만 활성. 나머지는 standby.

## cloud-controller-manager

클라우드 프로바이더 의존 로직을 **kube-controller-manager에서 분리**한 컴포넌트.

- 로드밸런서 프로비저닝 (AWS NLB, GCP LB 등)
- 노드 수명주기 (cloud API로 VM 종료 감지)
- 라우트 설정 (VPC 라우팅 테이블)
- 볼륨 attach/detach (CSI 이전 방식)

**왜 분리했나**: cloud provider 코드를 코어에서 떼어내야 K8s 릴리스 주기와 클라우드 SDK 업데이트를 **독립적으로** 관리할 수 있다. EKS·GKE 같은 관리형 서비스는 자체 구현 주입.

온프레미스·kubeadm 기본 설치에는 없음. MetalLB·self-hosted LB를 쓰면 이 역할을 대신한다.

## HA 구성 개요

프로덕션은 control plane 3노드 기본:

```
          LoadBalancer (VIP)
                │
      ┌─────────┼─────────┐
   master1   master2   master3
  (apiserver, (apiserver, (apiserver,
   scheduler,  scheduler,  scheduler,
   ctrl-mgr,   ctrl-mgr,   ctrl-mgr,
   etcd)       etcd)       etcd)
```

- **apiserver**: 모두 active, LB로 라운드로빈
- **scheduler / controller-manager**: leader election으로 1개만 active
- **etcd**: Raft quorum, 3노드면 1개 손실까지 버팀

## 컴포넌트가 죽으면 무슨 일이?

| 죽은 컴포넌트 | 즉각 영향 | 지속 영향 |
|---|---|---|
| kube-apiserver | `kubectl` 불가, 신규 배포 불가 | kubelet은 기존 Pod 유지 — 워크로드는 계속 동작 |
| etcd (quorum 유지) | 거의 무영향 | 무 |
| etcd (quorum 상실) | apiserver write 실패 | 사실상 cluster 정지 |
| scheduler | 신규 Pod 배치 안 됨 | 기존 Pod 무영향 |
| controller-manager | reconcile 중단 (복구·재생성 지연) | 기존 리소스 무영향 |
| kubelet (개별 노드) | 해당 노드 Pod 상태 보고 중단 | 5분 후 node NotReady → Pod 재스케줄링 |

**운영 교훈**: control plane이 죽어도 이미 떠 있는 Pod은 **당장 죽지 않는다**. 다만 고장 복구·신규 배포·스케일 조정이 막힌다.

## CKA 포인트

- static Pod manifest 경로: `/etc/kubernetes/manifests/`
- kubelet 설정: `/var/lib/kubelet/config.yaml`, kubeadm은 `/etc/kubernetes/kubelet.conf`
- 인증서: `/etc/kubernetes/pki/`, 만료 확인 `kubeadm certs check-expiration`, 갱신 `kubeadm certs renew all`
- 문제 진단 순서: `kubectl get nodes` → `crictl ps` → `journalctl -u kubelet` → `/var/log/pods/`

## Related

- [[K8s Storage]]
