---
created: '2026-04-13 15:31'
updated: '2026-04-13 15:31'
tags:
  - til
  - redis
  - cache
  - eviction
publish: true
---

## maxmemory 미설정의 위험성

- 32bit: 기본 3GB, 64bit: 기본 0 (무제한)
- 물리 메모리 초과 시 스왑 영역까지 사용 → 성능 급격히 저하

```bash
# redis.conf
maxmemory 100mb
maxmemory-policy allkeys-lru
```

## Eviction Policy 종류

`maxmemory` 초과 시 어떤 키를 제거할지 결정하는 정책.

| 정책 | 대상 | 알고리즘 |
|------|------|----------|
| `noeviction` | — | 에러 반환 (삭제 없음) |
| `allkeys-lru` | 전체 키 | 가장 오래 사용 안 된 것 제거 |
| `volatile-lru` | TTL 설정된 키 | 가장 오래 사용 안 된 것 제거 |
| `allkeys-lfu` | 전체 키 | 사용 빈도 가장 낮은 것 제거 |
| `volatile-lfu` | TTL 설정된 키 | 사용 빈도 가장 낮은 것 제거 |
| `allkeys-random` | 전체 키 | 무작위 제거 |
| `volatile-random` | TTL 설정된 키 | 무작위 제거 |
| `volatile-ttl` | TTL 설정된 키 | 만료 시간 가장 짧은 것 제거 |

## LRU vs LFU

| | LRU | LFU |
|-|-----|-----|
| 기준 | 마지막 사용 시간 | 사용 빈도 |
| 특징 | 최근에 접근한 것 보존 | 자주 쓰는 것 보존 |
| 단점 | 일시적 대량 접근에 취약 | 초기 빈도 낮은 새 키 불리 |

![[lru-algorithm.png]]

![[lfu-algorithm.png]]

Redis LRU는 정확한 구현 대신 **근사 LRU** 사용.  
`maxmemory-samples` 옵션으로 샘플 수 조정 — 많을수록 정밀하지만 메모리 더 사용.

## 정책 선택 기준

```
캐시 용도 (전체 키가 캐시)  → allkeys-lru 또는 allkeys-lfu
일부만 캐시 (TTL 구분)      → volatile-lru
접근 패턴이 균일             → allkeys-random (오버헤드 최소)
만료 시간 기반 정리          → volatile-ttl
쓰기 실패 허용 안 됨         → noeviction (메모리 관리 직접)
```

---

**Related**: [[Redis]] | [[Database]]
