---
created: 2026-07-10 11:50
updated: 2026-07-10 11:50
tags: [til, github-actions, ci-cd, devops]
publish: true
---

# TIL: GitHub Actions는 Workflow → Job → Step → Action 4계층이다

## 상황

GitHub Actions를 처음 제대로 정리할 기회가 생겼다. ci.yml 하나 있으면 되는 거 아닌가 싶었는데, gate 개념까지 연결해서 보니 구조가 꽤 명확하게 잡혔다. 실전 레포 구성까지 한 번에 정리.

## 핵심

### 계층 구조

```
Workflow  (.github/workflows/*.yml 파일 하나)
 └─ Job   (독립 VM 하나 = runner 하나)
     └─ Step  (순차 실행되는 명령)
         └─ uses: Action  또는  run: 셸 명령
```

- **Workflow** — `on:` 으로 언제 돌릴지 결정. push, PR, cron, 수동(`workflow_dispatch`), 다른 워크플로우 호출(`workflow_call`) 다 된다
- **Job** — 독립 VM에서 실행. 기본은 **병렬**. 순서를 강제하려면 `needs:`
- **Step** — Job 안에서 위→아래 순차 실행. `uses:`(Action 부품) 또는 `run:`(셸 명령)
- **Action** — `소유자/이름@버전` 형태의 재사용 부품. `with:`로 입력값 전달

### 헷갈리기 쉬운 포인트 세 가지

**1. Job끼리 파일 공유 안 된다**

같은 Workflow 안이라도 Job은 별도 VM이다. Step끼리는 같은 VM이라 공유되지만, Job 간에 데이터를 넘기려면 `outputs` 또는 artifacts로 명시적으로 전달해야 한다.

**2. Job은 기본 병렬이다**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    ...
  build:
    needs: test    # 이게 없으면 test와 build는 동시에 돈다
    ...
```

`needs:`가 없으면 선언 순서와 무관하게 동시 실행. 순서가 필요하면 반드시 `needs:`를 명시해야 한다.

**3. Action은 직접 만들 수 있다**

Marketplace 것만 쓰는 게 아니다. composite action(step 묶음), JS action, Docker action 세 종류로 직접 만들 수 있다. 가장 흔하게 쓰는 건 composite — 반복되는 step들을 `.github/actions/` 아래 `action.yml` 하나로 묶어서 재사용한다.

---

### Gate (게이트) — 파이프라인 관문

gate = "이 조건을 통과해야만 다음으로 넘어갈 수 있다". 두 종류다.

#### Quality Gate — 자동

exit code로 판정. 0이 아니면 job 실패, `needs:`로 묶인 다음 job은 안 돈다. 사람 개입 없음.

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: golangci-lint run     # exit code ≠ 0 → job 실패
  test:
    runs-on: ubuntu-latest
    steps:
      - run: go test ./...
  deploy:
    needs: [lint, test]            # 둘 다 통과해야 실행
    ...
```

Branch Protection의 "Required status checks"로 등록하면 PR merge 버튼 자체가 잠긴다.

#### Approval Gate — 사람 승인

`environment:` 하나로 구현된다. GitHub Settings → Environments에서 보호 규칙을 설정한다.

```yaml
jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: production    # 이 environment에 걸린 규칙이 gate 역할
    steps:
      - run: ./deploy.sh
```

| 규칙 | 설명 |
|------|------|
| Required reviewers | 지정한 사람 승인 후 진행 |
| Wait timer | N분 대기 후 진행 (롤백 여유 시간) |
| Deployment branches | 특정 브랜치에서만 배포 허용 |

승인권자가 Actions 화면에서 버튼을 누르기 전까지 job은 "waiting" 상태로 멈춰 있는다.

---

### 실전 레포 구조

Go 백엔드 서비스 기준으로 정리한 디렉토리 구조:

```
my-service/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # PR/push → lint + test (quality gate)
│   │   ├── deploy.yml      # main 머지 → build → prod 배포 (approval gate)
│   │   └── release.yml     # 태그 push → 릴리스
│   └── actions/
│       └── setup/
│           └── action.yml  # checkout + setup-go + 캐시 묶은 composite action
├── go.mod
└── Dockerfile
```

**composite action으로 중복 제거:**

```yaml
# .github/actions/setup/action.yml
name: 'Setup Go env'
description: 'checkout + Go 설치 + 캐시'
runs:
  using: composite
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-go@v5
      with:
        go-version: '1.22'
        cache: true
```

세 워크플로우가 매번 반복하던 3줄을 `uses: ./.github/actions/setup` 한 줄로 재사용한다.

**ci.yml (quality gate) — lint + test 병렬:**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup
      - run: go vet ./...
      - uses: golangci/golangci-lint-action@v6

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup
      - run: go test -race -coverprofile=cover.out ./...
```

**deploy.yml — Job 간 데이터 전달 + approval gate:**

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.meta.outputs.tag }}     # 다음 job으로 넘길 값
    steps:
      - uses: ./.github/actions/setup
      - id: meta
        run: echo "tag=ghcr.io/org/my-service:${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"
      - run: |
          docker build -t "${{ steps.meta.outputs.tag }}" .
          docker push "${{ steps.meta.outputs.tag }}"

  deploy-prod:
    needs: build                              # quality gate
    runs-on: ubuntu-latest
    environment: production                   # approval gate
    steps:
      - run: echo "deploying ${{ needs.build.outputs.image }}"
```

`outputs` + `needs.<job>.outputs.<key>` 패턴이 Job 간 데이터 전달의 표준이다.

**흐름 요약:**

| 트리거 | 워크플로우 | 게이트 |
|--------|-----------|--------|
| PR / main push | ci.yml | quality gate (lint + test) |
| main 머지 | deploy.yml | quality gate(build) → approval gate(environment) |
| `v*` 태그 push | release.yml | — |

## 왜 중요한가

GitHub Actions를 단순히 "자동화 스크립트" 정도로만 쓰고 있었는데, gate 개념이 연결되니까 CI/CD 파이프라인의 안전망이 어떻게 동작하는지 명확하게 보인다. Quality gate는 코드 품질을 자동으로 보장하고, approval gate는 사람이 판단해야 하는 지점(특히 prod 배포)을 강제한다. 두 개를 조합하면 "사람이 실수로 배포 버튼을 누르는" 사고를 구조적으로 막을 수 있다.

composite action으로 반복 step을 묶는 것도 그냥 편의가 아니라 — 워크플로우가 여러 개로 늘어날수록 한 곳에서 Go 버전 같은 걸 관리할 수 있게 된다. 재사용 패턴을 더 크게 묶으려면 reusable workflow도 있다.

## 참고

- [[GitHub Actions Reusable Workflow vs Composite Action]] — composite action vs reusable workflow 구조적 차이, 언제 뭘 쓸지
