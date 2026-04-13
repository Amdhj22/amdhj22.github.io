---
created: '2026-04-13 17:52'
publish: true
tags:
  - til
  - go
  - atomic
  - concurrency
updated: '2026-04-13 17:52'
---

## 개요

`sync/atomic`은 Mutex 없이 하드웨어 수준의 원자적 연산을 수행. 단순 타입(숫자, bool)에만 사용 가능하지만 훨씬 빠르다.

## 기본 API (Go 1.19+ 타입 기반 권장)

```go
var counter atomic.Int64
var flag    atomic.Bool

counter.Add(1)
counter.Load()
counter.Store(100)

flag.Store(true)
flag.Load()
```

## atomic.Value — any 타입 저장

```go
var v atomic.Value
v.Store(map[string]int{"a": 1})  // 한 번 저장한 타입 고정
m := v.Load().(map[string]int)
```

> config 핫 리로드에 자주 사용. 타입 다르면 panic 주의.

## CAS (Compare And Swap)

```go
var n int64
ok := atomic.CompareAndSwapInt64(&n, 200, 300)
// n == 200이면 300으로 교체, ok=true
// lock-free 알고리즘의 핵심 연산
```

## 성능 체감

```
atomic    ~  5ns
Mutex     ~ 25ns
channel   ~ 70ns
```

> channel이 느린 게 아니라 목적이 다른 것. 채널로 카운터 올리는 건 잘못된 사용.

## 언제 쓰나

- ✅ 요청 카운터, 에러 카운터
- ✅ worker pool running/stopped 플래그
- ✅ Prometheus exporter 직접 구현 시
- ❌ 구조체, map, slice → Mutex 사용
