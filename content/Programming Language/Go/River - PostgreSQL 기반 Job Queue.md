---
createdAt: '2026-04-14'
tags:
  - golang
  - river
  - job-queue
  - postgresql
publish: true
---

## 핵심

[River](https://github.com/riverqueue/river)는 PostgreSQL만으로 동작하는 Go-native Job Queue.
Redis/RabbitMQ 같은 별도 인프라 없이 기존 DB로 백그라운드 작업 처리가 가능하다.

## 왜 주목할만한가

- **인프라 추가 없음**: `river_*` 테이블만으로 동작
- **트랜잭션 원자성**: `InsertTx()`로 비즈니스 데이터와 Job을 같은 TX에 묶을 수 있음
- **중복 처리 방지**: 내부적으로 `SELECT FOR UPDATE SKIP LOCKED` 사용

## 핵심 패턴

```go
// ❌ 위험: 비즈니스 로직과 job enqueue 사이 장애 시 유실
repo.SaveWorkflow(ctx, workflow)
riverClient.Insert(ctx, PipelineArgs{WorkflowID: workflow.ID}, nil)

// ✅ 안전: 같은 트랜잭션으로 원자적 보장
tx, _ := pool.Begin(ctx)
repo.SaveWorkflowTx(ctx, tx, workflow)
riverClient.InsertTx(ctx, tx, PipelineArgs{WorkflowID: workflow.ID}, nil)
tx.Commit(ctx)
```

## Job 생명주기

```
available → running → completed / retryable / discarded
```

- 기본 max_attempts: 25, 지수 백오프 적용
- PeriodicJob으로 cron 스케줄링도 가능

## DevOps 관점

- PostgreSQL 모니터링만으로 Job 상태 확인 가능
- `river_job` 테이블 autovacuum 설정 신경 써야 함 (dead tuple 관리)
- 기존 DB 백업에 job 상태 자동 포함

## Related

- [[Channel]]
- [[Concurrency]]
