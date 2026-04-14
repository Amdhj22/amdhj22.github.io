---
created: '2026-04-14 00:00'
updated: '2026-04-14 00:00'
tags:
  - til
  - database
  - postgresql
  - locking
  - concurrency
publish: true
---

## 개요

PostgreSQL에서 동시 접근 시 데이터 정합성을 보장하는 두 가지 핵심 패턴:
- **Pessimistic Locking** — `SELECT FOR UPDATE`로 행 잠금
- **Optimistic Locking** — 조건부 `UPDATE`로 충돌 감지

## Pessimistic Locking: SELECT FOR UPDATE

### 기본

```sql
BEGIN;
SELECT * FROM job WHERE status = 'pending'
  FOR UPDATE;              -- 다른 TX는 이 행 수정 대기
-- 작업 수행
UPDATE job SET status = 'processing' WHERE id = $1;
COMMIT;
```

- 선택된 행에 **row-level exclusive lock** 획득
- 다른 트랜잭션이 같은 행을 `SELECT FOR UPDATE` / `UPDATE` 하면 **대기**
- `COMMIT` 또는 `ROLLBACK` 시 락 해제

### SKIP LOCKED (Job Queue 패턴)

```sql
BEGIN;
SELECT * FROM job
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED   -- 이미 잠긴 행은 건너뜀
  LIMIT 10;
-- 처리
COMMIT;
```

- 여러 worker가 동시에 job을 가져갈 때 **경합 없이 분배**
- 잠긴 행을 기다리지 않고 다음 행으로 넘어감
- River, pgq, Que 등 PostgreSQL 기반 Job Queue의 핵심 메커니즘

### NOWAIT

```sql
SELECT * FROM account WHERE id = $1
  FOR UPDATE NOWAIT;       -- 잠긴 행이면 즉시 에러
```

- 락 대기 없이 즉시 실패 (`ERROR: could not obtain lock`)
- 응답 시간이 중요한 API에서 유용

### 비교

| 옵션 | 잠긴 행 만나면 | 용도 |
|------|--------------|------|
| `FOR UPDATE` | 대기 | 일반적인 동시성 제어 |
| `FOR UPDATE SKIP LOCKED` | 건너뜀 | Job Queue, worker 분배 |
| `FOR UPDATE NOWAIT` | 즉시 에러 | 빠른 실패가 필요한 API |

## Optimistic Locking: 조건부 UPDATE

### 기본

```sql
-- 1단계: 현재 상태 조회
SELECT status, updated_at FROM workflow WHERE id = $1;
-- status='PENDING', updated_at='2026-04-14 10:00:00'

-- 2단계: 기대값 일치할 때만 업데이트
UPDATE workflow
SET status = 'PROCESSING', updated_at = now()
WHERE id = $1
  AND status = 'PENDING'          -- 기대값
  AND updated_at = '2026-04-14 10:00:00';  -- 버전 체크

-- RowsAffected == 0 이면 다른 TX가 먼저 변경 → 충돌 감지
```

### version 컬럼 방식

```sql
UPDATE account
SET balance = balance - 100, version = version + 1
WHERE id = $1 AND version = $2;
```

- `version` 정수 컬럼으로 변경 감지
- `updated_at` 타임스탬프보다 정밀 (timestamp 동시 충돌 가능성 제거)

### Go 구현 패턴

```go
tag, err := pool.Exec(ctx, `
    UPDATE workflow SET status=$1, updated_at=now()
    WHERE id=$2 AND hospital_id=$3 AND status=$4
`, nextStatus, id, hospitalID, expectedStatus)

if tag.RowsAffected() == 0 {
    return ErrConflict  // 충돌 → 재시도 또는 클라이언트에 409
}
```

## Pessimistic vs Optimistic

| | Pessimistic | Optimistic |
|-|-------------|-----------|
| 락 시점 | 읽기 시 즉시 | 쓰기 시 검증 |
| 충돌 빈도 높을 때 | 유리 (대기로 순차 처리) | 불리 (재시도 반복) |
| 충돌 빈도 낮을 때 | 불필요한 락 오버헤드 | 유리 (락 없음) |
| 데드락 위험 | 있음 (순서 주의) | 없음 |
| 대표 사례 | Job Queue, 재고 차감 | 상태 전이, 게시글 수정 |

## TOCTOU 방지

**TOCTOU** (Time of Check, Time of Use): 확인 시점과 사용 시점 사이에 상태가 변하는 버그.

```
❌ 위험한 패턴
1. SELECT status FROM workflow WHERE id=$1  -- 'PENDING' 확인
2. if status == 'PENDING':                   -- 여기서 다른 TX가 변경 가능
3.   UPDATE ... SET status='PROCESSING'      -- 잘못된 전이 발생

✅ 안전한 패턴
1. UPDATE ... SET status='PROCESSING'
   WHERE id=$1 AND status='PENDING'          -- 확인+변경 원자적
2. RowsAffected == 0 → 충돌 처리
```

## 주의사항

- `FOR UPDATE`는 인덱스 스캔 결과에 대해 락을 건다 — 풀스캔이면 불필요한 행까지 잠길 수 있음
- `SKIP LOCKED` 사용 시 `ORDER BY`와 함께 써야 공정한 분배 가능
- Optimistic Locking 실패 시 클라이언트에 `409 Conflict` 반환이 표준
- 두 패턴을 혼용 가능: worker 간엔 Pessimistic, API 요청엔 Optimistic

---

**Related**: [[SQL]] | [[Database]]
