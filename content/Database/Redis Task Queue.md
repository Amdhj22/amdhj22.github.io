---
created: '2026-04-16 09:00'
tags:
  - til
  - redis
  - task-queue
  - message-queue
publish: true
---

## 개요

Redis 자료구조를 활용한 Task Queue 4가지 패턴.

## 구현 방식

| 방식 | 명령어 | 영속성 | ACK | 우선순위 | 용도 |
|------|--------|--------|-----|---------|------|
| **List** | LPUSH/RPOP | O | X | X | 단순 FIFO 큐 |
| **Stream** | XADD/XREADGROUP | O | O | X | 신뢰성 있는 메시지 큐 |
| **Pub/Sub** | PUBLISH/SUBSCRIBE | X | X | X | 실시간 브로드캐스트 |
| **Sorted Set** | ZADD/ZPOPMIN | O | X | O | 우선순위/지연 실행 큐 |

## 핵심 코드

```bash
# List: 기본 큐
LPUSH queue '{"job":"process"}' && BRPOP queue 0

# Stream: ACK 지원
XADD stream * job process
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS stream >
XACK stream mygroup <id>

# Sorted Set: 우선순위 (score = 우선순위)
ZADD pq 1 '{"job":"urgent"}' && ZPOPMIN pq
```

---

**Related**: [[Redis Caching Strategy]] | [[Redis Eviction]] | [[Redis]]
