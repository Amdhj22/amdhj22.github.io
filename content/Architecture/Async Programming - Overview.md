---
created: '2026-04-10 00:00'
tags:
  - til
  - async
  - concurrency
  - architecture
publish: true
---

# 비동기 프로그래밍이란?

> 상세 레퍼런스: [[Resources/Development/Async Programming/Overview|Async Programming Overview]]

---

## 핵심 정의

작업의 완료를 **기다리지 않고** 다른 작업을 먼저 처리하는 프로그래밍 방식.  
I/O 대기 시간이 긴 환경에서 CPU 낭비를 없애기 위해 등장했다.

---

## 자주 혼동하는 개념 구분

**비동기 ≠ 논블로킹** — 레이어가 다르다.

| 개념 | 설명 |
|------|------|
| **비동기** | 완료 통보 방식 (언제 결과를 받을지) |
| **논블로킹** | I/O 호출 동작 방식 (시스템 콜이 즉시 반환하는지) |

```
블로킹 + 동기:     read() 호출 → 데이터 올 때까지 대기 → 반환
논블로킹 + 동기:   read() → EAGAIN → 폴링 반복 → 반환
논블로킹 + 비동기: epoll 등록 → 이벤트 발생 시 콜백/재개
```

---

## 동시성 vs 병렬성

| | 동시성 (Concurrency) | 병렬성 (Parallelism) |
|---|---|---|
| 정의 | 여러 작업을 **번갈아** 처리 | 여러 작업을 **동시에** 처리 |
| 코어 수 | 1개로도 가능 | 멀티코어 필요 |
| 예시 | 이벤트 루프, 코루틴 | 멀티스레드, GPU 연산 |
| 목적 | I/O bound 효율화 | CPU bound 가속 |

> 비동기 프로그래밍은 주로 **동시성(Concurrency)** 문제를 다룬다.

---

## Thread-per-request의 한계

```
요청 1000개 → 스레드 1000개
스레드 1개 = ~1MB 스택 → 1GB 메모리 소비
+ 컨텍스트 스위칭 오버헤드 폭증
```

→ 이벤트 루프 + 비동기 I/O로 해결: 스레드 수십 개로 수천 요청 처리 가능

---

## 언어별 비동기 모델 비교

| 언어 | 모델 | 런타임 | 특징 |
|------|------|--------|------|
| Go | Goroutine | 내장 | M:N 스레드, 채널 기반 통신 |
| Rust | Future + async/await | 선택 (Tokio) | 컴파일 타임 안전성, Zero-cost |
| Kotlin | Coroutine | 내장 (kotlinx) | 구조적 동시성, JVM 위 |
| Java | Virtual Thread | JVM (Project Loom) | 기존 동기 코드 그대로 활용 |
| Python | asyncio | 내장 | GIL로 진정한 병렬 불가 |
| Node.js | Event Loop | V8 + libuv | 싱글 스레드, 콜백/Promise |

---

## 비동기 패턴의 역사

```
1세대: 콜백 → 콜백 지옥 문제
2세대: Promise/Future → 체이닝 가능, 여전히 복잡
3세대: async/await → 동기 코드처럼 읽히는 비동기
현재:  구조적 동시성 (Kotlin, Swift) → 태스크 생명주기를 부모-자식 관계로 관리
```

---

## 관련 노트

- [[Async Programming - Thread]] — 스레드 모델, 컨텍스트 스위칭
- [[Async Programming - Scheduler]] — OS/런타임 스케줄러
- [[Async Programming - IO Multiplexing]] — epoll, 이벤트 루프
- [[Resources/TIL/Programming Language/Rust/Tokio|Tokio]] — Rust 비동기 런타임
