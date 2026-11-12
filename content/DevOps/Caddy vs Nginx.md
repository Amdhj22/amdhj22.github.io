---
created: '2026-11-12 19:18'
updated: '2026-11-12 19:18'
tags:
  - til
  - devops
  - caddy
  - nginx
  - tls
  - reverse-proxy
publish: true
---

# TIL: Caddy vs Nginx

## 상황

"Caddy와 Nginx 차이가 뭐야?"라는 질문이 나왔다. Nginx는 몇 년째 써왔지만 Caddy가 정확히 어디서 이기는지는 정리한 적이 없었다. "설정이 짧다" 정도로만 알고 있었는데, 파고들어 보니 차이는 문법이 아니라 **책임 범위**였다.

---

## 핵심

### 1. 진짜 차이는 인증서 수명주기를 누가 소유하느냐

Caddy는 ACME 클라이언트가 서버 안에 들어 있다. 발급, 갱신, HTTP→HTTPS 리다이렉트, OCSP stapling까지 서버가 알아서 한다. Nginx는 TLS를 종료할 뿐이고, 인증서는 서버 밖(certbot + cron)에서 관리한다.

```caddyfile
example.com {
    reverse_proxy app:8080
}
```

도메인만 쓰면 끝이다. Nginx로 같은 결과를 내려면 이렇게 된다.

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://app:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

여기에 certbot 설치, 갱신 cron, 갱신 후 `nginx -s reload` 훅이 따로 붙는다. 줄 수보다 **움직이는 부품 수**가 문제다. 갱신 cron이 조용히 죽으면 90일 뒤에 장애가 난다.

### 2. Caddyfile은 어댑터일 뿐, 실체는 JSON + Admin API

Caddy의 네이티브 설정은 JSON이다. Caddyfile은 이걸 만들어주는 어댑터다. 그래서 Admin API(`localhost:2019`)로 서버를 재시작 없이 라이브로 바꿀 수 있다.

```bash
# Caddyfile을 JSON으로 변환해서 확인
caddy adapt --config Caddyfile

# 무중단 설정 반영
caddy reload --config Caddyfile
```

Nginx는 파일 수정 후 `nginx -s reload`다. 동작은 비슷하지만 Caddy는 API로 프로그래밍하기 쉽다.

> [!warning] Admin API는 localhost에만
> 인증 없이 설정 전체를 바꿀 수 있는 엔드포인트다. 외부에 바인딩하면 안 된다. 컨테이너에서는 포트 publish 대상에서 빼두는 게 기본이다.

### 3. Gotcha: Caddyfile은 위에서 아래로 읽지 않는다

Nginx 감각으로 `respond`, `reverse_proxy`, `rewrite`를 쓴 순서대로 실행될 거라 기대했다가 당했다. Caddyfile의 directive는 **고정된 내장 순서**로 실행된다. 파일에 적은 순서가 아니다.

순서를 직접 통제하려면 `handle`, `handle_path`, `route`를 쓴다.

```caddyfile
example.com {
    handle /api/* {
        reverse_proxy api:8080
    }
    handle_path /static/* {
        root * /srv/static
        file_server
    }
    handle {
        reverse_proxy web:3000
    }
}
```

같은 이름의 directive(여러 개의 `handle`)는 matcher 구체성으로 정렬된다. 더 긴 path matcher가 먼저다. 반면 Nginx `location`은 우선순위 규칙이 따로 있다. `=` 정확 일치 → 가장 긴 prefix(`^~`이면 여기서 종료) → regex 순서대로 → prefix 폴백이다. 둘 다 "적은 순서"가 아니라 "규칙"이 결정한다는 점은 같고, 규칙이 다를 뿐이다.

### 4. 기본 기능은 Nginx가 많고, Caddy는 플러그인으로 채운다

| | Nginx | Caddy |
|---|---|---|
| 캐시 | `proxy_cache` 내장 | cache-handler 플러그인 |
| Rate limit | `limit_req` 내장 | caddy-ratelimit 플러그인 |
| HTTP/3 | 1.25.0부터, 빌드 옵션 필요 | 기본 지원 |
| zstd | core에 없음, 서드파티 모듈 | 내장 encode 지원 |
| 확장 | Lua / OpenResty / njs | Go module |

Nginx HTTP/3는 `--with-http_v3_module`로 빌드해야 하고 QUIC을 지원하는 TLS 라이브러리가 필요하다. Caddy 플러그인은 `xcaddy`로 **바이너리를 다시 빌드**해서 넣는다. 런타임에 로드하는 구조가 아니다. 그래서 플러그인을 쓰는 순간 커스텀 이미지를 직접 관리해야 한다.

### 5. 운영 gotcha: Docker에서는 `/data`를 반드시 영속화

Caddy 컨테이너는 발급받은 인증서와 ACME 계정을 `/data`에 저장한다. 볼륨 없이 띄우면 재시작할 때마다 인증서를 새로 요청한다. 그러면 Let's Encrypt rate limit에 걸린다.

```yaml
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data      # 인증서 — 필수
      - caddy_config:/config  # autosave 설정
volumes:
  caddy_data:
  caddy_config:
```

공식 Caddy 이미지는 기본적으로 root로 실행된다. 운영 환경이면 non-root 실행과 80/443 바인딩 권한을 따로 챙겨야 한다.

### 6. Kubernetes에서는 둘 다 보통 edge가 아니다

클러스터에서는 TLS를 cert-manager나 ALB + ACM이 맡고, 라우팅은 Ingress / Gateway API 컨트롤러가 맡는다. Caddy든 Nginx든 "서버 하나를 직접 운영"하는 모델이 아니다.

참고로 Kubernetes 커뮤니티의 `ingress-nginx`는 retire됐다. best-effort 유지보수가 2026년 3월에 끝났다. 신규 구성은 Gateway API 구현체로 가는 게 맞다. F5의 NGINX Ingress Controller는 별개 프로젝트라 헷갈리면 안 된다.

---

## 정리: 선택 기준

**Caddy가 맞는 경우**
- 노드가 적고 Compose / VM 위에서 돌린다.
- 온프레미스 어플라이언스처럼 고객 환경에 배포하고, 인증서 운영 부담을 줄이고 싶다.
- 사내 도구, 소규모 서비스.
- SaaS에서 고객 커스텀 도메인을 받아야 한다 (On-Demand TLS).

**Nginx가 맞는 경우**
- 트래픽이 많고 세밀한 튜닝이 필요하다.
- 팀에 이미 Nginx 노하우와 hardening 절차가 있다.
- 캐시, rate limit 같은 기능을 내장으로 바로 쓰고 싶다.

한 줄로 줄이면, **Caddy는 "인증서까지 포함한 서버"이고 Nginx는 "튜닝 가능한 고성능 프록시"**다. 성능 우열이 아니라 운영 부담을 어디에 두느냐의 선택이다.

---

## 왜 중요한가

설정 줄 수만 비교하면 Caddy가 쉽다는 결론에서 멈춘다. 실제로는 인증서 갱신 실패, volume 누락, directive 순서 같은 운영 쪽 함정이 차이를 만든다. 둘 다 알아두면 환경에 맞게 고를 수 있다.

---

## 참고

- [[DevOps]] — DevOps TIL 목록
- [[K8s]] — Kubernetes 관련 TIL
