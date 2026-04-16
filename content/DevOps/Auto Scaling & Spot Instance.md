---
created: '2026-04-16 09:00'
tags:
  - til
  - devops
  - kubernetes
  - auto-scaling
  - spot-instance
  - hpa
publish: true
---

## 개요

K8s Auto Scaling 3축과 Spot Instance 비용 최적화 전략.

## Auto Scaling

| 단위 | 방식 | 역할 |
|------|------|------|
| **Pod** | HPA | CPU/메모리 기반 Pod 수 자동 조정 |
| **Pod** | VPA | 실제 사용량 기반 리소스 요청/제한 자동 조정 |
| **Node** | Cluster Autoscaler | 노드 부족 시 추가, 여유 시 제거 |

## Spot Instance

클라우드의 남는 자원을 **On-Demand 대비 70~90% 저렴**하게 제공. 단, 언제든 회수 가능.

### 혼합 전략 (권장)

```
On-Demand  →  핵심 서비스 (DB, API Gateway)
Spot       →  비핵심/비동기 (배치, 캐시)
```

### 안정성 보완

- **PDB** (Pod Disruption Budget): 최소 가용 Pod 수 보장
- **Mixed Node Group**: On-Demand + Spot 혼합
- **종료 알림**: AWS는 2분 전 알림 → 안전한 Pod 종료/체크포인트

---

**Related**: [[Prometheus]] | [[DevOps]]
