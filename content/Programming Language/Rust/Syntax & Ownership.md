---
created: '2026-04-07 17:00'
tags:
  - til
  - rust
  - syntax
  - ownership
  - trait
publish: true
---

## 변수

```rust
let x = 5;          // 불변 (기본)
let mut y = 5;      // 가변
let x = x + 1;      // shadowing 가능 (재선언)
```

## Ownership 3원칙

1. 모든 값은 하나의 owner
2. owner가 scope를 벗어나면 값 drop
3. 한 번에 하나의 owner만 존재

```rust
let s1 = String::from("hello");
let s2 = s1;           // move: s1 무효화
let s3 = s2.clone();   // 명시적 복사

let n1 = 5;
let n2 = n1;           // Copy trait → 둘 다 유효
```

## Borrowing (참조)

```rust
fn calc_length(s: &String) -> usize { s.len() }   // 불변 참조 (여러 개 가능)
fn change(s: &mut String) { s.push_str(", world"); } // 가변 참조 (단 하나만)
```

## Option과 Result

```rust
// Option: null 대신
let x: Option<i32> = Some(5);
let y = x.unwrap_or(0);

// Result: 에러 처리
fn parse(s: &str) -> Result<i32, ParseIntError> {
    s.trim().parse::<i32>()
}

// ? 연산자: 에러면 즉시 return (Go의 if err != nil { return err } 대체)
fn read_config() -> Result<Config, anyhow::Error> {
    let content = fs::read_to_string("config.toml")?;
    Ok(parse_config(&content)?)
}
```

## Enum과 패턴 매칭

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

match msg {
    Message::Quit => println!("종료"),
    Message::Move { x, y } => println!("{}, {}", x, y),
    Message::Write(text) => println!("{}", text),
}
```

## Trait (= Go interface + default 구현)

```rust
trait Animal {
    fn sound(&self);        // 필수 구현

    fn breathe(&self) {     // default 구현
        println!("...");
    }
}

impl Animal for Dog {
    fn sound(&self) { println!("멍멍"); }
}

// 정적 디스패치 (컴파일타임, 성능 최적)
fn make_sound(a: &impl Animal) { a.sound(); }

// 동적 디스패치 (런타임, Go interface처럼)
fn make_sounds(animals: Vec<Box<dyn Animal>>) { ... }
```

## derive 매크로

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct Config {
    host: String,
    port: u16,
}
```
