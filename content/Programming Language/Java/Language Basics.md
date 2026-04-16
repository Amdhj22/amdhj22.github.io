---
created: '2026-04-16 10:00'
tags:
  - til
  - java
  - basics
  - generics
  - immutable
publish: true
---

## 개요

Java 언어 핵심: 컴파일 과정, 접근 제어자, 제네릭, 불변 객체, String.

## 컴파일 과정

```
.java → javac → .class (바이트코드) → Class Loader → JVM → 실행엔진 → OS 기계어
```

## 접근 제어자

| 제어자 | 같은 클래스 | 같은 패키지 | 하위 클래스 | 전체 |
|--------|:---------:|:---------:|:---------:|:----:|
| `public` | O | O | O | O |
| `protected` | O | O | O | X |
| `default` | O | O | X | X |
| `private` | O | X | X | X |

## 제네릭

컴파일 타임에 타입 안전성 보장. 컬렉션에서 꺼낼 때 형변환 불필요.

## 불변 객체

한 번 할당하면 내부 데이터 변경 불가. `String`, `Integer`, `Long` 등.
- 모든 필드 `final`, setter 없음, 클래스 `final`
- 멀티스레드 동기화 없이 공유 가능

## String

| | `"hello"` | `new String("hello")` |
|---|---|---|
| 저장 | String Constant Pool | Heap |
| 동일 문자열 | 같은 참조 | 매번 새 객체 |

| | String (불변) | StringBuilder (가변) | StringBuffer (가변) |
|---|---|---|---|
| Thread-safe | O | X | O (동기화) |
| 용도 | 고정 문자열 | Single Thread | Multi Thread |

---

**Related**: [[OOP]] | [[JVM Memory & GC]]
