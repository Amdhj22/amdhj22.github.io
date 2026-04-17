---
created: '2026-04-17 14:15'
publish: true
tags:
  - til
  - go
  - errgroup
  - concurrency
  - goroutine
  - pipeline
  - fan-out
  - panic
updated: '2026-04-17 14:15'
---

## 한 줄 요약

`errgroup`은 **에러 수집 + context 취소 전파 + 동시성 제한**이 내장된 goroutine 그룹. `sync.WaitGroup`의 상위 호환.

## WaitGroup vs errgroup

| | `WaitGroup` | `errgroup` |
|---|---|---|
| 에러 수집 | X | O (첫 에러) |
| 취소 전파 | X | `WithContext` 시 O |
| 동시성 제한 | X | `SetLimit` 내장 |

## 기본 사용

```go
g, ctx := errgroup.WithContext(ctx)

for _, url := range urls {
    url := url
    g.Go(func() error {
        return fetch(ctx, url) // 에러 반환 시 ctx가 cancel됨
    })
}
return g.Wait() // 첫 번째 non-nil 에러 반환
```

## 핵심 규칙

- **`g.Wait()`은 첫 에러만 반환** — 모든 에러 필요하면 `errors.Join` + 직접 수집
- **내부 함수는 ctx를 반드시 전달/체크** — 안 그러면 취소 전파 무의미
- **Wait 이후 ctx 재사용 금지** — 이미 cancel 상태
- **`SetLimit(N)`으로 동시성 제한** — `g.Go()`가 자리 날 때까지 블로킹, non-blocking은 `g.TryGo()`

## 실전 패턴

### Pipeline (producer → transform → consumer)

```go
g, ctx := errgroup.WithContext(ctx)
ch := make(chan Item)

g.Go(func() error {
    defer close(ch) // producer가 close 책임
    for _, item := range items {
        select {
        case ch <- item:
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return nil
})

g.Go(func() error {
    for item := range ch {
        if err := process(item); err != nil {
            return err
        }
    }
    return nil
})

return g.Wait()
```

**규칙**: 모든 send/receive는 `ctx.Done()`과 select. 안 그러면 leak.

### Fan-Out (여러 worker가 같은 channel 소비)

```go
const numWorkers = 10
workerWg := sync.WaitGroup{}

for i := 0; i < numWorkers; i++ {
    workerWg.Add(1)
    g.Go(func() error {
        defer workerWg.Done()
        for job := range jobCh {
            ...
        }
        return nil
    })
}

// 모든 worker 끝나면 resultCh 닫기 (별도 goroutine 필요)
go func() {
    workerWg.Wait()
    close(resultCh)
}()
```

**주의**: 공유 송신 채널은 `g.Wait()`으로 닫으면 데드락. 별도 `sync.WaitGroup`으로 닫아야 함.

### Panic 처리 (errgroup은 panic을 안 잡음)

```go
func goSafe(g *errgroup.Group, fn func() error) {
    g.Go(func() (err error) {
        defer func() {
            if r := recover(); r != nil {
                err = fmt.Errorf("panic: %v\n%s", r, debug.Stack())
            }
        }()
        return fn()
    })
}
```

recover 후 panic이 에러로 변환돼 ctx가 정상 cancel됨. `runtime.Goexit`는 못 잡는다.

## DevOps 관점

- **타임아웃**: 상위 ctx에 `WithTimeout`, k8s `terminationGracePeriodSeconds`보다 짧게
- **SetLimit은 필수**: 수천 개 goroutine 대비 DB 커넥션, FD, HTTP pool이 먼저 바닥남
- **panic은 metric으로**: `panics_total` counter + structured log, 아니면 좀비 상태 방치
- **goroutine leak 탐지**: `go.uber.org/goleak` 테스트 + `go_goroutines` Prometheus gauge
- **Go 1.25+**: `GOMAXPROCS` k8s CPU limit 자동 매칭, 이전 버전은 `automaxprocs`
- **pipeline 버퍼**: `make(chan T, N)`의 N은 메모리 상한 — pod memory limit 계산에 포함
- **멱등성**: cancel 시 부분 실패 불가피 → 태스크는 멱등하게, 아니면 saga 패턴

## 관련 링크

- [[Concurrency]]
- [[Goroutine]]
- [[Channel]]
- [[Context]]
- [[Sync]]
