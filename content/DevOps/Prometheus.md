---
created: '2026-04-16 09:00'
tags:
  - til
  - devops
  - prometheus
  - grafana
  - loki
  - monitoring
publish: true
---

## 개요

Kubernetes 모니터링 스택: Prometheus + Grafana + Loki + Promtail.

## 구성 요소

| 컴포넌트 | 역할 |
|---------|------|
| **Prometheus** | 클러스터 메트릭 수집/저장, PromQL 쿼리 |
| **Grafana** | 메트릭/로그 시각화 대시보드 |
| **Loki** | 로그 집계 (메타데이터만 인덱싱 → 비용 절감) |
| **Promtail** | 각 노드에서 로그 수집 → Loki로 전송 |

## Helm 설치

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring -f values.yaml --create-namespace
```

## 추천 Grafana 대시보드

- [K8s Views - Nodes](https://grafana.com/grafana/dashboards/15759-kubernetes-views-nodes/)
- [K8s Views - Pods](https://grafana.com/grafana/dashboards/15760-kubernetes-views-pods/)

---

**Related**: [[OpenTelemetry]] | [[DevOps]]
