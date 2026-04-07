---
createdAt: '2026-04-07 17:00'
tags:
  - til
  - ruby
  - basics
publish: true
---

## 핵심 철학

- **인간 중심** — "컴퓨터가 아닌 개발자를 위한 언어" (Matz)
- **모든 것이 객체** — 숫자 `1`조차 메서드를 가짐
- **TIMTOWTDI** — 동일한 일을 하는 방법은 여러 가지 (vs Go의 단일 방식)

## 변수 스코프

```ruby
name      # 지역 변수 (snake_case)
@name     # 인스턴스 변수
@@count   # 클래스 변수
$global   # 전역 변수
VERSION   # 상수
```

## 메서드

```ruby
def add(a, b)
  a + b       # return 생략 가능 (마지막 줄 자동 반환)
end

def valid?    # 물음표: boolean 반환 관례
def save!     # 느낌표: 원본 수정 / 위험한 동작 관례
```

## 조건문

```ruby
puts "허용" if user.admin?
puts "로그인 필요" unless user.logged_in?

result = if x > 0 then "양수" else "음수" end
```

## 컬렉션

```ruby
arr = [1, 2, 3, 4, 5]
arr.select(&:even?)         # [2, 4]
arr.map { |v| v * 2 }       # [2, 4, 6, 8, 10]
arr.reduce(:+)              # 15

hash = { name: "Hyojae", role: "Lead" }
hash[:name]                 # "Hyojae"
```

## Symbol vs String

```ruby
"name"   # 변경 가능, 매번 새 객체 생성
:name    # 변경 불가, 고유 ID → Hash key로 선호 (메모리 효율적)
```

## 블록 (Block)

Ruby의 핵심. 코드 조각을 메서드에 전달.

```ruby
[1, 2, 3].each { |n| puts n }
[1, 2, 3].each do |n|
  puts n
end

# yield로 블록 실행
def repeat(n)
  n.times { yield }
end
repeat(3) { puts "hello" }
```

## Go / Rust와 비교

| 특징 | Ruby | Go | Rust |
|------|------|------|------|
| 타입 | 동적 | 정적 | 정적 |
| 메모리 | GC | GC | Ownership |
| 실행 | 인터프리터 | 컴파일 | 컴파일 |
| 강점 | 생산성, 표현력 | 동시성, DevOps 툴 | 성능, 안전성 |
