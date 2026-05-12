---
created: '2026-05-12 09:00'
updated: '2026-05-12 09:00'
tags:
  - til
  - zsh
  - dotfiles
  - shell
publish: true
---

# Zsh 설정 방법 — 처음 셋업할 때 핵심만

bash → zsh로 넘어오거나, zsh를 새 머신에 셋업할 때 알아야 하는 최소 지식.

## 1. 설정 파일 로딩 순서

zsh는 셸 종류(login / interactive)에 따라 **다른 파일을 다른 순서로** 읽는다.

| 파일 | 읽히는 시점 | 용도 |
|---|---|---|
| `~/.zshenv` | **모든 zsh 실행 시 (스크립트 포함)** | 환경변수만. PATH도 여기. |
| `~/.zprofile` | login 셸 시작 시 (`.zshenv` 다음) | 로그인 1회용 setup (ssh-agent 등) |
| `~/.zshrc` | interactive 셸 시작 시 | 프롬프트, alias, function, 플러그인 — 대부분의 설정 |
| `~/.zlogin` | login 셸 시작 시 (`.zshrc` 다음) | 거의 안 씀 |
| `~/.zlogout` | login 셸 종료 시 | cleanup |

**핵심 함정**: `PATH`를 `.zshrc`에 두면 비-interactive zsh 스크립트에서 PATH가 비어있어 명령을 못 찾는다. PATH는 반드시 `.zshenv`.

## 2. 필수 옵션

```zsh
# Completion 활성화
autoload -Uz compinit && compinit

# History
HISTFILE=~/.zsh_history
HISTSIZE=50000
SAVEHIST=50000
setopt SHARE_HISTORY        # 모든 셸에서 history 공유
setopt HIST_IGNORE_DUPS     # 직전과 동일한 명령 저장 안 함
setopt HIST_IGNORE_SPACE    # 공백으로 시작하는 명령 저장 안 함
setopt EXTENDED_HISTORY     # timestamp 기록

# 디렉터리 이동
setopt AUTO_CD              # `cd` 없이 디렉터리명만 입력해도 이동
setopt AUTO_PUSHD           # cd가 자동으로 stack에 push
```

`compinit`은 첫 호출 시 캐시(`~/.zcompdump`)를 생성하므로 첫 셸 시작이 한 번 느림. 이후 캐시 사용.

## 3. Prompt

옵션 3가지:
- **기본 zsh prompt** — `PROMPT='%n@%m %~ %# '` 같이 직접 설정. 가볍지만 git 상태 등은 직접 구현해야 함.
- **starship** (Rust) — `eval "$(starship init zsh)"` 한 줄. 멀티셸 호환, 빠름. 권장.
- **powerlevel10k** — 빠르고 기능 많지만 zsh 전용. 설치/설정 복잡.

starship 예:
```zsh
eval "$(starship init zsh)"
```

설정은 `~/.config/starship.toml`.

## 4. 플러그인 도입 시점

플러그인 1~2개면 `.zshrc`에 직접 `source` 두 줄로 충분. 이상 늘어나면 **셸 시작 속도** 때문에 플러그인 매니저가 필요해진다. → [[Zinit 쓰는 이유]]

자주 쓰는 zsh 플러그인:
- `zsh-users/zsh-autosuggestions` — 히스토리 기반 명령어 자동 제안 (회색 텍스트)
- `zsh-users/zsh-syntax-highlighting` — 명령어 색상 강조
- `zsh-users/zsh-completions` — 추가 completion 정의
- `Aloxaf/fzf-tab` — completion UI를 fzf로 교체

## 5. 디버깅

셸 시작 속도 측정:
```zsh
# .zshrc 맨 위
zmodload zsh/zprof
# .zshrc 맨 아래
zprof
```
새 셸 열면 함수별 호출 시간/횟수가 출력된다.

또는 단순 시간 측정:
```sh
time zsh -i -c exit
```

100ms 이상이면 turbo mode 같은 지연 로딩 고려. 300ms 이상이면 거의 확실히 동기 source가 문제.

## 참고

- 공식 manual: `man zshall` (모든 zsh manual 통합)
- 옵션 전체 목록: `man zshoptions`
- compinit / completion 시스템: `man zshcompsys`
