---
created: '2026-05-06 14:00'
tags:
  - til
  - devops
  - github-actions
  - ci-cd
publish: true
updated: '2026-05-06 14:00'
---

# GitHub Actions Secret Newline 함정

GitHub Actions secret 값 끝에 줄바꿈(`\n` 또는 `\r\n`)이 섞이면 그 secret을 HTTP header에 그대로 넣었을 때 API가 거부한다.

## 증상

```text
API Error: Header '14' has invalid value: '***
***'
```

`***`가 두 줄로 표시되는 게 단서 — secret value 안에 줄바꿈이 들어 있다는 뜻.

## 원인

- GitHub Secrets는 web UI에 붙여 넣은 값을 **trim 없이 그대로 저장**
- 터미널 출력을 복사할 때 trailing `\n` 또는 `\r`(Windows clipboard 경유 시)이 같이 들어감
- HTTP header value는 RFC 9110에 따라 CR/LF 허용 X → API 서버가 invalid value로 reject
- (보안 관점) header value 안의 CR/LF는 **HTTP response splitting / header injection** 벡터라 서버가 엄격히 reject하는 게 정상

## 처방

### 1. 등록 시점에 trim (정석)

macOS 기준:

```bash
# token을 stdout으로 뱉는 명령에서 곧장 클립보드까지
some-token-cmd | tr -d '\n\r ' | pbcopy
```

Linux: `pbcopy` 대신 `xclip -selection clipboard` 또는 `wl-copy`.

### 2. workflow 안에서 trim (안전망)

secret이 다시 더러워질 가능성에 대비:

```yaml
- name: Call API
  env:
    TOKEN: ${{ secrets.SOME_TOKEN }}
  run: |
    # printf '%s' 는 trailing newline 안 붙임 (echo 와 차이)
    export TOKEN="$(printf '%s' "$TOKEN" | tr -d '\n\r\t ')"
    curl -H "Authorization: Bearer $TOKEN" ...
```

여기서 `printf | tr` 파이프는 stdin/stdout이라 GitHub의 secret 자동 마스킹이 그대로 유지된다 (로그에 `***`로 노출됨).

## 헷갈리지 말 것

- `echo "$TOKEN"` 은 trailing `\n`을 **새로 붙임** → trim 용도엔 부적절
- `echo -n "$TOKEN"` 는 shell 따라 동작 다름 → 이식성 X
- 항상 `printf '%s' "$TOKEN"` 사용

## 관련

- [[DevOps]]
