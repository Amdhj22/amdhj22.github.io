---
created: '2026-04-16 10:00'
tags:
  - til
  - java
  - oop
  - interface
  - abstract
publish: true
---

## 개요

Java OOP 4대 특성과 인터페이스 vs 추상 클래스.

## 4대 특성

| 특성 | 설명 |
|------|------|
| **추상화** | 핵심 개념만 추출하여 모델링 |
| **캡슐화** | 데이터 + 메서드 묶음, 접근 제한 |
| **상속** | 부모 속성/메서드를 자식이 물려받음 |
| **다형성** | 같은 인터페이스, 다른 동작 (Overriding/Overloading) |

## 인터페이스 vs 추상 클래스

| | 인터페이스 | 추상 클래스 |
|---|---|---|
| 상속 | **다중** 가능 | 단일만 |
| 메서드 | 추상 메서드 (Java 8+ default) | 일반 + 추상 |
| 용도 | **확장** (기능 명세) | **공통** (코드 재사용) |

```java
public abstract class Vehicle {
    public void accel() { /* 공통 구현 */ }
    public abstract void lightOn(); // 강제 구현
}
public interface AirConditioner {
    void airConditionerOn(); // 기능 명세
}
public class Tesla extends Vehicle implements AirConditioner { ... }
```

## Overloading vs Overriding

| | Overloading | Overriding |
|---|---|---|
| 정의 | 같은 이름, 다른 파라미터 | 부모 메서드 재정의 |
| 바인딩 | 컴파일 타임 | 런타임 |

---

**Related**: [[Language Basics]] | [[JVM Memory & GC]]
