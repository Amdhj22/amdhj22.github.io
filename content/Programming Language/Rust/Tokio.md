---
createdAt: '2026-04-09 18:38'
tags:
  - til
  - rust
  - tokio
  - async
  - concurrency
publish: true
---

# Tokio — Rust 비동기 런타임

> 관련 레퍼런스: [[Resources/Development/Rust/Tokio|Tokio (상세 레퍼런스)]]

---

## 핵심 개념

`async fn`만으로는 아무것도 실행되지 않는다. Tokio가 Future를 polling해서 실제로 구동한다.

- Rust의 `async fn` → 컴파일 타임에 **상태 머신(State Machine)** 으로 변환됨
- Go 고루틴처럼 런타임이 스택을 자동 관리하는 구조가 아님
- Tokio = Future들을 polling하는 실행 엔진

---

## 스레드 풀 구조 (꼭 기억할 것)

```
Worker Threads (CPU 코어 수)   ← async 작업 전용, spawn()
Blocking Thread Pool (max 512) ← 블로킹 작업 전용, spawn_blocking()
```

**Worker Thread에서 블로킹 작업 실행하면 전체 런타임이 멈춘다.**

```rust
// I/O bound → spawn
tokio::spawn(async { reqwest::get("...").await });

// CPU bound / 블로킹 → spawn_blocking
tokio::task::spawn_blocking(|| heavy_cpu_computation());
```

---

## 채널 선택 기준

Go는 `chan` 하나로 다 처리하지만, Tokio는 용도별로 명시적으로 선택한다.

| 채널 | 용도 |
|------|------|
| `mpsc` | 여러 생산자 → 한 소비자 |
| `oneshot` | 요청/응답 1회성 |
| `broadcast` | 1 → N 팬아웃 |
| `watch` | 최신 값만 유지 (설정 변경 전파) |

---

## 동시 실행 패턴

```rust
// 모두 완료 대기
let (a, b) = join!(fetch_a(), fetch_b());

// 먼저 완료되는 것만
select! {
    _ = sleep(Duration::from_millis(100)) => { /* 타임아웃 */ }
    result = fetch_data() => { /* 데이터 수신 */ }
}
```

---

## std::sync vs tokio::sync

async 환경에서 `std::sync::Mutex` 사용하면 데드락 위험 → `tokio::sync::Mutex` 사용.

---

## 추천 크레이트 조합

| 용도 | 크레이트 |
|------|---------|
| 웹 서버 | **Axum** (Tokio 팀 공식) |
| HTTP 클라이언트 | **Reqwest** |
| gRPC | **Tonic** |
| DB (async) | **SQLx** |
| 직렬화 | **Serde** |
| 관찰성 | **tracing** |

---

## DevOps 포인트

- 단일 정적 바이너리 → distroless 이미지로 ~10MB 달성 가능
- 수천 연결 시 `ulimit -n` 확인 필요 (K8s는 sysctls로 설정)
- async Task 추적 어려움 → `tracing` 크레이트 + `#[instrument]` 필수
- Worker Thread 수 조정: `tokio::runtime::Builder` 사용
