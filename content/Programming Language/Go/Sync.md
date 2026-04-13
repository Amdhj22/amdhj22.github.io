---
created: '2026-04-13 17:52'
updated: '2026-04-13 17:52'
publish: true
tags:
  - til
  - go
  - sync
  - concurrency
---

## 개요

`sync` 패키지는 공유 메모리를 여러 goroutine이 안전하게 접근하도록 보호하는 도구 모음.

## Mutex / RWMutex

```go
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()
// critical section

// 읽기 많고 쓰기 드문 경우
var rw sync.RWMutex
rw.RLock(); defer rw.RUnlock()  // 읽기: 동시 허용
rw.Lock();  defer rw.Unlock()   // 쓰기: 독점
```

## Once — 딱 한 번만 실행

```go
var once sync.Once
once.Do(func() {
    // 싱글톤 초기화 등. 여러 goroutine이 호출해도 1회만 실행
})
```

## Map — 동시성 안전한 map

```go
var m sync.Map
m.Store("key", "value")
v, ok := m.Load("key")
m.Range(func(k, v any) bool {
    fmt.Println(k, v)
    return true
})
```

> 일반 `map`은 concurrent access 시 panic. `sync.Map`은 read-heavy에 최적화.

## Pool — 객체 재사용

```go
pool := sync.Pool{
    New: func() any { return &MyStruct{} },
}
obj := pool.Get().(*MyStruct)
defer pool.Put(obj)
```

> GC 압박 감소. 고트래픽 서비스에서 유효 (Prometheus, fasthttp 내부 사용).

## 선택 기준

| 상황 | 도구 |
|------|------|
| 복잡한 구조체 보호 | Mutex |
| 읽기 >> 쓰기 | RWMutex |
| goroutine 완료 대기 | WaitGroup |
| 싱글톤 초기화 | Once |
| 동시 접근 map | sync.Map |
| 객체 재사용 | Pool |
| 단순 숫자/플래그 | → atomic |
