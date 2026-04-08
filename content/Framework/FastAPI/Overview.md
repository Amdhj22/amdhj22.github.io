---
createdAt: '2026-04-07 18:00'
tags:
  - til
  - fastapi
  - python
  - async
publish: true
---

## 개요

Python 고성능 비동기 웹 프레임워크. Starlette(ASGI) + Pydantic v2 조합. OpenAPI 자동 생성, AI/ML 서빙에 자주 쓰임.

## 최소 서버

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/ping")
async def ping():
    return {"message": "pong"}
```

```bash
uvicorn main:app --reload       # 개발
uvicorn main:app --workers 4    # 프로덕션
```

## Pydantic 모델

```python
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    age: int = Field(..., ge=0, le=150)

@app.post("/users", status_code=201, response_model=UserResponse)
async def create_user(user: CreateUserRequest):
    return user
```

## Dependency Injection

```python
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Header(...)) -> User:
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Unauthorized")
    return user

@app.get("/profile")
async def profile(user: User = Depends(get_current_user)):
    return user
```

## Flask, Django와 비교

| | FastAPI | Flask | Django |
|---|---|---|---|
| 비동기 | 네이티브 | 제한적 | 제한적 |
| 타입 검증 | Pydantic 내장 | 없음 | Form만 |
| OpenAPI | 자동 생성 | 플러그인 | 플러그인 |
| 적합한 경우 | API 서버, ML 서빙 | 소규모 | 풀스택 |

## DevOps 관점

- stateless → K8s HPA 수평 확장 적합
- CPU 바운드 작업은 `run_in_executor`로 스레드풀 위임 필수
- 단일 컨테이너에서 `uvicorn --workers N` 보다 K8s replica 권장
