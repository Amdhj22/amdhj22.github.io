---
created: '2026-05-21 10:00'
updated: '2026-05-21 10:00'
tags:
  - til
  - yaml
  - pre-commit
  - devops
publish: true
---

# TIL: pre-commit YAML 중복 키 함정

## 상황

`.pre-commit-config.yaml`에 bandit hook을 추가했는데 커밋해도 보안 스캔이 돌지 않았다. `pre-commit run --all-files`를 직접 실행해봐도 bandit은 나타나지 않는다. 에러는 없다. 그냥 없다.

원인을 찾다 보니 파일 위쪽에 `repos:` 키가 하나 더 있었다.

## 핵심

`repos:`를 두 번 선언하면 **첫 번째 블록 전체가 조용히 사라진다.**

```yaml
repos:           # ← 여기에 bandit, ruff, ruff-format 전부 있음
  - repo: ...
    hooks:
      - id: bandit
      - id: ruff-format

repos:           # ← 이 키가 위를 덮어씀. 에러 없음.
  - repo: ...
    hooks:
      - id: ruff
        files: ^app/
```

pre-commit은 PyYAML을 쓰고, PyYAML은 YAML 1.1 동작으로 **중복 키가 있으면 마지막 값을 쓴다.** spec에도 그렇게 정의됐다 — "last key wins." `strictyaml` 같은 파서만 에러를 낸다.

결과: 위 설정을 파싱하면 두 번째 `repos` 블록만 남는다. 첫 번째에만 있던 bandit은 실행 대상 자체에서 제외.

## 왜 중요한가

"pre-commit 통과" = "보안 스캔 통과"라는 가정이 무너진다. 커밋 로그는 깨끗하고, CI는 초록불이지만 SAST는 한 번도 안 돌았을 수 있다.

조기 차단 방법은 간단하다:

```bash
yamllint .pre-commit-config.yaml
```

기본 설정으로도 중복 키를 warning으로 잡는다. `.yamllint.yaml`에 아래 한 줄 추가하면 error로 격상된다:

```yaml
rules:
  key-duplicates: enable
```

CI 첫 단계에 넣어두면 끝.

## 참고

- [YAML 1.2 spec §7.4.2 — Mapping Key Uniqueness](https://yaml.org/spec/1.2.2/#742-block-mappings)
- [[DevOps]]
