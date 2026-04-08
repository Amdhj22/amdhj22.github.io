---
created: '2026-04-07 17:00'
tags:
  - til
  - rust
  - overview
publish: true
---

## Rust란?

메모리 안전성과 고성능을 GC 없이 달성하는 시스템 프로그래밍 언어. Linux 커널, Android, Windows 드라이버에도 채택됨.

## 핵심 특징

### Ownership + Borrowing + Lifetime

컴파일 타임에 메모리 오류를 완전히 차단. GC 없이 메모리 안전성 보장.

```rust
let s1 = String::from("hello");
let s2 = s1;            // s1 소유권 이동 (move)
// println!("{}", s1);  // 컴파일 에러
```

### Zero-Cost Abstractions

iterator, generic 등 고수준 추상화를 써도 런타임 오버헤드 없음. C/C++ 수준 성능.

### Fearless Concurrency

데이터 레이스를 컴파일 타임에 방지. `Send` / `Sync` trait으로 스레드 안전성 보장.

### Null 없음

`Option<T>` / `Result<T, E>`로 null과 에러를 타입 시스템에서 강제 처리.

## Go vs Rust

| | Go | Rust |
|---|---|---|
| 메모리 관리 | GC | Ownership |
| 성능 | 빠름 | 더 빠름 (GC pause 없음) |
| 학습 곡선 | 완만 | 가파름 |
| 동시성 | goroutine (런타임) | 컴파일타임 보장 |
| 주 용도 | 서버, DevOps 툴 | 시스템, Wasm, 임베디드 |

## DevOps 관점

- `ripgrep`, `fd`, `bat` 등 유명 CLI 툴이 Rust 기반
- `kube-rs` 크레이트로 K8s Operator 개발 가능
- 단일 바이너리 + 낮은 메모리 → 컨테이너 이미지 경량화에 유리
- WebAssembly 런타임(Wasmtime) → 컨테이너 대안

## 참고

- [The Book](https://doc.rust-lang.org/book/)
- [Rustlings](https://github.com/rust-lang/rustlings)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
