---
createdAt: '2026-04-07 18:00'
tags:
  - til
  - rails
  - ruby
  - mvc
publish: true
---

## 핵심 철학

- **CoC (Convention over Configuration)** — 이름 규칙만으로 자동 연결, 설정 파일 최소화
- **DRY (Don't Repeat Yourself)** — 코드 중복 최소화
- **Opinionated** — 정해진 방식, 예측 가능 → 팀 협업 유리

## 빠른 시작

```bash
rails new my_api --api     # API 전용
cd my_api
bin/rails server
```

## MVC 구조

| 폴더 | 역할 |
|------|------|
| `app/models/` | DB 스키마 + 비즈니스 로직 (Active Record) |
| `app/controllers/` | HTTP 요청 처리 |
| `config/routes.rb` | URL ↔ 컨트롤러 매핑 |
| `db/migrate/` | DB 스키마 변경 이력 |
| `Gemfile` | 의존성 목록 |

## Scaffold — CRUD 자동 생성

```bash
bin/rails generate scaffold Post title:string content:text
bin/rails db:migrate
```

```ruby
def post_params
  params.expect(post: [:title, :content])  # Strong Parameters
end
```

## Rails Console

```bash
bin/rails c
Post.all
Post.create(title: "Hello", content: "World")
```

## Action Cable (WebSocket)

```ruby
def subscribed
  stream_from "chat_room_#{params[:room_id]}"
end

ActionCable.server.broadcast("chat_room_1", { message: "새 데이터!" })
```

- 분산 환경에서 Redis Pub/Sub 어댑터 필수
- 극단적 실시간(초당 수십만 패킷)은 Go goroutine 서버가 유리
