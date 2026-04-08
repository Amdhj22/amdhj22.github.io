---
created: '2026-04-07 17:00'
tags:
  - til
  - rust
  - module
  - crate
publish: true
---

## 개념 계층

```
Package (Cargo.toml)
  └── Crate (컴파일 단위)
        └── Module (코드 구조화)
```

## Crate 종류

| | Binary Crate | Library Crate |
|---|---|---|
| 루트 | `src/main.rs` | `src/lib.rs` |
| 특징 | 실행 바이너리 | 다른 프로젝트에서 사용 |

## 파일 분리

```rust
// src/utils.rs
pub fn add(a: i32, b: i32) -> i32 { a + b }
fn private_helper() {}   // pub 없음 = 외부 접근 불가

// src/main.rs
mod utils;
use utils::add;
```

## 접근 제어

```rust
pub fn open_to_all() {}          // 누구나
pub(crate) fn crate_only() {}    // 같은 crate 안에서만
pub(super) fn parent_only() {}   // 부모 모듈까지만
fn private() {}                  // 같은 모듈만
```

## Go internal vs Rust pub(crate)

| | Go `internal/` | Rust `pub(crate)` |
|---|---|---|
| 제어 방식 | 폴더명 | 키워드 |
| 범위 | `internal/` 상위 모듈만 | 같은 crate 전체 |

## Workspace (멀티 Crate)

```toml
# 루트 Cargo.toml
[workspace]
members = ["crates/core", "crates/api", "crates/cli"]
resolver = "2"
```

```
my_k8s_tool/
├── Cargo.toml
└── crates/
    ├── k8s-client/   # k8s API 래퍼 (재사용 가능)
    ├── cli/          # CLI binary
    └── daemon/       # 백그라운드 데몬
```

> 처음엔 단일 모듈로 시작, 실제로 분리 이유가 생겼을 때 crate로 올리는 게 정석.
