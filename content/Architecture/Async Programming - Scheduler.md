---
created: '2026-04-10 00:00'
publish: true
tags:
  - til
  - async
  - scheduler
  - os
  - goroutine
  - tokio
---

# Scheduler — OS 스케줄러와 런타임 스케줄러

> 상세 레퍼런스: [[Resources/Development/Async Programming/Scheduler|Scheduler (상세 레퍼런스)]]

---

## 두 레이어의 스케줄러

```
OS 스케줄러    → OS 스레드를 CPU 코어에 배분 (선점형)
런타임 스케줄러 → Goroutine/Task를 OS 스레드에 배분 (협력형)
```

---

## OS 스케줄러 — 선점형 (Preemptive)

타임슬라이스(1~10ms) 만료 시 OS가 강제로 스레드를 교체.

```
스레드 A: ████░░░░░░████░░░░░░████
스레드 B: ░░░░████░░░░░░████░░░░░░
           ↑ 타임슬라이스 만료 → 강제 스위칭
```

| 알고리즘 | 특징 |
|---------|------|
| Round Robin | 순서대로 동일 시간 |
| Priority | 우선순위 기반 (기아 위험) |
| CFS (Linux) | 가상 런타임 기반 공정 배분, Linux 기본 |
| MLFQ | CPU/IO bound 자동 분류 |

---

## 런타임 스케줄러 — 협력형 (Cooperative)

`await` / `yield` 지점에서 태스크가 자발적으로 제어권을 반환.

| | 선점형 (OS) | 협력형 (런타임) |
|--|------------|----------------|
| 전환 시점 | OS 강제 중단 | 태스크 자발적 양보 |
| 비용 | 무겁다 (커널 진입) | 가볍다 (유저 공간) |
| CPU 독점 위험 | 없음 | **있음** |

> **핵심 함정**: `await` 없는 무거운 연산이 Worker Thread를 독점하면 다른 모든 태스크가 멈춘다.  
> → Tokio: `spawn_blocking`, Go: `runtime.Gosched()` 로 해결

---

## Go GMP 모델

```
G (Goroutine): 실행 단위 (수백만 개 가능)
M (Machine):   OS 스레드
P (Processor): 로컬 런큐 보유, CPU 코어 수만큼

P1 [G1,G2,G3] ── M1 ── Core1
P2 [G4,G5,G6] ── M2 ── Core2
Global Queue:  [G7, G8, ...]
```

---

## Work-Stealing 알고리즘

놀고 있는 Worker가 바쁜 Worker의 큐에서 절반을 훔쳐옴.  
Go GMP, Tokio 모두 사용.

```
전: Worker1[T1,T2,T3,T4]  Worker2[]
후: Worker1[T1,T2]         Worker2[T3,T4] ← 병렬 실행
```

자신의 큐는 LIFO(앞), 훔칠 때는 FIFO(뒤) → 캐시 지역성 최적화

---

## DevOps 포인트

### Kubernetes CPU Limit과 런타임의 관계

```yaml
resources:
  limits:
    cpu: "1000m"  # 1 core 상한
```

CPU limit이 낮으면 Go `GOMAXPROCS`, Tokio Worker Thread 수가 줄어 동시성 처리 능력 저하.

```go
// Go: 컨테이너 cgroup CPU quota 자동 인식
import _ "go.uber.org/automaxprocs"
```

---

## 관련 노트

- [[Async Programming - Overview]] — 비동기 프로그래밍 개요
- [[Async Programming - Thread]] — 스레드 모델
- [[Async Programming - IO Multiplexing]] — 이벤트 루프와의 협력
