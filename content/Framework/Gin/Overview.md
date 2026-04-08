---
created: '2026-04-07 18:00'
tags:
  - til
  - gin
  - go
publish: true
---

## 개요

Go HTTP 프레임워크. `httprouter` 기반으로 표준 `net/http` 대비 40x 빠른 라우팅. Go 생태계 HTTP 프레임워크 중 Stars 1위.

## 최소 서버

```go
import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default() // Logger + Recovery 포함
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "pong"})
    })
    r.Run(":8080")
}
```

## 라우팅

```go
r.GET("/users/:id", func(c *gin.Context) {
    id := c.Param("id")
    page := c.DefaultQuery("page", "1")
    c.JSON(200, gin.H{"id": id})
})

// 그룹
v1 := r.Group("/v1")
v1.GET("/users", listUsers)
```

## 미들웨어

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
            return
        }
        c.Set("userID", parseToken(token))
        c.Next()
    }
}

auth := r.Group("/api")
auth.Use(AuthMiddleware())
```

## 요청 바인딩

```go
type CreateUserRequest struct {
    Name  string `json:"name"  binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

func createUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
}
```

## Echo, Chi와 비교

| | Gin | Echo | Chi |
|---|---|---|---|
| 특징 | 빌트인 풍부, 생태계 최대 | 풍부 | stdlib 친화적, 최소 |
| 선택 기준 | 범용 | Echo 플러그인 필요시 | stdlib 호환 중시 |
