---
createdAt: '2026-04-07 17:00'
tags:
  - til
  - go
  - context
publish: true
---

## 개요

`context.Context`는 goroutine 트리 전체에 취소 신호, 타임아웃, 값을 전파하는 메커니즘. 함수 첫 번째 인자로 전달하는 것이 관례.

```go
func DoSomething(ctx context.Context, ...) error
```

## 생성

```go
ctx := context.Background()    // 최상위 (main, 테스트)
ctx := context.TODO()          // 아직 결정 안 됨 (임시)

ctx, cancel := context.WithCancel(parent)
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
ctx, cancel := context.WithDeadline(parent, time.Now().Add(5*time.Second))
defer cancel() // 항상 cancel() 호출 필수 — 리소스 누수 방지
```

## 취소 신호 수신

```go
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("cancelled:", ctx.Err())
            return
        default:
            // 작업 수행
        }
    }
}
```

## 값 전달 (제한적으로만)

```go
type key string
ctx = context.WithValue(ctx, key("requestID"), "abc-123")
v := ctx.Value(key("requestID")).(string)
```

> request-scoped 데이터만 전달할 것. 함수 파라미터로 전달 가능한 값은 context에 넣지 말 것.

## HTTP 서버 패턴

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    result, err := db.QueryContext(ctx, query) // 클라이언트 연결 끊기면 자동 취소
}
```

## context.Err()

| 값 | 의미 |
|---|---|
| `nil` | 아직 유효 |
| `context.Canceled` | `cancel()` 호출됨 |
| `context.DeadlineExceeded` | 타임아웃 만료 |
