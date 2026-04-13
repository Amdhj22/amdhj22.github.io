---
created: '2026-04-07 17:00'
updated: '2026-04-13 17:58'
tags:
  - til
  - go
  - channel
  - concurrency
publish: true
---

## 개요

Channel은 goroutine 간 데이터를 안전하게 전달하는 통로. "메모리 공유 대신 통신으로 동기화"하는 Go의 핵심 철학.  
기본적으로 단방향 흐름 (송신 → 수신), 소유권이 이전됨. channel 자체가 동기화 역할을 함.

![[Pasted image 20240614143403.png]]

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
case v := <-ch2:
    fmt.Println("ch2:", v)
case ch3 <- data:
    fmt.Println("sent to ch3")
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

## 주요 패턴

### Fan-out (작업 분배)

```go
func fanOut(jobs <-chan Job, workerCount int) {
    var wg sync.WaitGroup
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                process(job)
            }
        }()
    }
    wg.Wait()
}
```

### Fan-in (결과 수집)

```go
func fanIn(channels ...<-chan int) <-chan int {
    merged := make(chan int)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                merged <- v
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(merged)
    }()
    return merged
}
```

## 흔한 실수

```go
// 1. nil 채널은 영원히 block
var ch chan int
ch <- 1   // deadlock!
// 단, select에서 nil 채널은 무시됨 → 의도적으로 활용 가능

// 2. 닫힌 채널에 송신 → panic
close(ch)
ch <- 1   // panic!

// 3. 닫힌 채널은 계속 수신 가능 (zero value 반환)
v, ok := <-ch  // v=0, ok=false

// 4. 송신자가 close하는 게 원칙
for v := range ch {  // close되면 자동 종료
    process(v)
}
```

## channel vs sync 선택 기준

| channel이 나은 경우 | sync가 나은 경우 |
|---|---|
| goroutine 간 데이터 파이프라인 | 단순 카운터/플래그 |
| 작업 큐 / worker pool | 복잡한 공유 상태 |
| 타임아웃, 취소 신호 | 성능 극도로 중요한 hot path |
| 소유권이 명확히 이전되는 경우 | 이미 공유된 상태를 여러 곳에서 접근 |

---

**Related**: [[Go]] | [[Goroutine]] | [[Context]]
