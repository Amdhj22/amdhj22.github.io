---
created: '2026-04-07 17:00'
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

## Import Cycle 방지 패턴

Go는 순환 참조를 컴파일 타임에 금지한다. `A → B → A` 구조가 생기면 빌드 자체가 안 된다.

### 문제 상황

```
model → ui      (model.View()에서 ui.Render() 호출)
ui    → model   (ui에서 model 타입이나 함수 참조)
```

### 해결: 공유 의존을 독립 패키지로 분리

양쪽이 공통으로 필요한 것(순수 함수, 상수, 타입)을 별도 패키지로 추출한다.

```
model → ui   → calc   (단방향)
model → calc
model → types
ui    → types
calc  (외부 의존 없음)
types (외부 의존 없음)
```

```
myapp/
├── calc/    # 순수 연산 함수만 (외부 의존 없음)
├── types/   # 공유 상수/타입만 (외부 의존 없음)
├── model/   # 상태 + 비즈니스 로직
└── ui/      # 렌더링
```

### 판단 기준

순환이 생겼을 때 분리 대상 후보:
- **순수 함수** (입력 → 출력, 상태 없음) → `calc` 또는 `util` 패키지
- **공유 상수/타입** (양쪽에서 참조) → `types` 또는 `domain` 패키지
- **인터페이스** (구현체와 사용처 분리) → `port` 또는 별도 패키지

> 억지로 패키지를 늘리기보다, 먼저 "이 함수가 특정 패키지 타입에 의존하는가?"를 확인한다. 의존하지 않으면 분리 가능하다.
