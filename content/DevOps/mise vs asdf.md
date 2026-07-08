---
created: '2026-07-08 14:00'
updated: '2026-07-08 14:00'
tags:
  - til
  - devops
  - mise
  - asdf
  - version-manager
publish: true
---

# TIL: mise vs asdf — 도구 vs 파일 혼동 정리

## 상황

팀 repo에 `.tool-versions`가 있는데 누군가는 asdf, 누군가는 mise를 쓴다. "그냥 둘 다 읽히는 거 아니야?"라고 넘어가다가 mise.toml을 도입하는 순간 asdf 유저 셋업이 깨진다는 걸 알았다.

---

## 핵심

### 1. 파일과 도구는 다른 개념이다

`.tool-versions`는 **선언 파일(매니페스트)** 일 뿐이다. 이 파일을 실제로 읽어서 설치·전환해주는 도구(asdf / mise)가 따로 있어야 동작한다. `.tool-versions`가 있다고 "asdf 사용 중"이 아니다.

### 2. 호환성은 한 방향만

| 방향 | 가능 |
|---|---|
| mise → `.tool-versions` 읽기 | 가능 (하위호환) |
| asdf → `mise.toml` 읽기 | 불가 |

mise는 asdf의 **상위집합(superset)** 이다. mise는 `.tool-versions`를 그대로 소비하지만, asdf는 `mise.toml`을 이해하지 못한다.

### 3. 파일 형식 비교

| | `.tool-versions` | `mise.toml` |
|---|---|---|
| 포맷 | `name version` 줄 나열 | TOML |
| 읽는 도구 | asdf, mise, CI 스크립트 | mise 전용 |
| 표현력 | 버전만 | 버전 + backend + env + task |
| 포터빌리티 | 높음 | 낮음 |

### 4. mise의 추가 기능

```toml
# mise.toml — asdf로는 불가
[tools]
node = "22"
python = { version = "3.12", backend = "pipx" }

[env]
NODE_ENV = "development"

[tasks.test]
run = "go test ./..."
```

`pipx:toolname`, `cargo:toolname`, `npm:toolname` 같은 **backend** 문법은 플러그인 없이 다양한 생태계 도구를 설치해준다. asdf에서는 플러그인을 따로 등록해야 했던 것들이다.

### 5. mise exec — 격리 실행

```bash
# 현재 환경 설정 무시하고 지정 버전만으로 실행
mise exec node@18 -- node --version

# 주변 mise.toml / .tool-versions 도 무시
mise --no-config exec node@18 -- node --version
```

### 6. 이전 전략 — 도구 통일 vs 파일 통일

**도구 통일** (mise 채택, 파일은 `.tool-versions` 유지):
- 저마찰. mise가 기존 파일을 그대로 읽으므로 파일 변경 불필요.
- asdf 유저도 기존 방식으로 계속 동작.
- 실용적인 선택.

**파일 통일** (전부 `mise.toml`로 전환):
- `.tool-versions`를 소비하던 asdf 유저, awk 파싱 CI가 즉시 깨짐.
- mise 네이티브 기능(env, task, backend)을 최대한 활용할 때 의미 있음.
- 팀 전체가 mise로 이전 완료된 이후에 고려.

**섞어 쓰기는 최악**: 일부 repo만 `mise.toml`이면 asdf 유저가 해당 repo 셋업 불가.

---

## 왜 중요한가

"파일 형식"과 "도구"를 구분하지 않으면 의도치 않게 팀 셋업을 깨뜨린다. mise.toml 도입 결정은 팀 전체의 도구 통일이 전제되어야 한다. 그 전까지는 `.tool-versions` + mise 조합이 가장 안전하다.

---

## 참고

- [[DevOps]] — DevOps TIL 목록
