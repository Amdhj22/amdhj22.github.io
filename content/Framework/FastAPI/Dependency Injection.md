---
created: '2026-04-07 18:00'
tags:
  - til
  - fastapi
  - python
  - dependency-injection
publish: true
---

## DI 패턴

FastAPI의 핵심 기능. 공통 로직을 `Depends`로 주입해 중복 제거.

```python
from fastapi import Depends

# 1. DB 세션
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. 인증
async def get_current_user(
    token: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    user = verify_token(token, db)
    if not user:
        raise HTTPException(401, "Unauthorized")
    return user

# 3. 권한
async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Forbidden")
    return user

# 라우터에서 사용
@app.get("/admin/users")
async def admin_list(user: User = Depends(require_admin)):
    pass
```

## 라우터 레벨 의존성

```python
# 모든 라우트에 자동 적용
router = APIRouter(
    prefix="/api",
    dependencies=[Depends(get_current_user)]
)
```

## Go의 Gin 미들웨어와 비교

| | FastAPI Depends | Gin Middleware |
|---|---|---|
| 방식 | 함수 파라미터 주입 | 체인 실행 |
| 타입 안전성 | Pydantic으로 강함 | `c.Get()` 로 약함 |
| 테스트 | override 가능 | 모킹 필요 |
| 적합한 경우 | 세밀한 per-route 제어 | 전역/그룹 공통 처리 |
