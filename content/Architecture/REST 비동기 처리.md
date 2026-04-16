---
created: '2026-04-16 09:00'
tags:
  - til
  - rest-api
  - async
  - webhook
publish: true
---

## 개요

Long-Running API의 동기식 한계를 극복하는 Webhook/Callback 비동기 패턴.

## 동기 vs 비동기

| 항목 | 동기식 | 비동기 + Webhook |
|------|--------|-----------------|
| 클라이언트 리소스 | 지속 연결 | 요청 후 해제 |
| 확장성 | 낮음 (연결 수 제약) | 높음 (비연결 큐) |
| 타임아웃 | 있음 | 없음 |
| 구현 난이도 | 쉬움 | 초기 복잡도 |

## 비동기 흐름

```
1. Client → POST /api/jobs → 202 Accepted (즉시)
2. Server: 백그라운드 처리
3. Server → POST /callback (Webhook으로 결과 전달)
```

비동기 큐 연계: Kafka, SQS, Redis Queue

---

**Related**: [[서비스 간 통신 패턴]] | [[gRPC]]
