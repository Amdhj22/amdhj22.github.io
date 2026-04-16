---
created: '2026-04-16 09:00'
tags:
  - til
  - redis
  - cache
  - caching-strategy
publish: true
---

## 개요

Redis 캐싱의 Read/Write 전략 패턴 정리.

## Read 전략

| 전략 | 흐름 | 특징 |
|------|------|------|
| **Look-Aside** | Cache Miss → 앱이 DB 조회 → Cache 저장 | 가장 일반적, 캐시 장애 시 DB 직접 조회 가능 |
| **Read-Through** | Cache Miss → 캐시가 직접 DB 조회 → 저장 | 코드 단순화, 캐시 라이브러리 지원 필요 |

## Write 전략

| 전략 | 흐름 | 특징 |
|------|------|------|
| **Write-Back** | Cache에 쓰기 → 비동기로 DB 반영 | 쓰기 성능 최고, 장애 시 유실 위험 |
| **Write-Through** | Cache에 쓰기 → 동기적 DB 반영 | 일관성 보장, 쓰기 지연 |
| **Write-Around** | DB에 직접 쓰기 → 읽기 시 캐시 갱신 | 쓰기 빈번 + 읽기 드문 데이터 적합 |

## 선택 가이드

```
읽기 많고 쓰기 적음  → Look-Aside + Write-Around
읽기/쓰기 균형       → Read-Through + Write-Through
쓰기 성능 최우선     → Look-Aside + Write-Back
```

---

**Related**: [[Redis Eviction]] | [[Redis Sentinel]] | [[Redis]]
