---
created: '2026-04-13 17:52'
publish: true
tags:
  - til
  - go
  - concurrency
  - goroutine
  - channel
  - sync
  - atomic
updated: '2026-04-13 17:52'
---

## 핵심 개념 분리

```
goroutine   → 실행 단위  ("누가 실행하느냐")
channel     → 통신 수단  ("어떻게 전달하느냐")
sync/atomic → 동기화 수단 ("어떻게 보호하느냐")
```

goroutine은 항상 쓰는 것. **"어떻게 조율하느냐"** 가 선택의 문제다.

## 판단 기준

| 상황 | 선택 | 근거 |
|------|------|------|
| goroutine 간 데이터 이동 | channel | 소유권 이전, 파이프라인 |
| 공유 구조체 보호 | Mutex | 복잡한 상태, 동시 접근 |
| 단순 숫자/플래그 | atomic | lock-free, 빠름 |
| goroutine 완료 대기 | WaitGroup | 그게 목적 |
| 취소/타임아웃 전파 | context | 표준 패턴 |

## 소유권 모델

```
소유권 이전 → channel  (생산자가 보내면 더 이상 안 건드림)
소유권 공유 → sync     (여러 goroutine이 동시에 같은 데이터 필요)
```

## 혼합 사용 예시

실제 코드에서는 셋 다 함께 쓰는 게 자연스럽다.

```go
type WorkerPool struct {
    jobs    chan Job       // channel: 작업 전달
    running atomic.Bool   // atomic: 빠른 상태 체크
    mu      sync.RWMutex  // Mutex: 내부 상태 보호
    workers map[int]*Worker
}

func (p *WorkerPool) Submit(job Job) error {
    if !p.running.Load() { // atomic: lock 없이 체크
        return ErrPoolStopped
    }
    p.jobs <- job          // channel: 소유권 이전
    return nil
}
```

## 흔한 실수

```go
// ❌ channel로 카운터 올리기 → atomic 쓰면 됨
ch := make(chan int, 1); ch <- 0; v := <-ch; ch <- v+1

// ❌ Mutex로 파이프라인 → polling 필요, channel이 자연스러움
```
