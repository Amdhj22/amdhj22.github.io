---
created: '2026-04-13 15:31'
tags:
  - til
  - redis
  - sentinel
  - ha
  - availability
publish: true
---

## 개요

Redis Sentinel은 Redis 고가용성(HA) 시스템.  
마스터 장애를 감지하고 자동으로 레플리카를 새 마스터로 승격시킨다.

```
주요 역할:
- 마스터/레플리카 상태 모니터링
- 장애 감지 및 자동 Failover
- 클라이언트에 새 마스터 정보 전달
```

## Failover 처리 흐름

### 1. 모니터링 (SDOWN)

각 Sentinel이 주기적으로 마스터에 ping.  
`down-after-milliseconds` 내 응답 없으면 **주관적 다운(SDOWN)** 으로 판정.

### 2. 합의 (ODOWN)

**quorum** 수 이상의 Sentinel이 SDOWN에 동의하면 **객관적 다운(ODOWN)** 으로 확정.

### 3. Failover 실행

Raft-style 투표로 리더 Sentinel 선출 후 진행:

```
1. 최적 레플리카 선택 (우선순위, replication offset 기준)
2. 선택된 레플리카에 SLAVEOF NO ONE 전송 → 마스터로 승격
3. 나머지 레플리카에 새 마스터 팔로우 지시
```

### 4. 클라이언트 알림

Sentinel이 새 마스터 정보를 업데이트.  
Sentinel-aware 클라이언트가 자동으로 재연결.

## Go FailoverClient 동작 방식

```go
import "github.com/redis/go-redis/v9"

rdb := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName:    "mymaster",
    SentinelAddrs: []string{
        "sentinel1:26379",
        "sentinel2:26379",
        "sentinel3:26379",
    },
})
```

**시작 시**: 복수 Sentinel에 접속 → 현재 마스터 주소 질의 → 마스터 연결  
**장애 시**: 연결 오류 감지 → Sentinel 재질의 → 새 마스터로 자동 재연결

## 구성 최소 요구사항

- Sentinel **3개 이상** 권장 (quorum 과반수 확보)
- Sentinel은 마스터/레플리카와 **별도 노드**에 배치

## Sentinel vs Cluster

| | Sentinel | Cluster |
|-|----------|---------|
| 목적 | HA (장애 복구) | HA + 수평 확장 |
| 샤딩 | X | O (16384 슬롯) |
| 복잡도 | 낮음 | 높음 |
| 적합한 규모 | 단일 인스턴스 HA | 대용량 분산 |

---

**Related**: [[Redis]] | [[Redis Eviction]] | [[Database]]
