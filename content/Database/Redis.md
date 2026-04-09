---
created: '2026-04-09 09:00'
tags:
  - til
  - database
  - redis
  - cache
publish: true
---

## 개요

Redis(Remote Dictionary Server)는 인메모리 Key-Value 스토어.  
캐시, 세션, 메시지 큐, 분산 락 등 다양한 용도로 활용.

## 자료구조

| 타입 | 용도 | 대표 명령어 |
|------|------|-------------|
| **String** | 기본 캐시, 카운터 | `SET`, `GET`, `INCR` |
| **Hash** | 객체 저장 (필드별 접근) | `HSET`, `HGET`, `HGETALL` |
| **List** | 큐/스택, 최근 항목 | `LPUSH`, `RPOP`, `LRANGE` |
| **Set** | 중복 없는 집합, 태그 | `SADD`, `SMEMBERS`, `SINTER` |
| **Sorted Set** | 랭킹, 우선순위 큐 | `ZADD`, `ZRANGE`, `ZRANK` |
| **Stream** | 이벤트 로그, Kafka 대체 | `XADD`, `XREAD` |

## 캐시 전략

### Cache-Aside (Lazy Loading)

```
1. 캐시 조회
2. HIT  → 반환
3. MISS → DB 조회 → 캐시 저장 → 반환
```

가장 일반적. 캐시에 없는 데이터만 DB 접근.  
초기 요청은 느림 (cold start).

### Write-Through

```
쓰기 요청 → 캐시 + DB 동시 업데이트
```

캐시 항상 최신. 쓰기 지연 발생.

### Write-Behind (Write-Back)

```
쓰기 요청 → 캐시만 업데이트 → 비동기로 DB 반영
```

쓰기 성능 최고. 데이터 유실 위험.

## TTL & 만료 전략

```bash
SET session:user1 "data" EX 3600   # 1시간 TTL
TTL session:user1                   # 남은 시간 확인
PERSIST session:user1               # TTL 제거
```

### Eviction Policy

메모리 한계 도달 시 키 제거 전략 (`maxmemory-policy`):

```
noeviction       — 메모리 초과 시 에러 반환
allkeys-lru      — 전체 키 중 최근에 덜 사용된 것 제거
volatile-lru     — TTL 설정된 키 중 LRU 제거
allkeys-lfu      — 전체 키 중 가장 덜 사용된 것 제거
volatile-ttl     — TTL 가장 짧은 키 우선 제거
```

## 분산 락 (Distributed Lock)

```bash
# SET NX EX: 없을 때만 세팅 + TTL
SET lock:resource "owner_id" NX EX 30

# 락 해제 (소유자 확인 후)
# Lua 스크립트로 원자적 처리
```

- `NX` (Not Exists) 로 원자적 락 획득
- TTL 필수 — 프로세스 장애 시 데드락 방지
- 더 정교한 구현은 Redlock 알고리즘 사용

## Redis Pub/Sub vs Stream

| | Pub/Sub | Stream |
|-|---------|--------|
| 메시지 보존 | X (실시간만) | O (영속) |
| 소비자 그룹 | X | O |
| 재처리 | 불가 | 가능 |
| 용도 | 실시간 알림 | 이벤트 로그, 경량 MQ |

## 주의사항

- `KEYS *` 프로덕션 절대 금지 → `SCAN` 사용
- 큰 Value 저장 주의 (10KB 이하 권장)
- Persistence 옵션: `RDB` (스냅샷) vs `AOF` (append-only log)
- 싱글 스레드 → O(N) 명령어(SMEMBERS, LRANGE 전체 등) 주의

---

**Related**: [[Database]] | [[NoSQL]] | [[SQL]]
