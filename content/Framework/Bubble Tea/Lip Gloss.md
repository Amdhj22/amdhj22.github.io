---
created: '2026-04-13 15:31'
tags:
  - til
  - lipgloss
  - go
  - tui
publish: true
---

## 개요

Charm 팀의 Go 터미널 스타일링 라이브러리.  
ANSI 스타일(색상, 테두리, 패딩, 정렬)을 체이닝 방식으로 선언적으로 정의한다.  
v2부터 `charm.land/lipgloss/v2` 경로로 임포트. Bubble Tea v2와 함께 사용.

## 기본 사용법

```go
import "charm.land/lipgloss/v2"

style := lipgloss.NewStyle().
    Bold(true).
    Foreground(lipgloss.Color("#7D56F4")).
    Background(lipgloss.Color("#1a1a2e")).
    Padding(1, 2).
    Width(40)

output := style.Render("Hello, World!")
```

## 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `.Bold(true)` | 굵게 |
| `.Italic(true)` | 기울임 |
| `.Foreground(color)` | 글자색 |
| `.Background(color)` | 배경색 |
| `.Border(type)` | 테두리 |
| `.BorderForeground(color)` | 테두리 색 |
| `.Padding(상하, 좌우)` | 안쪽 여백 |
| `.Margin(상하, 좌우)` | 바깥 여백 |
| `.Width(n)` | 너비 고정 |
| `.Align(lipgloss.Center)` | 정렬 |

## 색상 지정

```go
lipgloss.Color("#7D56F4")   // hex (트루컬러)
lipgloss.Color("205")       // ANSI 256색
lipgloss.Color("9")         // ANSI 기본 16색
```

터미널 색상 프로파일에 따라 자동 다운샘플링됨.

## 테두리 종류

```go
lipgloss.NormalBorder()   // ┌─┐│└─┘
lipgloss.RoundedBorder()  // ╭─╮│╰─╯
lipgloss.DoubleBorder()   // ╔═╗║╚═╝
lipgloss.ThickBorder()    // ┏━┓┃┗━┛
```

## 스타일 재사용 패턴

```go
// ui/styles.go
var (
    BoxStyle = lipgloss.NewStyle().
        Border(lipgloss.RoundedBorder()).
        BorderForeground(lipgloss.Color("#7D56F4")).
        Padding(1, 3).
        Width(50)

    TitleStyle = lipgloss.NewStyle().
        Bold(true).
        Foreground(lipgloss.Color("#7D56F4"))

    ErrorStyle = lipgloss.NewStyle().
        Foreground(lipgloss.Color("#FF5555"))
)
```

## 주의사항

- `Width()` 설정 시 전체 박스 너비 기준 — 테두리 있으면 실제 내용 너비 = Width - 2
- Lip Gloss는 스타일만 처리, I/O는 Bubble Tea가 전담

---

**Related**: [[Bubble Tea]] | [[Core]] | [[Overview]]
