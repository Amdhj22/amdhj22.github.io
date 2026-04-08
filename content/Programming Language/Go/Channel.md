---
created: '2026-04-07 17:00'
tags:
  - til
  - go
  - channel
  - concurrency
publish: true
---

## 개요

Channel은 goroutine 간 데이터를 안전하게 전달하는 통로. "메모리 공유 대신 통신으로 동기화"하는 Go의 핵심 철학.

## 생성과 송수신

```go
ch := make(chan int)       // 비버퍼 채널
ch := make(chan int, 10)   // 버퍼 채널 (10개까지 블로킹 없이 송신)

ch <- 42       // 송신 (수신자 없으면 블로킹)
v := <-ch      // 수신 (송신자 없으면 블로킹)
```

## 닫기

```go
close(ch)

// 채널이 닫힐 때까지 수신
for v := range ch {
    fmt.Println(v)
}

// 닫힘 여부 확인
v, ok := <-ch  // ok == false면 닫힘
```

## select — 여러 채널 동시 대기

```go
select {
case v := <-ch1:
    fmt.Println("ch1:", v)
case ch2 <- 99:
    fmt.Println("ch2 sent")
case <-time.After(1 * time.Second):
    fmt.Println("timeout")
default:
    fmt.Println("non-blocking")
}
```

## 방향 제한 (단방향 채널)

```go
func producer(ch chan<- int) { ch <- 1 }   // 송신 전용
func consumer(ch <-chan int) { v := <-ch } // 수신 전용
```

## 비버퍼 vs 버퍼

| | 비버퍼 | 버퍼 |
|---|---|---|
| 동기화 | 강제 (송수신 동시) | 느슨함 (버퍼 범위 내) |
| 사용처 | goroutine 동기화 신호 | 처리량 조절, 배압(backpressure) |
