---
created: '2026-04-10 00:00'
publish: true
tags:
  - til
  - async
  - io-multiplexing
  - epoll
  - event-loop
  - os
---

# I/O Multiplexing — epoll, kqueue, 이벤트 루프

> 상세 레퍼런스: [[Resources/Development/Async Programming/IO Multiplexing|IO Multiplexing (상세 레퍼런스)]]

---

## 핵심 개념

하나의 스레드로 **여러 I/O 이벤트를 동시에 감시**하는 기법.

```
Thread-per-connection: 소켓 1000개 → 스레드 1000개 → 대기 낭비
I/O Multiplexing:      소켓 1000개 → 스레드 1개(epoll) → 이벤트 발생 시만 처리
```

---

## select / poll / epoll / kqueue 비교

| | select | poll | **epoll** | kqueue |
|---|---|---|---|---|
| 플랫폼 | 전 Unix | 전 Unix | **Linux** | macOS/BSD |
| fd 제한 | 1024개 | 없음 | 시스템 한도 | 시스템 한도 |
| 이벤트 확인 | O(n) 전체 순회 | O(n) 전체 순회 | **O(이벤트 수)** | O(이벤트 수) |
| 커널 복사 | 매번 전체 | 매번 전체 | **등록 1회** | 등록 1회 |

> **epoll이 현대 서버의 표준인 이유**: 이벤트가 발생한 fd만 반환, 커널 내부 테이블 유지로 재등록 불필요

---

## epoll 동작 방식

```c
int epfd = epoll_create1(0);
epoll_ctl(epfd, EPOLL_CTL_ADD, sock, &event);  // 등록 (1회)
epoll_wait(epfd, events, MAX_EVENTS, timeout); // 이벤트 발생 fd만 반환
```

사용처: **Nginx, Redis, Tokio(mio), Go netpoll**

---

## Level Trigger vs Edge Trigger

| | Level Trigger (LT) | Edge Trigger (ET) |
|--|-------------------|--------------------|
| 통보 시점 | 데이터 있는 동안 계속 | 상태 변화 시 1회만 |
| 처리 방식 | 편하지만 중복 통보 | 효율적이지만 누락 위험 |
| 사용처 | 일반 | Nginx, 고성능 서버 |

---

## 이벤트 루프 구조

epoll 위에서 동작하는 비동기 실행 모델.

```
while true:
  events = epoll_wait()        // 이벤트 대기
  for event in events:
    callback(event)            // 핸들러 실행
  run_timers()                 // 타이머 처리
  run_microtasks()             // await 재개
```

| 런타임 | 이벤트 루프 구현 |
|--------|----------------|
| Node.js | libuv |
| Tokio | mio (epoll/kqueue 추상화) |
| Go | netpoll (내장) |
| Python asyncio | selectors |

---

## io_uring (Linux 5.1+)

epoll 다음 세대. 유저↔커널 전환을 최소화하는 공유 링 버퍼 방식.

```
기존: 매 syscall마다 유저↔커널 전환
io_uring: SQ/CQ 공유 버퍼로 배치 처리 → syscall 최소화
```

지원: `tokio-uring`(실험적), Glommio, Node.js 18+

---

## DevOps 포인트

### Nginx epoll 설정

```nginx
events {
    worker_connections 1024;
    use epoll;        # Linux 명시 설정
    multi_accept on;  # 한 번에 여러 연결 수락
}
```

### 파일 디스크립터 제한

```bash
ulimit -n  # 현재 fd 한도 확인

# systemd 서비스
[Service]
LimitNOFILE=65536

# Kubernetes: sysctls로 설정
```

Pod 내 컨테이너들이 네트워크 네임스페이스를 공유하므로 fd 사용량이 누적됨.  
고연결 서비스는 `LimitNOFILE` 명시 필수.

---

## 관련 노트

- [[Async Programming - Overview]] — 비동기 프로그래밍 개요
- [[Async Programming - Thread]] — 스레드와 블로킹 I/O
- [[Async Programming - Scheduler]] — 이벤트 루프와 스케줄러 협력
