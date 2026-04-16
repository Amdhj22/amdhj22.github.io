---
created: '2026-04-16 10:00'
tags:
  - til
  - java
  - concurrency
  - synchronized
  - volatile
  - cas
publish: true
---

## 개요

Java 멀티스레드 가시성/동시 접근 문제와 해결: synchronized, volatile, Atomic/CAS.

## 핵심 문제

- **가시성**: 스레드가 CPU Cache에 값 캐싱 → Main Memory와 불일치
- **동시 접근**: 여러 스레드 동시 수정 → 마지막 연산만 반영

## 해결 기법

| | synchronized | volatile | Atomic (CAS) |
|---|---|---|---|
| 가시성 해결 | O | O | O |
| 동시 접근 해결 | O | X | O |
| 성능 | 낮음 (Lock) | 높음 | 높음 (Lock-free) |
| 용도 | 복합 연산 보호 | 단순 플래그 | 단일 변수 원자적 연산 |

## CAS (Compare And Swap)

```
1. CPU Cache 값 vs Main Memory 값 비교
2. 일치 → 새 값으로 교체
3. 불일치 → 실패, 재시도
```

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet(); // thread-safe, lock-free
```

---

**Related**: [[JVM Memory & GC]] | [[Language Basics]]
