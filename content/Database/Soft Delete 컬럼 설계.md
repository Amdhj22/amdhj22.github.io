---
created: '2026-05-18 19:14'
tags:
  - til
  - sql
  - postgresql
  - soft-delete
  - design
  - database
---
# TIL: Soft Delete 컬럼 설계 — 세 가지 비직관적 판단

## 상황

세션 무효화(revocation) 기능을 설계하는 과정에서 soft delete 컬럼 구조를 처음부터 정해야 했다. 어드민 강제 만료, 중복 로그인 차단, 정상 로그아웃 — 세 가지 케이스를 모두 커버해야 했고, 컬럼 하나 추가하는 것처럼 보였지만 생각보다 결정할 게 많았다.

## 핵심

### 1. `is_revoked` boolean과 `revoked_at` timestamp를 같이 쓰면 안 된다

첫 번째 본능은 두 컬럼을 같이 쓰는 것이다. `is_revoked = true`인지 바로 확인하고 싶고, `revoked_at`으로 시점도 남기고 싶다. 이게 틀린 이유는 세 가지다.

**SSOT 위반.** `is_revoked`는 `revoked_at IS NOT NULL`에서 파생되는 derived value다. 같은 사실을 두 컬럼에 저장하는 redundancy.

**데이터 정합성 위험.** 코드 버그나 마이그레이션 실수로 두 컬럼이 모순되는 row가 생긴다.

```
is_revoked = true,  revoked_at IS NULL   ← 어느 쪽이 진실?
is_revoked = false, revoked_at IS NOT NULL
```

이걸 막으려면 결국 CHECK constraint를 걸게 된다.

```sql
CHECK (is_revoked = (revoked_at IS NOT NULL))
```

그런데 이 제약을 거는 순간 `is_revoked`가 derived value임을 스키마 자체가 시인하는 셈이다. boolean이 redundant하다는 증거를 constraint로 보강하고 있는 구조.

**쿼리 / 성능 이점 없음.** "boolean 조건이 더 빠르다"는 오해가 있지만 PostgreSQL은 NULL도 B-tree index에 포함된다. `WHERE revoked_at IS NULL`도 인덱스를 탄다. Partial unique index(`WHERE revoked_at IS NULL`)로 active row만 색인하면 hot path는 충분히 타이트하게 유지된다. 가독성도 `WHERE is_revoked = false` vs `WHERE revoked_at IS NULL` — 차이 없다.

**결론: `revoked_at` 단일 컬럼으로 충분하다.** boolean을 정당화할 수 있는 경우는 두 가지뿐이다 — timestamp 추적이 전혀 불필요하거나, 외부 시스템 호환이 강제될 때(이 경우도 generated column으로 derived 처리 권장).

---

### 2. 컬럼 이름은 도메인 시멘틱을 따라야 한다

`deleted_at`은 직관적이다. 하지만 세션/토큰에 `deleted_at`을 쓰면 코드 읽는 사람이 "이 row는 삭제됐다"고 이해한다. 실제로는 삭제가 아니라 *명시적으로 무효화된 것*이다.

OAuth2의 token revocation 표준인 RFC 7009도 이 액션을 "revocation"이라고 정의한다. 표준 라이브러리, SDK, 문서 전반이 같은 단어를 쓴다. 컬럼 이름이 그 컨텍스트에서 혼자 `deleted_at`이면 독자의 멘탈 모델이 흔들린다.

도메인별 권장 네이밍:

| 도메인 | 컬럼 |
|--------|------|
| 세션 / 토큰 | `revoked_at`, `revoke_reason` |
| 주문 | `cancelled_at`, `cancel_reason` |
| 계정 | `deactivated_at` |
| 문서 | `archived_at` |

컬럼 이름은 코드베이스 전체에 퍼진다. 리포지토리, 서비스 레이어, 로그, 에러 메시지, 모니터링 쿼리까지. 처음 이름을 제대로 잡는 게 이후 모든 독자에게 이득이다.

---

### 3. 자연 만료(natural expiry)는 revocation 컬럼에 기록하면 안 된다

세션 / 토큰은 `expires_at`이 있다. 만료된 row를 cron이 `revoke_reason = 'expired'`로 마킹하는 패턴이 있는데, 이건 시멘틱이 틀렸다.

자연 만료는 *row에 가해진 액션이 아니다*. 시간이 지났을 뿐이다. `revoke_reason`을 "왜 누군가가 이 세션을 끊었는가"의 기록으로 쓰려면, 자연 만료가 섞이면 의미가 오염된다.

올바른 3-state 모델:

```sql
-- Active: 유효한 세션
WHERE revoked_at IS NULL AND expires_at > NOW()

-- Expired: 자연 만료 (아무도 끊지 않음)
WHERE revoked_at IS NULL AND expires_at <= NOW()

-- Revoked: 명시적으로 무효화됨 (누군가가 끊음)
WHERE revoked_at IS NOT NULL
```

이 구조에서 `revoke_reason`은 진짜 개입(admin force, duplicate login, user logout)만 담는다. cron은 cleanup만 하고 마킹은 안 한다.

에러 응답도 이 3-state에 대응시키면 운영 추적이 깔끔해진다.

```
존재하지 않는 세션  → 401 not_found
Revoked 세션        → 401 revoked
Expired 세션        → 401 expired
```

## 왜 중요한가

세 가지 판단 모두 "일단 돌아가는 코드"를 쓰는 데는 영향이 없다. 하지만 운영 단계에서 "왜 이 세션이 무효화됐지?", "이 `is_revoked=true`인데 `revoked_at`이 NULL인 row는 뭐야?" 같은 질문이 생기면 스키마 수준의 기술 부채가 드러난다. 컬럼 설계는 처음에 제대로 결정해 두면 이후 모든 쿼리, 로그, 모니터링, 코드 리뷰 비용이 줄어든다.

## 참고

- [[Soft Delete 패턴]]
- [RFC 7009 — OAuth 2.0 Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
