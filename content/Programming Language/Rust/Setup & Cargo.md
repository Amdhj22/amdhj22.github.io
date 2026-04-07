---
createdAt: '2026-04-07 17:00'
tags:
  - til
  - rust
  - cargo
  - setup
publish: true
---

## 설치

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustup component add rust-analyzer  # LSP
rustup component add rustfmt        # 포매터
rustup component add clippy         # 린터

rustup update   # 업데이트
```

## 프로젝트 생성

```bash
cargo new hello_rust        # 바이너리
cargo new --lib mylib       # 라이브러리
```

```
hello_rust/
├── Cargo.toml   # 패키지 메타데이터 + 의존성 (go.mod 역할)
├── Cargo.lock   # 의존성 락파일
└── src/
    └── main.rs
```

## Cargo.toml

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
anyhow = "1.0"
```

## 주요 명령어

```bash
cargo build             # 빌드 (debug)
cargo build --release   # 빌드 (최적화)
cargo run               # 빌드 + 실행
cargo test              # 테스트
cargo clippy            # 린트 (-- -D warnings 권장)
cargo fmt               # 포매팅
cargo doc --open        # 문서 생성
cargo add serde --features derive  # 의존성 추가
```

## 자주 쓰는 Crate

| 용도 | Crate |
|---|---|
| 직렬화 | `serde`, `serde_json` |
| 비동기 런타임 | `tokio` |
| 에러 처리 (바이너리) | `anyhow` |
| 에러 처리 (라이브러리) | `thiserror` |
| 로깅 | `tracing` |
| CLI | `clap` |
| HTTP 클라이언트 | `reqwest` |
| K8s 클라이언트 | `kube` |
| DB | `sqlx` |
