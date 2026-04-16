---
created: '2026-04-16 10:00'
tags:
  - til
  - java
  - jpa
  - n-plus-one
  - fetch-join
publish: true
---

## 개요

영속성 컨텍스트, 프록시, N+1 문제와 해결법.

## 영속성 컨텍스트

앱과 DB 사이에서 엔티티를 보관하는 가상 DB.
- 1차 캐시, 동일성 보장, 쓰기 지연, 변경 감지, 지연 로딩

### 생명주기

`비영속(new)` → `영속(managed)` → `준영속(detached)` / `삭제(removed)`

## N+1 문제

1번 메인 쿼리 + N번 추가 쿼리 발생.

### 해결법

| 방식 | 쿼리 | 장점 | 단점 |
|------|------|------|------|
| **Fetch Join** | `join fetch` JPQL | 1번 쿼리 | Pageable 불가, 복수 1:N 불가 |
| **@EntityGraph** | outer join | 어노테이션으로 간편 | 카테시안 곱 (중복) |
| **@BatchSize** | `IN` 절 | N+1 → 1+1 | size 튜닝 필요 |

```java
// Fetch Join
@Query("select t from Team t join fetch t.users")
List<Team> findAllFetchJoin();

// BatchSize
@BatchSize(size = 100)
@OneToMany
private List<User> users;
```

---

**Related**: [[OOP]] | [[Language Basics]]
