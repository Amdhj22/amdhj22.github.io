---
created: '2026-04-16 09:00'
tags:
  - til
  - devops
  - opentelemetry
  - observability
  - tracing
publish: true
---

## 개요

클라우드 네이티브 Observability 표준 프레임워크. Log + Metric + Trace를 벤더 중립적으로 수집.

## 분산 추적 핵심 개념

| 개념 | 설명 |
|------|------|
| **Trace** | 요청 단위 추적 (전체 여정) |
| **Span** | 개별 작업 단위 (서비스별) |
| **TraceID** | 서비스 간 전달, 전체 흐름 연결 |

## 적용 흐름

```
SDK 선택 → 계측(자동/수동) → Collector 구성 → OTLP로 Export
```

## 사용 이유

- **벤더 독립**: 특정 모니터링 도구에 종속 X
- **통합 관측성**: Log + Metric + Trace 상호 연관 분석
- **자동 계측**: 언어별 에이전트로 수동 코딩 최소화

---

**Related**: [[Prometheus]] | [[DevOps]]
