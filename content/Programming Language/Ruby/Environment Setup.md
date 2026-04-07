---
createdAt: '2026-04-07 17:00'
tags:
  - til
  - ruby
  - setup
  - rbenv
publish: true
---

## rbenv (버전 관리)

```bash
brew install rbenv ruby-build

# 쉘 설정 추가 (~/.zshrc)
eval "$(rbenv init - zsh)"

rbenv install 3.3.0
rbenv global 3.3.0
ruby --version
```

## Gemfile (의존성 관리)

```ruby
# Gemfile
source "https://rubygems.org"

gem "puma"
gem "dotenv"

group :development, :test do
  gem "rspec"
  gem "rubocop"
end
```

```bash
bundle install     # 의존성 설치
bundle exec ruby   # Gemfile 환경에서 실행
```

## 주요 도구

| 도구 | 역할 |
|------|------|
| `rbenv` | Ruby 버전 관리 |
| `bundler` | 의존성 관리 (go mod 역할) |
| `rubocop` | 린터 + 포매터 |
| `rspec` | 테스트 프레임워크 |
| `pry` | 인터랙티브 디버거 |
