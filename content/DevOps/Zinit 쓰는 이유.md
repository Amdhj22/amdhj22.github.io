---
created: '2026-05-11 22:30'
updated: '2026-05-11 22:30'
tags:
  - til
  - zsh
  - zinit
  - terminal
publish: true
---

# Zinit 쓰는 이유 — 본질은 "언제 source 하느냐"

zsh 플러그인 매니저를 쓰는 진짜 이유는 "플러그인 정리 편의성"이 아니라 **셸 시작 속도**다. 모든 플러그인을 `.zshrc`에서 `source`로 직접 나열하면 셸 시작 시 동기적으로 로드되고, 풀셋업(autosuggestions + syntax-highlighting + completions + starship + zoxide + atuin)이면 첫 프롬프트까지 200ms 이상 쉽게 넘긴다.

zinit의 `wait` ice (turbo mode)는 **셸 시작 후 백그라운드로 플러그인을 로드**한다. 같은 셋업을 20~30ms대까지 떨굴 수 있다. 첫 프롬프트 체감 차이가 가장 큰 가치.

부가 가치:
- `from'gh-r'` — GitHub Releases 바이너리 직접 설치. zsh 플러그인과 Rust/Go CLI 도구를 한 매니저로 통합 관리
- `zinit update` 일괄 업데이트 (수동은 각 디렉터리 들어가서 `git pull`)
- `has'cmd'` 조건부 로드, `atclone`/`atload` 빌드/통합 후크
- `.zshrc` 선언만으로 머신간 재현 (수동 관리는 디렉터리 상태가 어긋남)

## 안 쓰는 게 더 나은 경우

- **비인터랙티브 환경** (서버, 컨테이너) — 시작 속도 무관
- **플러그인 1~2개뿐** — 매니저 학습 비용이 source 두 줄보다 비쌈
- **외부 부트스트랩 최소화가 우선** — 감사/보안 환경
- **bash 환경** — zinit은 zsh 전용

## 한 줄 메모: zinit ≠ 새 도구

`zplugin`이 2021년경 원 메인테이너 잠적으로 죽고, 커뮤니티가 `zdharma-continuum/zinit`으로 포크 + 리네임한 것. 명령어/ice 문법은 거의 동일. 인터넷 가이드의 `zplugin`은 `zinit`으로 읽어도 대부분 동작한다.

공식: <https://github.com/zdharma-continuum/zinit>
