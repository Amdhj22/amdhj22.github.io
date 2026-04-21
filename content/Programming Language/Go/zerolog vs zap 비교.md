---
created: '2026-04-14'
tags:
  - golang
  - logging
  - zerolog
  - zap
  - structured-logging
  - slog
publish: true
---

## 핵심

Go structured logging 양대 산맥. 둘 다 JSON 기반, zero-allocation 지향이지만 성격이 다르다.

## 한눈에 비교

| | zerolog | zap |
|-|---------|-----|
| 의존성 | **0개** (순수 Go) | 2개 (multierr, atomic) |
| API | fluent chaining | field 기반 |
| allocs/op | 0 | 1 (Sugared: 5~7) |
| caller 자동 기록 | 별도 설정 | 기본 제공 |
| gin 연동 | 미들웨어 직접 작성 | `gin-contrib/zap` 한 줄 |

## 선택 기준

- **zerolog**: 의존성 최소화, 극한 성능, 가벼운 마이크로서비스
- **zap**: Uber 생태계(fx, dig) 사용 중, 큰 커뮤니티, 공식 gin 미들웨어

## slog과의 관계 (Go 1.21+)

`slog`가 **표준 인터페이스**, zerolog/zap은 **백엔드 구현**으로 쓰는 방향이 트렌드.

```go
// slog 인터페이스 + zerolog 백엔드
slog.SetDefault(slog.New(slogzerolog.Option{Logger: &zerologLogger}.NewHandler()))

// slog 인터페이스 + zap 백엔드  
slog.SetDefault(slog.New(zapslog.NewHandler(zapLogger.Core())))
```

새 프로젝트라면 `slog` 인터페이스 + zerolog/zap 핸들러 조합 추천.

## 결론

> 둘 다 프로덕션 검증됨. **팀 내 통일**이 가장 중요.
> 실서비스에서 로깅 성능 차이는 체감 불가.

## Related

- [[Go]]
- [[Concurrency]]
