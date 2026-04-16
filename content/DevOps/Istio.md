---
created: '2026-04-16 09:00'
tags:
  - til
  - devops
  - istio
  - service-mesh
  - envoy
  - mtls
publish: true
---

## 개요

MSA 서비스 메시 플랫폼. 코드 변경 없이 서비스 간 통신 관리, 보안, 가시성 확보.

## 구성

- **Data Plane**: Envoy Sidecar가 모든 트래픽을 가로채 정책 적용
- **Control Plane**: Pilot(라우팅), Citadel(보안), Galley(설정), Mixer(텔레메트리)

## 핵심 기능

| 영역 | 기능 |
|------|------|
| **트래픽** | Canary/A-B 배포, 서킷 브레이커, 재시도, 부하 분산 |
| **보안** | mTLS (서비스 간 암호화), 정책 기반 인증/인가 |
| **가시성** | 메트릭 자동 수집 → Prometheus/Grafana, 분산 트레이싱 |

## Istio vs API Gateway

| | API Gateway | Istio |
|---|---|---|
| 트래픽 방향 | North-South (외부→내부) | East-West (내부 서비스 간) |
| 동작 방식 | 엣지단 진입 관리 | 각 Pod에 Sidecar 주입 |

---

**Related**: [[Prometheus]] | [[OpenTelemetry]] | [[DevOps]]
