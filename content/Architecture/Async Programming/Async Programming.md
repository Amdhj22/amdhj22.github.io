---
created: 2026-06-02 10:00
updated: 2026-06-02 10:00
tags: [til, async, concurrency, architecture]
---

# Async Programming

Thread 모델의 구조적 한계에서 출발해, OS/런타임 스케줄러가 그 한계를 어떻게 극복하는지, 그리고 I/O Multiplexing이 최종적으로 어떻게 고연결 문제를 해결하는지를 순서대로 다룬다.

---

## 학습 경로

| 순서 | 노트 | 다루는 내용 |
|------|------|------------|
| 01 | [[01. Overview]] | 비동기의 정의, 동시성 vs 병렬성, Thread-per-request 한계, 언어별 비동기 모델 비교 |
| 02 | [[02. Thread]] | 프로세스/스레드 구조, 컨텍스트 스위칭 비용, 1:1/N:1/M:N 스레드 모델, 데이터 레이스 |
| 03 | [[03. Scheduler]] | OS 선점형 스케줄러 vs 런타임 협력형 스케줄러, Go GMP 모델, Work-Stealing |
| 04 | [[04. IO Multiplexing]] | epoll/kqueue, 이벤트 루프 구조, io_uring, DevOps fd 설정 |

---

## 핵심 흐름

```
Thread-per-request 모델
  → 요청 N개 = 스레드 N개 = 메모리 폭증 + 컨텍스트 스위칭 폭증
  → [02. Thread]에서 이 비용을 구체적으로 분석
       ↓
M:N 스레드 모델 (Goroutine, Tokio, Coroutine)
  → OS 스레드는 CPU 코어 수만큼만, 유저 스레드는 수백만 개
  → 하지만 "누가 어떤 스레드에 올릴지" 결정하는 주체가 필요
       ↓
런타임 스케줄러 (GMP, Tokio Worker)
  → [03. Scheduler]에서 Go GMP, Work-Stealing 알고리즘 설명
  → await/yield 지점에서 협력적으로 제어권 반환 → 커널 진입 없이 전환
       ↓
I/O Multiplexing (epoll, 이벤트 루프)
  → [04. IO Multiplexing]에서 epoll이 스레드 1개로 소켓 수천 개를 감시하는 원리 설명
  → 런타임 스케줄러 + 이벤트 루프가 맞물려 "스레드 수십 개로 수천 요청 처리"가 가능해짐
```

세 개념의 연결고리:
- **Thread**는 실행 단위의 비용 문제를 정의한다.
- **Scheduler**는 그 비용을 최소화하는 배분 전략이다.
- **IO Multiplexing**은 I/O 대기 중 스레드를 낭비하지 않도록 하는 OS 레벨 메커니즘이다.
