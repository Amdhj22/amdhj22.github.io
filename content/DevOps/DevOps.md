---
created: '2026-04-07 18:00'
tags:
  - til
  - devops
  - index
---

# DevOps

인프라, 배포, 운영 도구 TIL 모음.

## 목록

- Kubernetes
- ArgoCD
- Ansible
- Docker
- Istio
- GitHub Actions
- Terraform

---

## Neovim + noice + tmux 조합 주의사항 (2026-04-10)

### noice 사용 시 `cmdheight = 0` 필수

noice는 cmdline을 floating window로 대체함. `cmdheight >= 1`이면 하단 영역과 floating 위치 계산이 충돌해서 split 많을 때 cmdline이 사라지는 현상 발생.

```lua
opt.cmdheight = 0  -- noice가 cmdline을 완전히 소유
```

### tmux `aggressive-resize` + noice floating 버그

`aggressive-resize on` 환경에서 pane 리사이즈 시 noice floating 창이 viewport 밖으로 사라짐.

```lua
-- VimResized 시 noice 강제 dismiss
autocmd('VimResized', {
  callback = function()
    if package.loaded['noice'] then require('noice').cmd('dismiss') end
  end,
})
```

### noice `bottom_search = false` 해야 검색도 가운데

`presets.bottom_search = true`(기본값)면 `/`, `?` 검색이 noice cmdline_popup 설정을 무시하고 하단 고정.

### aerospace `on-focus-changed` 성능 패턴

`exec-and-forget` 명령은 매 포커스 변경마다 실행됨. `borders`같은 설정성 명령은 `after-startup-command`에서 한 번만 실행하고 `on-focus-changed`에서는 제거할 것.
