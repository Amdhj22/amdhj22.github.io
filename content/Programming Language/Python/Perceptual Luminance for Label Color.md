---
created: '2026-04-27 14:00'
tags:
  - til
  - python
  - pil
  - pillow
  - color
  - luminance
  - accessibility
publish: true
---

## 한 줄 요약

배경색 위에 **검은/흰 라벨 중 뭘 올릴지** 결정할 때 HSL lightness로 판단하면 노란색에서 깨진다. **Rec. 601 perceptual luminance** (`Y = 0.299R + 0.587G + 0.114B`) 를 써야 사람 눈에 맞게 결정된다.

## 함정: HSL lightness는 사람 눈을 안 따라간다

`#ffd84d` (노란색)을 두 방식으로 보면:

| 방식 | 값 | 라벨 색 결정 |
|---|---|---|
| HSL lightness | L = 0.65 | 검정? 흰색? 애매하게 갈림 |
| 인간 시각 | 매우 밝음 | 명백히 **검정 라벨** |

HSL은 RGB를 동등하게 보지만, 사람 눈은 **G(녹색)에 가장 민감, B(파랑)에 가장 둔감**하다. 그래서 같은 RGB max 값이어도 노랑(R+G high)이 파랑(B high)보다 훨씬 밝게 느껴진다.

HSL로 라벨 색 자동 선택하면 노란 chip 위에 흰 라벨이 올라가는 가독성 사고가 난다.

## Rec. 601 luminance 공식

```python
def label_on(bg: tuple[int, int, int]) -> tuple[int, int, int]:
    """Pick readable label color using Rec. 601 luminance."""
    r, g, b = bg
    y = 0.299 * r + 0.587 * g + 0.114 * b
    return (10, 17, 40) if y > 140 else (200, 208, 232)
```

- 가중치 `0.299 / 0.587 / 0.114` 는 **NTSC 시절부터 검증된 시각 감도 비율**
- threshold `140` (255 중) ≈ 55% — WCAG 대비 가이드와 부합
- 8비트 정수 RGB만 다루면 이 단순 공식으로 충분

## 더 엄밀히: Rec. 709 linearized luminance

sRGB는 감마 보정된 색 공간이라 엄밀히는 **linear RGB로 변환 후** Y를 계산해야 한다.

```python
def srgb_to_linear(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def luminance_709(rgb):
    r, g, b = (srgb_to_linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b   # 0.0 ~ 1.0
```

- WCAG 2.x 대비 계산은 이 방식
- 단순히 "검정 vs 흰 라벨" 정하는 용도엔 Rec. 601이 거의 동등하게 동작 (체감 차이 거의 없음)
- 정확한 대비비(contrast ratio) 측정해야 할 때만 Rec. 709 사용

## PIL에서 어두운 chip 경계 처리

palette 배경(`base`/`mantle`)과 거의 같은 chip은 luminance 임계값으로 **경계선을 추가**해야 사라지지 않는다.

```python
r, g, b = bg
if 0.299 * r + 0.587 * g + 0.114 * b < 20:   # 거의 검정
    draw.rounded_rectangle(box, radius=10,
                           outline=(58, 68, 102), width=1)
```

## 실전 임계값 가이드

| Y 값 | 의미 | 처리 |
|---:|---|---|
| < 20 | 배경과 거의 동일 | outline 추가 |
| 20 ~ 140 | 어두운 색 | 흰 라벨 |
| > 140 | 밝은 색 | 검은 라벨 |

## 관련 링크

- [[Programming Language]]
