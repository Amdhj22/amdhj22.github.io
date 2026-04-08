---
created: '2026-04-07 17:00'
tags:
  - til
  - go
  - goroutine
  - concurrency
publish: true
---

## 개요

Goroutine은 Go 런타임이 관리하는 경량 스레드. OS 스레드 생성 비용 없이 수천~수백만 개 동시 실행 가능.

- 모든 프로그램은 `main()` goroutine에서 시작
- `main()`이 종료되면 모든 goroutine도 즉시 종료

## 생성

```go
go funcName()       // 일반 함수
go func() {         // 익명 함수
    // ...
}()
```

## WaitGroup — goroutine 완료 대기

```go
var wg sync.WaitGroup

for i := 0; i < 3; i++ {
    wg.Add(1)
    go func(n int) {
        defer wg.Done()
        fmt.Println(n)
    }(i)
}

wg.Wait() // 모든 goroutine 완료까지 블로킹
```

## 주의사항

- goroutine 생성 시 반드시 종료 조건 명시 (고루틴 누수 방지)
- 루프 변수 캡처 주의 → 인자로 명시적 전달
- `panic`은 해당 goroutine 전체 프로그램 종료시킴 → `recover` 필요시 각 goroutine에서 직접 처리
