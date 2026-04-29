---
created: '2026-04-29 18:31'
publish: true
tags:
  - til
  - go
  - error-handling
  - stdlib
updated: '2026-04-29 18:31'
---

# errors.Join — 여러 에러를 하나로 합치는 표준 함수

> Go 1.20+ 부터 표준 라이브러리에 추가됨. 이전엔 `hashicorp/go-multierror` 같은 외부 패키지가 필요했음.

## 시그니처

```go
func Join(errs ...error) error
```

- nil 인자는 자동으로 무시
- 모든 인자가 nil 이면 nil 반환
- 그 외에는 `errs` 를 묶은 wrapper error 반환 (`Error()` 는 각 에러의 메시지를 `\n` 으로 join)

## 왜 쓰는가

여러 작업의 에러를 모아서 한 번에 보고하고 싶을 때. 한쪽 실패했다고 다른 작업까지 멈출 수 없는 정리(cleanup) 흐름이나 batch validation 에 자주 등장.

```go
func closeAll(closers []io.Closer) error {
    var errs []error
    for _, c := range closers {
        if err := c.Close(); err != nil {
            errs = append(errs, err)
        }
    }
    return errors.Join(errs...)
}
```

## errors.Is / errors.As 와 호환

가장 중요한 부분. 합쳐진 에러도 sentinel 비교가 동작한다.

```go
err := errors.Join(io.EOF, os.ErrNotExist)

errors.Is(err, io.EOF)         // true
errors.Is(err, os.ErrNotExist) // true

var pathErr *os.PathError
errors.As(err, &pathErr)       // 하나라도 매칭되면 true
```

`fmt.Errorf("%w: %w", e1, e2)` (Go 1.20+ multi-wrap) 와 동등한 효과지만, 가변 인자 슬라이스에서 바로 만들 수 있어 루프에서 누적할 때 더 자연스럽다.

## fmt.Errorf 와 비교

| 상황 | 권장 |
|------|------|
| 에러에 컨텍스트 메시지를 붙여 wrapping | `fmt.Errorf("doing X: %w", err)` |
| 정해진 2~3개 에러를 묶음 | `fmt.Errorf("%w; %w", e1, e2)` |
| 개수가 가변인 에러 슬라이스를 묶음 | `errors.Join(errs...)` |

## 출력 포맷 주의

기본 `Error()` 는 `\n` 구분이라 한 줄 로그에는 좋지 않다. 구조화된 로깅을 쓴다면 `errors.Join` 결과를 그대로 메시지에 박지 말고, 내부 에러를 풀어서 array 필드로 로깅하는 편이 사후 분석에 낫다.

```go
// zerolog 예시
logger.Err(joined).Strs("errors", errStrings(joined)).Msg("cleanup failed")
```

## 관련 노트

- [[errgroup]] — goroutine 단위로 에러를 모을 땐 errgroup 이 더 적합 (첫 에러 기준 cancel)
- [[Context]] — context 취소 에러 (`context.Canceled`, `context.DeadlineExceeded`) 도 errors.Is 로 검사
