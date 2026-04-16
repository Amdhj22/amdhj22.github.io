---
created: '2026-04-16 09:00'
tags:
  - til
  - grpc
  - rpc
  - protobuf
  - http2
publish: true
---

## 개요

Google 개발 오픈소스 RPC 프레임워크. HTTP/2 + Protocol Buffers 기반 고성능 서비스 간 통신.

## gRPC vs REST

| | gRPC | REST |
|---|---|---|
| 프로토콜 | HTTP/2 | HTTP/1.1 |
| 데이터 포맷 | Protocol Buffers (바이너리) | JSON (텍스트) |
| 인터페이스 정의 | .proto (IDL) | OpenAPI/Swagger |
| 스트리밍 | 양방향 지원 | 제한적 |
| 적합 케이스 | 내부 서비스 간 통신 | 외부 API, 브라우저 |

## Proto 파일 예시

```proto
syntax = "proto3";
service HelloService {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
message HelloRequest { string message = 1; }
message HelloReply { string greeting = 1; }
```

---

**Related**: [[HTTP2]] | [[서비스 간 통신 패턴]]
