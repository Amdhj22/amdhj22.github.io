---
created: '2026-04-09 09:00'
tags:
  - til
  - database
  - nosql
  - mongodb
  - dynamodb
publish: true
---

## 개요

NoSQL(Not Only SQL)은 스키마 고정 없이 유연한 데이터 모델을 제공하는 비관계형 DB.  
수평 확장(sharding)과 고가용성에 유리.

## 종류별 특징

| 종류 | 특징 | 대표 제품 |
|------|------|-----------|
| **Document** | JSON/BSON 형태 문서 저장, 유연한 스키마 | MongoDB, CouchDB |
| **Key-Value** | 단순 키-값 쌍, 초고속 조회 | Redis, DynamoDB |
| **Wide-Column** | 행마다 컬럼 수 다름, 시계열/로그에 강함 | Cassandra, HBase |
| **Graph** | 노드-엣지 관계 표현, 소셜/추천에 강함 | Neo4j, Amazon Neptune |

## CAP 이론

분산 시스템에서 세 가지를 동시에 만족할 수 없음.

```
C (Consistency)  — 모든 노드가 동일한 데이터
A (Availability) — 항상 응답 반환
P (Partition Tolerance) — 네트워크 분단 시에도 동작
```

- NoSQL 대부분: **AP** (가용성 + 분단 허용) → Eventual Consistency
- RDBMS 대부분: **CP** (일관성 + 분단 허용)

## BASE vs ACID

| ACID | BASE |
|------|------|
| 강한 일관성 | 결과적 일관성(Eventual Consistency) |
| 트랜잭션 보장 | 가용성 우선 |
| RDBMS | NoSQL |

## MongoDB 핵심

```js
// 문서 삽입
db.orders.insertOne({ userId: "u1", amount: 5000, status: "pending" })

// 조회 + 정렬 + 제한
db.orders.find({ status: "pending" }).sort({ createdAt: -1 }).limit(10)

// 인덱스 생성
db.orders.createIndex({ userId: 1, createdAt: -1 })

// Aggregation Pipeline
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])
```

## 언제 NoSQL을 선택할까

- 스키마가 자주 바뀌거나 비정형 데이터
- 수평 확장이 필요한 대용량 트래픽
- 시계열, 이벤트 로그, 세션 데이터
- 초저지연 Key-Value 조회

## 주의사항

- JOIN 없음 → 데이터 중복 설계 필요 (denormalization)
- 트랜잭션 지원 제한적 (MongoDB 4.0+ 다중 문서 트랜잭션 지원)
- 쿼리 유연성 RDBMS보다 낮음

---

**Related**: [[Database]] | [[SQL]] | [[Redis]]
