---
created: '2026-05-07 14:30'
tags:
  - til
  - security
  - mtls
  - tls
  - proxy
  - network
publish: true
---

## 개요

기업 환경의 outbound proxy가 수행하는 **TLS inspection**(SSL bump)은 **mTLS와 구조적으로 충돌**한다. mTLS 통신을 사용하는 SaaS와 연동할 때 반드시 마주치는 함정.

## TLS Inspection이란

기업 보안 정책상 outbound 트래픽도 검사하기 위해 proxy가 수행하는 **합법적 MITM**.

```
Client ──TLS 1──▶ Proxy ──TLS 2──▶ Real Server
        (proxy cert)         (real cert)
```

- Proxy는 **자체 CA**로 동적 cert를 발급해서 클라이언트에게 제시
- 기업 PC에는 **proxy CA가 trusted root에 미리 설치**되어 있어 cert 검증 통과
- Proxy 안에서 평문으로 payload 검사 후 진짜 서버로 다시 암호화 전송

## 왜 mTLS가 깨지는가

mTLS는 **양방향 인증** — 서버도 클라이언트 cert를 검증한다.

| 구간 | 일반 TLS | mTLS |
|---|---|---|
| 서버 → 클라이언트 cert 제시 | O | O |
| 클라이언트 → 서버 cert 제시 | X | **O** |

TLS inspection 환경에서:

1. Client가 proxy에게 client cert를 제시 → proxy는 이걸 진짜 서버에게 그대로 전달할 수 없음 (proxy의 private key로 서명한 게 아니므로)
2. Proxy가 자체 cert로 서버에게 mTLS handshake 시도 → **서버가 등록되지 않은 cert로 reject**
3. 결과: 연결 실패

핵심: **client cert의 private key는 client에만 있고, proxy는 그걸 모방할 수 없다.**

## 해결 패턴

### Bypass 화이트리스트 등록

특정 도메인은 TLS inspection을 **건너뛰도록** proxy에 설정.

```
proxy.config:
  inspect: enabled
  bypass_domains:
    - api.vendor.example.com
    - *.internal-saas.com
```

- Vendor가 사전에 **고정 도메인·IP 목록**을 제공
- 보안팀이 화이트리스트 등록
- 해당 도메인은 end-to-end TLS 그대로 통과 → mTLS 정상 동작

### 차선책

Bypass가 어려운 환경:

- Proxy를 **L4 패스스루(TCP tunneling)** 모드로 운영 — 페이로드 검사 포기
- mTLS 대신 다른 인증 (OAuth + IP allowlist 등) 으로 변경 — 보안 등급 협의 필요

## SaaS 벤더 입장 체크리스트

mTLS 기반 outbound 통신을 요구할 때 고객사에 사전에 공유할 것:

- 고정 outbound 도메인·IP 목록 (CIDR 포함)
- TLS inspection bypass 화이트리스트 등록 필요성 명시
- Client cert 발급 모델: 자체 PKI vs 고객사 CA 발급 (양쪽 시나리오 준비)

## 핵심 한 줄

> **TLS inspection = MITM. mTLS = client 신원 검증. MITM은 client 신원을 위조할 수 없으므로 둘은 양립 불가 → bypass 외 답 없음.**

---

**Related**: [[Security]] · [[IDS IPS WAF]]
