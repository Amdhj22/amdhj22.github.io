# TIL (Today I Learned)

> 매일 배운 것들을 기록하고 공유하는 공간

[![Quartz](https://img.shields.io/badge/Quartz-Published-blue)](https://Amdhj22.github.io/quartz)

## 🚀 About

Backend/DevOps 엔지니어로 일하며 배운 내용들을 정리합니다.

- **Tech Stack**: Go, Rust, Python, Kotlin, Java
- **DevOps**: Kubernetes, ArgoCD, GitHub Actions, AWS
- **Auto-sync**: Obsidian Vault → GitHub → Quartz 자동 배포

## 📚 Categories

### Programming Language
- **Go** — Goroutine, Channel, Context, Project Layout
- **Rust** — Ownership, Trait, Cargo, Module System
- **Ruby** — Basics, rbenv
- **Python** — Perceptual Luminance, PIL, uv, Poetry, tenacity

### Framework
- **Gin** — Go HTTP Framework
- **FastAPI** — Python Async Web Framework
- **Rails** — Ruby on Rails
- **Spring** — Spring Boot

### DevOps
- Kubernetes, CI/CD, Infrastructure

### Middleware
- API Gateway, Message Queue, Service Mesh

## 🌐 Published Site

이 저장소의 내용은 [Quartz](https://quartz.jzhao.xyz/)를 통해 자동으로 배포됩니다.

👉 **[https://Amdhj22.github.io/quartz](https://Amdhj22.github.io/quartz)**

## 📝 Writing Rules

- 파일명 형식: 명확한 제목
- Frontmatter: `created`, `tags`, `publish` 필드 사용
- 카테고리별 폴더 구조 유지

## 🔄 Auto-sync Workflow

```
Obsidian Vault (Private)
    ↓ (obsidian-git)
GitHub Private Repo
    ↓ (publish.yml - rsync)
TIL Public Repo (this)
    ↓ (Quartz deploy)
GitHub Pages
```

---

**Last Updated**: Auto-synced via GitHub Actions
