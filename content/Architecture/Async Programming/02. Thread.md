---
created: '2026-04-10 00:00'
publish: true
tags:
  - til
  - async
  - thread
  - concurrency
  - os
---

# Thread — 프로세스, 스레드, 컨텍스트 스위칭

> 상세 레퍼런스: [[Resources/Development/Async Programming/Thread|Thread (상세 레퍼런스)]]

---

## 프로세스 vs 스레드

```
프로세스: 독립된 메모리 공간 (Code, Data, Heap, Stack)
스레드:   Code, Data, Heap 공유 / Stack만 독립
```

스레드가 가벼운 이유 → 메모리 공간을 공유하므로 생성/소멸 비용이 낮다.

---

## 컨텍스트 스위칭 비용

CPU가 스레드를 전환할 때 발생하는 오버헤드.

| 항목 | 설명 |
|------|------|
| 레지스터 저장/복원 | CPU 레지스터 수십 개 |
| 캐시 무효화 | L1/L2 캐시 오염 → 캐시 미스 증가 |
| TLB 플러시 | 프로세스 전환 시 (스레드 전환엔 없음) |
| 커널 진입 비용 | 유저 모드 → 커널 모드 전환 |

> 스레드가 많을수록 컨텍스트 스위칭 비용이 커진다. → Thread-per-request 모델의 근본적 한계

---

## 스레드 모델 3종

### 1:1 모델 (OS Thread)
```
유저 스레드 1 ─── OS 스레드 1
유저 스레드 2 ─── OS 스레드 2
```
- 멀티코어 완전 활용, 생성 비용 높음
- 사용: Java Thread (Loom 이전), C pthread

### N:1 모델 (Green Thread)
```
유저 스레드 1~N ─── OS 스레드 1개
```
- 대량 생성 가능, 멀티코어 활용 불가
- 하나 블로킹 시 전체 멈춤

### M:N 모델 (Hybrid) ← 현대 표준
```
M개 유저 스레드 ─── N개 OS 스레드 (N = CPU 코어 수)
```
- 멀티코어 활용 + 대량 생성 모두 가능
- 사용: **Go Goroutine, Rust Tokio, Kotlin Coroutine**

---

## 스레드 안전성 — 데이터 레이스

```
스레드 A: counter 읽기(0) → +1 → 쓰기(1)
스레드 B: counter 읽기(0) → +1 → 쓰기(1)  ← A보다 먼저 완료
결과: 1  (기대값: 2)
```

### 해결책

| 방법 | 언어 예시 |
|------|----------|
| Mutex | `tokio::sync::Mutex` (Rust) |
| Atomic | `AtomicI32`, `sync/atomic` (Go) |
| Channel | Go channel, Rust mpsc |
| Immutability | Rust `&T` (읽기 참조) |

> **Go**: "공유해서 통신하지 말고, 통신해서 공유하라"  
> **Rust**: 컴파일러가 데이터 레이스를 원천 차단

---

## 스레드 풀 패턴

스레드 생성/소멸 비용을 줄이기 위해 미리 생성해두는 패턴.

| 런타임 | 구현 |
|--------|------|
| Tokio | Worker(CPU 수) + Blocking Pool(max 512) |
| Go runtime | GOMAXPROCS 개수의 OS Thread |
| Java | `ForkJoinPool`, `ThreadPoolExecutor` |

---

## 관련 노트

- [[Async Programming - Overview]] — 비동기 프로그래밍 개요
- [[Async Programming - Scheduler]] — 스레드 스케줄링
- [[Async Programming - IO Multiplexing]] — 논블로킹 I/O
