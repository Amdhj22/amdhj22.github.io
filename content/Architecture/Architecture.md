---
created: '2026-04-08'
tags:
  - til
  - architecture
  - index
publish: true
---

# Architecture

> 소프트웨어 아키텍처 및 설계 패턴 학습 내용

## Async Programming

- [[Async Programming/01. Overview]] — 비동기 프로그래밍 개요, 동시성 vs 병렬성, 언어별 비교
- [[Async Programming/02. Thread]] — 프로세스/스레드, 컨텍스트 스위칭, 1:1/N:1/M:N 모델
- [[Async Programming/03. Scheduler]] — OS/런타임 스케줄러, GMP 모델, Work-stealing
- [[Async Programming/04. IO Multiplexing]] — select/poll/epoll/kqueue, 이벤트 루프, io_uring

## Communication & Protocol

- [[gRPC]] — gRPC vs REST, Protocol Buffers, proto 파일
- [[HTTP2]] — Multiplexing, Server Push, HPACK 압축
- [[서비스 간 통신 패턴]] — IPC/Socket/RPC, Stub/Marshalling
- [[REST 비동기 처리]] — Webhook/Callback, 동기 vs 비동기

## Web

- [[WEB 기초]] — 브라우저 URL 흐름, 쿠키/세션, REST API, HTTPS

---

**Related**: [[../TIL|TIL]]
