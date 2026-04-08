---
createdAt: '2026-04-07 18:00'
tags:
  - til
  - spring
  - jsp
  - frontend
publish: true
---

## Spring Boot + JSP vs React

| Feature | Spring Boot + React | Spring Boot + JSP |
|---------|--------------------|--------------------|
| Frontend | 모던, 동적 UI | 서버 렌더링, 구식 |
| 확장성 | 높음 (프론트/백 독립) | 낮음 (타이트 커플링) |
| 개발 방식 | 디커플드 | 백/프론트 혼합 |
| UI 성능 | 인터랙티브 | 매 요청마다 페이지 리로드 |

**결론**: 신규 프로젝트에서 JSP 선택 이유 없음. React/Vue + REST API 구조가 표준.

JSP는 레거시 유지보수 목적으로만 접할 일 있음.
