---
created: '2026-04-27 14:30'
tags:
  - til
  - python
  - tenacity
  - retry
  - polling
publish: true
---

## 한 줄 요약

`tenacity`는 **재시도 로직을 데코레이터로 선언**하는 Python 라이브러리. wait/stop/retry 3축으로 동작이 결정된다.

## 기본 패턴

```python
from tenacity import retry, wait_fixed, stop_never, retry_if_result, before_sleep_log
import logging

@retry(
    wait=wait_fixed(30),                              # 30초 고정 대기
    stop=stop_never,                                  # 무한 반복
    retry=retry_if_result(lambda r: r is None),       # None이면 재시도
    before_sleep=before_sleep_log(logger, logging.DEBUG),
)
def poll() -> Item | None:
    return try_fetch()
```

## 3축 옵션

### wait — 대기 전략

```python
wait_fixed(30)                       # 고정
wait_exponential(min=1, max=60)      # 지수 (1→2→4→...→60)
wait_random(min=1, max=5)            # 랜덤
```

### stop — 종료 조건

```python
stop_never                           # 무한
stop_after_attempt(10)               # 횟수
stop_after_delay(3600)               # 누적 시간
```

### retry — 재시도 트리거

```python
retry_if_result(lambda r: r is None)    # 반환값 기반
retry_if_exception_type(IOError)        # 예외 기반
retry_if_not_result(bool)               # falsy면 재시도
```

## 함정: `before_sleep_log` 레벨 인자

```python
# ❌ 문자열 레벨 (loguru 스타일) 안 됨
before_sleep=before_sleep_log(logger, "DEBUG")

# ✅ stdlib logging 정수 상수만 받음
before_sleep=before_sleep_log(logger, logging.DEBUG)
```

tenacity는 stdlib `logging` 레벨 상수(int)를 기대한다. 문자열 넘기면 런타임에 깨짐.

## tenacity vs 수동 while 루프

| | tenacity | `while` + `threading.Event` |
|---|---|---|
| 외부 즉시 중단 | 어려움 | `stop_event.set()` |
| 코드 간결성 | 데코레이터 한 줄 | 보일러플레이트 |
| 복잡한 분기 | 어려움 | 유연 |

**선택 기준**: 외부에서 중단/재시작 제어가 필요하면 수동 while + Event. 단순 재시도면 tenacity.

## 관련 링크

- [[Python]]
