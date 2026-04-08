---
created: '2026-04-07 18:00'
tags:
  - til
  - rails
  - architecture
publish: true
---

## Rails vs Spring

| 항목 | Rails | Spring (Kotlin/Java) |
|------|-------|---------------------|
| 연산 속도 | 인터프리터, 느림 | JIT+JVM, 빠름 |
| 동시성 | GIL 제약, 멀티 프로세스 | 멀티 스레딩 + Project Loom |
| 개발 속도 | 매우 빠름 | 상대적으로 느림 |
| 채용 (한국) | 어려움 | 표준, 쉬움 |

## 대형 서비스 사례

| 서비스 | 특징 |
|--------|------|
| GitHub | 10년+ Rails 모놀리스, YJIT 기여 |
| Shopify | 블랙프라이데이 수십만 결제/초, YJIT 개발 주도 |
| Twitch | 채팅/스트리밍은 Go, 비즈니스 로직은 Rails |

**공통 전략**: Majestic Monolith + 성능 민감한 1~5%만 Go/Rust로 분리

## 언제 어떤 것을?

```
빠른 MVP, 복잡한 비즈니스 로직  → Rails
대규모 협업, 타입 안전성         → Spring (Kotlin)
고성능 API, DevOps 도구         → Go (Gin)
CPU 집약적 연산                  → Rust
AI/ML 파이프라인                 → Python (FastAPI)
```
