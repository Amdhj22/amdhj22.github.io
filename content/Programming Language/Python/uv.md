---
created: '2026-04-27 14:30'
tags:
  - til
  - python
  - uv
  - package-manager
  - astral
publish: true
---

## 한 줄 요약

`uv`는 Astral(ruff 제작사)이 **Rust로 만든 Python 통합 매니저**. pip + venv + pyenv + Poetry를 한 도구로 대체하고 10~100배 빠르다.

## 무엇을 한 번에 대체하나

| 기존 도구 | uv 명령 |
|---|---|
| `pyenv install 3.12` | `uv python install 3.12` |
| `python -m venv .venv` | `uv venv` |
| `pip install requests` | `uv add requests` |
| `pip install -r requirements.txt` | `uv sync` |
| `poetry add` / `poetry lock` | `uv add` / `uv lock` |

Python 인터프리터 다운로드까지 내장이라 시스템 Python 의존도가 거의 없다.

## 설치

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# or
brew install uv
```

## Python 버전 관리 (pyenv 대체)

```bash
uv python list                     # 설치 가능 목록
uv python install 3.12             # 설치
uv python pin 3.12                 # 프로젝트 버전 고정 (.python-version)
```

## 프로젝트 초기화

```bash
uv init my-project                 # 새 폴더 생성
cd my-project && uv init           # 기존 폴더에 초기화
```

자동 생성:

```
my-project/
├── .venv/
├── .python-version
├── pyproject.toml
└── README.md
```

## 패키지 관리

```bash
uv add requests                     # 의존성 추가
uv add --dev pytest ruff            # 개발 의존성
uv add "requests>=2.28.0"           # 버전 지정
uv remove requests                  # 제거
uv sync                             # uv.lock 기준 환경 재현
uv sync --no-dev                    # 배포용 (dev 제외)
uv lock                             # lock 갱신만
```

`pyproject.toml` 자동 갱신:

```toml
[project]
requires-python = ">=3.12"
dependencies = ["requests>=2.28.0"]

[dependency-groups]
dev = ["pytest>=8.0.0", "ruff>=0.4.0"]
```

## 실행 — `uv run` 패턴

venv activate 없이 바로 실행:

```bash
uv run python main.py
uv run pytest
uv run ruff check .

# 일회성 외부 패키지 (설치 없이)
uv run --with requests script.py
```

CI 스크립트에서 매우 깔끔. activate 단계 사라짐.

## 마이그레이션

```bash
# requirements.txt → uv
uv add $(cat requirements.txt)
```

## 새 프로젝트 표준 워크플로우

```bash
uv init my-project && cd my-project
uv python pin 3.12
uv add <패키지>
uv add --dev ruff pytest
git init && git commit -am "init"

# 다른 환경에서
git clone <repo> && uv sync         # 끝
```

## 관련 링크

- [[Python]]
- [[Poetry]]
- [[uv vs Poetry]]
