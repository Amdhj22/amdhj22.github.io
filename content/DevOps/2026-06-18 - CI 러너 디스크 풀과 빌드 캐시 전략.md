---
created: '2026-06-18 20:30'
updated: '2026-06-18 20:30'
tags:
  - til
  - devops
  - docker
  - buildkit
  - ci
  - troubleshooting
publish: true
---

# TIL: CI 러너 디스크 풀과 빌드 캐시 전략

## 상황

GPU 기반 ML 추론 서비스 이미지를 CI에서 빌드하는데 갑자기 `No space left on device`로 실패하기 시작했다. 전날까지 잘 되던 워크플로우였다. 딱 하나 바꾼 게 있었는데, BuildKit registry 캐시를 `mode=max`로 올린 것이었다.

---

## 핵심

### 1. 원인 추적

로그를 보면 빌드 자체는 거의 다 됐다가 캐시 export 단계에서 터진다.

```
#47 exporting cache
#47 ERROR: failed to export: write /var/lib/docker/tmp/...: no space left on device
```

`df -h /` 찍어보면 루트 파티션이 100%다. hosted 러너는 루트 디스크가 ~20GB 수준인데, GPU/ML 베이스 이미지는 압축 기준으로도 수 GB다. 거기에 `mode=max` export staging이 붙으면 러너가 버티질 못한다.

레지스트리에 캐시를 push하는 구조인데도 왜 로컬 디스크가 터지냐면 — **push 전에 모든 레이어를 로컬에서 staging**하기 때문이다. 외부로 내보내기 전에 일단 전부 로컬에 모아야 한다.

경험칙으로 정리하면:

```
압축 이미지 크기 × 2.5–3배 (압축 해제)
  + builder 중간 레이어 (mode=max)
  + staging 중복
  ≈ 실제 필요 디스크 ≈ 압축 크기의 8–12배
```

### 2. 처음엔 mode=min으로 줄이려 했다

"캐시가 디스크를 터뜨리면 캐시를 줄이면 되지" — 이 방향이 자연스러워 보였다. `mode=min`으로 낮추면 staging 크기도 줄어들 테니까.

근데 multi-stage 빌드 구조를 다시 보니 문제가 있었다.

```dockerfile
FROM python:3.12 AS builder
RUN pip install -r requirements.txt   # ← 이게 제일 오래 걸림
COPY . .
RUN python build.py

FROM python:3.12-slim AS runtime
COPY --from=builder /dist /dist
```

`mode=min`은 `runtime` 스테이지 레이어만 캐시한다. `builder`의 `pip install` 레이어는 최종 이미지에 포함되지 않으므로 캐시 대상이 아니다. 즉, 가장 오래 걸리는 부분이 캐시 이득을 전혀 못 본다.

`mode=max`로 올렸던 이유가 바로 그 때문이었다. 다시 낮추면 캐시를 켜 놓아도 없는 것과 다를 바가 없다.

**방향을 바꿨다. 산출물을 줄이는 게 아니라 환경을 키운다.**

### 3. 디스크 직접 확보

GitHub-hosted runner에는 안 쓰는 툴체인이 잔뜩 깔려 있다. android SDK, Haskell/GHC, CodeQL 등. 빌드 전 단계에서 지워버리면 25–30 GB를 확보할 수 있다.

```bash
sudo rm -rf \
  /usr/local/lib/android \
  /opt/ghc \
  "${AGENT_TOOLSDIRECTORY}/CodeQL" \
  /usr/share/dotnet \
  /usr/share/swift
```

third-party action 없이 인라인 셸로 처리했다. 외부 의존성 추가 없이 끝난다.

### 4. workflow_dispatch로 머지 전 검증

PR 브랜치에서 바로 이 워크플로우를 돌려야 했다. GitHub Actions에 `workflow_dispatch`가 있어서 브랜치를 직접 지정해서 실행했다.

```yaml
on:
  push:
    branches: [main, dev]
  workflow_dispatch:   # ← 이걸로 브랜치 직접 지정 실행 가능
```

머지 전에 실제 CI 환경에서 검증하고 PR 올릴 수 있었다. 로컬 시뮬레이션보다 훨씬 확실하다.

---

## 왜 중요한가

두 가지 원칙이 정리됐다.

**첫째, 리소스 제약은 산출물을 줄이기 전에 환경을 키우는 선택지를 먼저 본다.**

`mode=min`으로 줄이면 문제는 해결되지만 캐시 효과도 같이 사라진다. 빌드 구조가 multi-stage라면 그 손해가 더 크다. 환경을 키우는 쪽이 목적 달성과 제약 해결을 동시에 한다.

**둘째, 캐시 전략은 빌드 구조를 알아야 제대로 고른다.**

`mode=min`이냐 `mode=max`냐는 단순히 용량 문제가 아니다. multi-stage 빌드에서 어느 스테이지가 무겁냐에 따라 어떤 mode가 실제로 이득을 내는지가 결정된다. 구조를 모르면 캐시를 켜 놓고도 효과를 못 본다.

---

## 참고

- [[BuildKit 캐시 전략]] — registry 캐시 세팅, mode=min vs max, 레지스트리 비용 모델 상세
