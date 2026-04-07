---
createdAt: '2026-04-07 17:00'
tags:
  - til
  - go
  - project-structure
publish: true
---

## 표준 레이아웃

[golang-standards/project-layout](https://github.com/golang-standards/project-layout) 기준.

```
myapp/
├── cmd/
│   └── myapp/
│       └── main.go        # 진입점. 얇게 유지
├── internal/              # 외부 패키지에서 import 불가 (컴파일러 강제)
│   ├── config/
│   ├── handler/
│   ├── service/
│   ├── repository/
│   └── model/
├── pkg/                   # 외부에서 사용 가능한 공개 패키지
├── api/                   # OpenAPI spec, protobuf 정의
├── scripts/
├── go.mod
└── go.sum
```

## 핵심 원칙

**`cmd/`**: 바이너리 진입점만. 로직 없이 `internal/` 호출.

**`internal/`**: Go 컴파일러가 외부 import를 차단. 실질적인 비즈니스 로직.
- `myapp/internal/` → `myapp/` 전체에서만 접근 가능
- `myapp/foo/internal/` → `myapp/foo/` 에서만 접근 가능

**`pkg/`**: 다른 프로젝트에서도 재사용할 범용 라이브러리만. 남용 주의.

## gRPC 추가 시

```
api/
├── proto/
│   └── myservice.proto
└── pb/                    # protoc 생성 코드
    └── myservice.pb.go
```

## 소규모 서비스

작은 프로젝트에서 `internal/` 하위 구조까지 강제할 필요 없음:

```
myapp/
├── main.go
├── handler.go
├── service.go
├── repository.go
└── go.mod
```

> 구조는 복잡성에 따라 유기적으로 키워나갈 것. 처음부터 과설계 금지.
