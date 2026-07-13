---
created: '2026-07-10 11:30'
updated: '2026-07-10 11:30'
tags:
  - til
  - github-actions
  - ci-cd
  - devops
publish: true
---

# TIL: Reusable Workflow는 레포를 clone하지 않는다

## 상황

팀 CI 중앙화 작업을 리뷰하다가 이상한 에러를 봤다. 공유 레포의 lint 워크플로를 reusable workflow로 호출했더니 pre-commit이 **runner 토큰 권한 부족**으로 실패했다. 얼마 지나지 않아 같은 로직을 composite action으로 전환하는 PR이 올라왔고, 그걸로 해결됐다. 왜 reusable workflow에서는 안 됐고 composite action에서는 됐을까.

## 핵심

### 오해 1 — "reusable workflow가 레포를 clone하는 거겠지?"

첫 반응이 그거였다. reusable workflow를 호출하면 어딘가에서 레포를 가져오는 건데, 거기서 토큰이 부족한 거 아닐까?

아니었다. GitHub은 워크플로 **YAML 파일 한 장만** 서버에서 읽어 빈 러너에서 독립 job으로 실행한다. 러너 파일시스템에 레포는 없다. 실패한 clone의 주체는 GitHub이 아니라 **pre-commit 프로그램**이었다. pre-commit 설정 파일이 `repo: github.com/org/common-ci`를 훅 소스로 참조하고 있었고, pre-commit이 그걸 런타임에 git clone으로 가져오려다 터진 것이다.

### 오해 2 — "checkout하면 그 워크플로 레포가 들어오겠지?"

reusable workflow 안에서 `actions/checkout`을 쓰면 **그 워크플로를 소유한 레포**가 체크아웃될 거라 생각했다. 역시 아니었다.

reusable workflow 안의 `actions/checkout`은 기본적으로 **트리거한 소비자 레포**를 체크아웃한다. 워크플로 소유 레포 자신의 스크립트가 필요하다면 `repository:`와 접근 토큰을 명시해야 한다. 바로 이 지점에서 토큰 문제가 발생한다.

```yaml
# reusable workflow 안에서 자신의 레포 코드를 가져오려면
- uses: actions/checkout@v4
  with:
    repository: org/common-ci
    token: ${{ secrets.COMMON_CI_TOKEN }}  # ← 토큰 필요
```

### composite action은 왜 달랐나

`uses: org/common-ci/actions/lint@v1` 한 줄이면, GitHub이 그 액션 레포 전체를 러너의 `$GITHUB_ACTION_PATH`에 자동으로 다운로드한다. 형제 스크립트까지 로컬에 존재하므로 원격 clone도, 토큰도 필요 없다.

결국 구조적 차이는 이것이다:

- reusable workflow → GitHub이 YAML만 읽음. 레포 파일시스템 없음
- composite action → GitHub이 레포 전체를 러너에 내려줌

이게 같은 로직인데 결과가 달랐던 근본 이유다.

### 굳힌 멘탈모델

> 레포에 딸린 스크립트를 써야 하면 composite action.  
> job 오케스트레이션(matrix, environment 게이트, OIDC)이 필요하면 reusable workflow.

실행 단위도 같이 기억해두면 좋다. reusable workflow는 **job** 단위 재사용이라 별도 러너가 뜬다. composite action은 **step** 단위라 호출 job의 러너를 그대로 쓴다. 그래서 호출측 워크스페이스(체크아웃된 코드)에 바로 접근할 수 있다.

### 왜 "토큰 주입"을 안 썼나

"그냥 토큰 넣으면 되는 거 아닌가?"라는 생각이 들었다. 하지만 이건 미봉책이다.

토큰을 주입하려면 모든 소비자 레포에 credential을 배포해야 하고, 회전 주기마다 N곳을 관리해야 한다. 보안 blast radius가 소비자 레포 수만큼 커진다. 더 근본적으로는 reusable workflow가 런타임에 레포를 clone하는 것 자체가 non-hermetic이다. 네트워크 상태나 브랜치 상태에 따라 결과가 달라질 수 있다. composite action은 clone 자체를 없애 이 문제를 뿌리에서 제거한다.

## 왜 중요한가

GitHub Actions 재사용 패턴을 고를 때 "job이냐 step이냐"만 따졌는데, **fetch 주체와 대상**이 훨씬 결정적인 요소였다. 공유 레포의 스크립트를 재사용하는 패턴이라면 처음부터 composite action이 정답이다. reusable workflow로 시작했다가 토큰 문제를 만나면 구조를 갈아엎어야 하는 상황이 생긴다.

## 참고

- [[Reusable Workflow vs Composite Action]] — 비교표 + fetch 주체 차이 + 판단 기준 상세
- [GitHub Docs — Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [GitHub Docs — Creating composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
