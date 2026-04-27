---
created: '2026-04-27 14:30'
tags:
  - til
  - python
  - uv
  - poetry
  - package-manager
  - comparison
publish: true
---

## 핵심

Python 프로젝트 매니저 양대 선택지. 둘 다 `pyproject.toml` 기반이지만 **속도와 범위**가 다르다.

## 한눈에 비교

| | Poetry | uv |
|---|---|---|
| 개발사 | 커뮤니티 | Astral (ruff 제작사) |
| 구현 언어 | Python | **Rust** |
| 의존성 해결 속도 | 보통 | **10~100배 빠름** |
| Python 버전 관리 | ❌ (pyenv 별도) | ✅ 내장 |
| pip 호환 명령 | ❌ | ✅ (`uv pip ...`) |
| lock 파일 | `poetry.lock` | `uv.lock` |
| pyproject.toml | ✅ | ✅ (PEP 621 표준) |
| 가상환경 | `poetry shell` | `.venv` 자동 + `uv run` |
| 성숙도 | 매우 높음 | 1.x대 (빠르게 안정화 중) |
| 빌드/배포 | `poetry build/publish` | `uv build/publish` |

## 같은 작업, 명령 비교

| 작업 | Poetry | uv |
|---|---|---|
| 프로젝트 생성 | `poetry new <name>` | `uv init <name>` |
| 의존성 추가 | `poetry add <pkg>` | `uv add <pkg>` |
| dev 의존성 | `poetry add --group dev <pkg>` | `uv add --dev <pkg>` |
| 환경 재현 | `poetry install` | `uv sync` |
| 명령 실행 | `poetry run <cmd>` | `uv run <cmd>` |
| Python 버전 변경 | pyenv 별도 | `uv python pin 3.12` |
| 빌드 | `poetry build` | `uv build` |

## 선택 기준

### Poetry가 적합한 경우

- 이미 Poetry로 운영 중인 팀 — 마이그레이션 비용 > 속도 이득
- Python 외 도구(pyenv, pip-tools 등)와 안정적으로 통합돼 있음
- 성숙한 생태계 / 풍부한 플러그인 필요

### uv가 적합한 경우

- **신규 프로젝트** — 기본 선택지로 무난
- CI 빌드 시간이 병목 — install 단계가 분 단위 → 초 단위로 단축
- Python 버전까지 한 도구로 관리하고 싶음 (pyenv 제거)
- Docker 이미지 빌드 시 layer cache 효과 극대화

## 마이그레이션

Poetry → uv 는 비교적 단순:

```bash
# pyproject.toml의 [tool.poetry.dependencies] 를 [project] dependencies 로 변환
# (uv의 init_from_poetry 같은 자동화는 외부 도구로 존재)

uv lock                # 새 lock 생성
uv sync                # 환경 재구성
rm poetry.lock         # 옛 lock 제거
```

`pyproject.toml`의 `[tool.poetry]` 섹션을 PEP 621 표준 `[project]`로 옮기는 게 핵심 작업.

## DevOps 관점

- **Docker**: uv는 `--frozen` + `uv.lock` 으로 builder layer 분리하면 캐시 적중률 매우 높음
- **CI**: `actions/setup-python` + `pip install poetry` 대신 `astral-sh/setup-uv` 한 액션
- **이미지 크기**: uv 자체 바이너리는 작음 (Rust 단일 binary). Poetry는 Python + 의존성 다수
- **재현성**: 둘 다 lock 기반이라 동등. uv.lock이 더 결정론적이라는 보고

## 결론

> 신규 프로젝트는 **uv**로 시작. 기존 Poetry 프로젝트는 **속도가 병목일 때만** 마이그레이션.
> 둘 다 `pyproject.toml` 표준이라 전환 비용은 점점 낮아지는 추세.

## 관련 링크

- [[Python]]
- [[uv]]
- [[Poetry]]
