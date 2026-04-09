---
created: '2026-04-09 09:00'
tags:
  - til
  - database
  - sql
  - rdbms
publish: true
---

## 개요

SQL(Structured Query Language)은 관계형 데이터베이스에서 데이터를 정의·조작·제어하는 언어.

## 트랜잭션 & ACID

| 속성 | 설명 |
|------|------|
| **Atomicity** | 트랜잭션 내 모든 작업은 전부 성공하거나 전부 롤백 |
| **Consistency** | 트랜잭션 전후 DB 무결성 제약 항상 만족 |
| **Isolation** | 동시 트랜잭션은 서로 간섭하지 않음 |
| **Durability** | 커밋된 데이터는 장애 후에도 보존 |

## 격리 수준 (Isolation Level)

```
READ UNCOMMITTED  →  Dirty Read 허용 (가장 낮음)
READ COMMITTED    →  Dirty Read 방지, Non-repeatable Read 허용
REPEATABLE READ   →  같은 쿼리 결과 보장 (MySQL InnoDB 기본값)
SERIALIZABLE      →  완전 직렬화, 성능 저하 (가장 높음)
```

## 인덱스 (Index)

- **B-Tree**: 범위 조회에 유리, 대부분의 DB 기본값
- **Hash**: 등치 조회(=)에 빠름, 범위 조회 불가
- **Composite Index**: 컬럼 순서가 중요 — 카디널리티 높은 순으로 배치

```sql
-- 복합 인덱스: (user_id, created_at) 순서 의미 있음
CREATE INDEX idx_user_created ON orders(user_id, created_at);
```

### 인덱스 주의사항

- `WHERE`, `JOIN`, `ORDER BY` 컬럼에 걸기
- 과도한 인덱스 → INSERT/UPDATE/DELETE 성능 저하
- `EXPLAIN` 으로 실행 계획 반드시 확인

## N+1 문제

```
1번 쿼리로 목록 조회 → N개 결과에 대해 각각 1번씩 추가 쿼리 = N+1번
```

해결: `JOIN` 또는 `IN` 절로 배치 조회

## 정규화 vs 비정규화

| | 정규화 | 비정규화 |
|-|--------|----------|
| 목적 | 중복 제거, 무결성 | 조회 성능 향상 |
| JOIN | 많음 | 적음 |
| 적합 | OLTP (쓰기 빈번) | OLAP (읽기 빈번) |

## 주요 명령어

```sql
-- 실행 계획 확인
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;

-- 트랜잭션
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- 윈도우 함수
SELECT user_id, amount,
       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
FROM orders;
```

---

**Related**: [[Database]] | [[NoSQL]] | [[Redis]]
