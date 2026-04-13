---
created: '2026-04-13 15:31'
tags:
  - til
  - bubbletea
  - go
  - tui
publish: true
---

## 개요

Charm 팀의 Go TUI 프레임워크. Elm Architecture 기반 함수형 패턴으로 상태를 관리한다.  
v2는 `charm.land/bubbletea/v2` 경로로 임포트.

## 설치

```bash
go get charm.land/bubbletea/v2@latest
go get charm.land/bubbles/v2@latest
go get charm.land/lipgloss/v2@latest
```

## v1 vs v2 핵심 변경사항

| 항목 | v1 | v2 |
|------|----|----|
| import | `github.com/charmbracelet/bubbletea` | `charm.land/bubbletea/v2` |
| 키 이벤트 타입 | `tea.KeyMsg` | `tea.KeyPressMsg` |
| `View()` 반환 | `string` | `tea.View` |
| AltScreen 설정 | `tea.WithAltScreen()` (옵션) | `v.AltScreen = true` (View 필드) |
| 컴포넌트 Width | `ti.Width = 30` | `ti.SetWidth(30)` |

## Model 인터페이스

```go
type Model interface {
    Init()                     tea.Cmd
    Update(msg tea.Msg)        (tea.Model, tea.Cmd)
    View()                     tea.View
}
```

## 동작 흐름

```
이벤트 발생 → Update(msg) → 상태 업데이트 → View() → 터미널 렌더링
```

## textinput 사용

```go
ti := textinput.New()
ti.Placeholder = "입력하세요"
ti.Focus()
ti.SetWidth(30)  // v2 필수 — 미설정 시 placeholder 첫 글자만 표시

func (m model) Init() tea.Cmd {
    return textinput.Blink  // 커서 깜빡임
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    var cmd tea.Cmd
    m.input, cmd = m.input.Update(msg)  // 자식 컴포넌트에 이벤트 전달 필수
    return m, cmd
}
```

## 여러 입력 필드 관리

```go
const (
    FieldAmount = iota
    FieldYears
    FieldCount
)

type Model struct {
    Inputs  [FieldCount]textinput.Model
    Focused int
}

func (m Model) nextFocus() Model {
    m.Inputs[m.Focused].Blur()
    m.Focused = (m.Focused + 1) % FieldCount
    m.Inputs[m.Focused].Focus()
    return m
}
```

## 화면 전환 패턴

```go
type Step int

const (
    StepInput  Step = iota
    StepResult
)

func (m Model) View() tea.View {
    switch m.Step {
    case StepInput:
        return tea.NewView(renderInput())
    case StepResult:
        return tea.NewView(renderResult())
    }
    return tea.NewView("")
}
```

## 주의사항

- `View()`에서 직접 I/O 금지 → 반드시 `Update()`에서 상태 변경
- 자식 컴포넌트(textinput 등)는 `Update()`에서 직접 이벤트 전달해야 동작
- textinput v2에서 `SetWidth()` 미설정 시 placeholder 첫 글자만 표시 (내부 슬라이스 크기 문제)
- v1 마이그레이션 시 `KeyMsg` → `KeyPressMsg`, `string` → `tea.View` 반드시 변경

---

**Related**: [[Bubble Tea]] | [[Lip Gloss]] | [[Overview]]
