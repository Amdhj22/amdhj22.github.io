---
created: '2026-04-16 09:00'
tags:
  - til
  - web
  - http
  - rest-api
  - cookie
  - session
publish: true
---

## 브라우저 URL 입력 시 흐름

```
DNS 조회 → HTTP Request → ISP → 라우터 → 방화벽 → 캐시 → WS → WAS → 응답
```

## 쿠키 vs 세션

| | 쿠키 | 세션 |
|---|---|---|
| 저장 | 브라우저 (클라이언트) | 서버 |
| 보안 | 약함 | 강함 (서버 저장) |
| 수명 | 만료일 설정 | 브라우저 종료 시 |

## REST API

- 자원의 표현(URI)으로 상태를 주고받는 것
- HTTP Method: GET(조회), POST(생성), PUT(교체), PATCH(수정), DELETE(삭제)

## HTTP 응답코드

| 코드 | 의미 |
|------|------|
| 2xx | 성공 (200 OK, 201 Created) |
| 3xx | 리다이렉션 |
| 4xx | 클라이언트 에러 (400, 404) |
| 5xx | 서버 에러 |

## HTTPS

HTTP + SSL/TLS. 암호화(도청 방지) + 인증서(위장/변조 방지).

---

**Related**: [[gRPC]] | [[HTTP2]] | [[REST 비동기 처리]]
