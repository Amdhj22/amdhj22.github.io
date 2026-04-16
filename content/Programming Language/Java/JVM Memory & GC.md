---
created: '2026-04-16 10:00'
tags:
  - til
  - java
  - jvm
  - memory
  - gc
  - thread
publish: true
---

## 개요

JVM 메모리 구조와 GC, Process vs Thread.

## 메모리 구조

| 영역 | 저장 대상 | 스레드 공유 |
|------|----------|:---------:|
| **메서드** | 클래스, static, 상수 (메타데이터) | O |
| **힙** | `new`로 생성된 객체, 배열 | O |
| **스택** | 지역 변수, 매개변수, Stack Frame | X (스레드별) |

## GC (Garbage Collection)

힙 영역에서 사용되지 않는 객체를 자동 탐지/제거 → 메모리 누수 방지.

| | Stack Overflow | OOM |
|---|---|---|
| 메모리 | Stack | Heap |
| 원인 | Call Stack 초과 (무한 재귀) | 할당 후 미해제 |

## Process vs Thread

| | Process | Thread |
|---|---|---|
| 메모리 | 독립 | 공유 |
| 격리 | 완전 격리, IPC 필요 | 같은 프로세스 내 |
| 용도 | 프로그램 단위 | 병렬 처리 단위 |

**Thread-safe**: 멀티 스레드에서 동시 접근해도 문제 없는 상태.
→ 해결 기법은 [[Multi-Thread 동시성]] 참고.

---

**Related**: [[Language Basics]] | [[Multi-Thread 동시성]]
