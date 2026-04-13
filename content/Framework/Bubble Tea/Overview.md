---
created: '2026-04-13 15:31'
tags:
  - til
  - bubbletea
  - go
  - tui
publish: true
---

## Go TUI 라이브러리 비교

| 라이브러리 | 특징 | 적합한 상황 |
|-----------|------|------------|
| **Bubble Tea** | Elm Architecture 기반, 함수형 | 복잡한 인터랙티브 TUI |
| **tview** | 컴포넌트 기반, 명령형 | 어드민/대시보드 스타일 |
| **gocui** | 저수준, LazyGit 내부 사용 | 판넬 기반 앱 |
| **promptui** | 단순 입력 프롬프트 특화 | select/confirm/input만 필요할 때 |
| **pterm** | CLI 출력 꾸미기 | 풀 TUI 아닌 출력 스타일링 |

## Bubble Tea 에코시스템

```
Bubble Tea   → 프레임워크 (상태관리, 이벤트루프)
Bubbles      → 공통 컴포넌트 (textinput, spinner, table 등)
Lip Gloss    → 스타일링 (색상, 테두리, 레이아웃)
```

## 선택 기준

```
값 입력 → 결과 표시 (one-shot)    → promptui + pterm
실시간 인터랙티브 / TUI 학습       → Bubble Tea + Lip Gloss
어드민 패널 / 대시보드             → tview
LazyGit 스타일 판넬 앱             → gocui
```

## DevOps 활용 사례

k9s, lazydocker, stern 등 DevOps 필수 툴이 이 생태계로 만들어져 있다.

만들어볼 만한 TUI 툴:
- k8s namespace/pod 브라우저 → tview TreeView
- ArgoCD app 상태 대시보드 → Bubble Tea + REST polling
- 멀티 클러스터 컨텍스트 전환기 → promptui

---

**Related**: [[Bubble Tea]] | [[Core]] | [[Lip Gloss]]
