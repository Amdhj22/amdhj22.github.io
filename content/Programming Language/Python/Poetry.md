---
created: '2026-04-27 14:30'
tags:
  - til
  - python
  - poetry
  - package-manager
  - dependency
publish: true
---

## 한 줄 요약

`Poetry`는 Python의 **의존성 관리 + 가상환경 + 빌드/배포**를 묶은 통합 도구. `pyproject.toml` + `poetry.lock`으로 재현 가능한 환경을 만든다.

## 설치

```bash
brew install poetry
```

## 신규 프로젝트

```bash
poetry new poetry-demo
```

기본 구조:

```
poetry-demo/
├── pyproject.toml
├── README.rst
├── poetry_demo/__init__.py
└── tests/
    ├── __init__.py
    └── test_poetry_demo.py
```

## pyproject.toml 형태

```toml
[tool.poetry]
name = "poetry-demo"
version = "0.1.0"
description = ""
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.9"

[tool.poetry.dev-dependencies]
pytest = "^5.2"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"
```

## 기존 프로젝트에 적용

```bash
poetry init
```

대화형으로 `pyproject.toml` 생성.

## 패키지 추가

```bash
poetry add fastapi==0.70.1
poetry add --group dev pytest
poetry remove fastapi
```

## 외부 repository

기본은 PyPI. 사내 mirror 등을 쓰려면:

```toml
[[tool.poetry.repositories]]
name = "internal"
url = "https://pypi.internal.example.com"
```

## `poetry install` 동작

| `poetry.lock` 상태 | 동작 |
|---|---|
| 없음 | `pyproject.toml` 의 패키지 설치 → lock 생성 |
| 있음 | **lock에 명시된 정확한 버전** 설치 (재현성) |

`poetry.lock`은 항상 커밋해야 다른 환경에서 동일한 버전 재현 가능.

## 자주 쓰는 명령어

```bash
poetry new <name>           # 신규 프로젝트
poetry init                 # 기존 폴더 초기화
poetry add <pkg>            # 의존성 추가
poetry install              # 환경 재현
poetry update               # 버전 업데이트
poetry shell                # venv 활성화
poetry run <cmd>            # venv 안에서 실행
poetry build                # sdist/wheel 빌드
poetry publish              # PyPI 배포
```

## 한계

- 구현이 Python이라 **느리다** (대규모 의존성 해결 시 수십 초)
- Python 인터프리터 자체는 관리 불가 (pyenv 별도)
- 최근에는 [[uv]] 가 빠른 대안으로 부상

## 관련 링크

- [[Python]]
- [[uv]]
- [[uv vs Poetry]]
