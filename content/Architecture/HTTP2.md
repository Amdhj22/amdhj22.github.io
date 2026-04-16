---
created: '2026-04-16 09:00'
tags:
  - til
  - http
  - http2
  - protocol
  - multiplexing
publish: true
---

## 개요

HTTP/1.1의 성능 한계를 개선한 이진 프로토콜.

## HTTP/1.1 vs HTTP/2

| | HTTP/1.1 | HTTP/2 |
|---|---|---|
| 포맷 | 텍스트 | 이진(바이너리) |
| 요청 처리 | 순차적 (HOL Blocking) | **Multiplexing** (동시 다중) |
| 연결 | 요청마다 또는 Keep-Alive | 단일 연결로 다수 처리 |
| Header | 매 요청마다 전체 전송 | **HPACK 압축** |
| 서버 → 클라이언트 | 요청 필수 | **Server Push** 가능 |
| TLS | 선택 | 사실상 필수 |

## 핵심 기능

- **Multiplexing**: 단일 TCP 연결에서 여러 스트림 동시 처리
- **Server Push**: 클라이언트 요청 없이 리소스 미리 전송
- **HPACK**: 반복 헤더를 정적/동적 테이블로 관리

---

**Related**: [[gRPC]] | [[Architecture]]
