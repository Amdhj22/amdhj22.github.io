---
created: 2026-06-02 10:00
updated: 2026-06-02 10:00
tags: [til, lua, neovim]
---

# TIL: Lua table과 metatable

## 상황

Neovim 설정을 작성하다 보면 `require('plugin').setup({...})`처럼 table을 매일 넘긴다. Lua의 table이 어떻게 작동하는지, metatable로 무엇을 할 수 있는지 정리하고 싶었다.

## 핵심

### table이 전부다

Lua에는 table 하나뿐이다. 배열, 딕셔너리, 객체, 네임스페이스 — 전부 table로 표현한다. 내부적으로는 **array part**(연속 정수 키)와 **hash part**(나머지 키)를 혼합한 구조다.

```lua
-- 배열처럼
local arr = {"a", "b", "c"}
print(arr[1])  -- "a"  ← 1-base! 0이 아니다

-- 딕셔너리처럼
local dict = {name = "neovim", version = 10}
print(dict.name)  -- "neovim"

-- 혼합
local mixed = {1, 2, key = "val", 3}
```

**1-base 인덱스**는 C/Go 출신이 가장 자주 실수하는 부분이다. `t[0]`은 `nil`을 반환하고 에러도 없다.

#### `#t` 길이 연산자

```lua
local t = {"a", "b", "c"}
print(#t)  -- 3

-- nil hole이 있으면 결과가 정의되지 않는다
local t2 = {1, nil, 3}
print(#t2)  -- 1 또는 3 — 구현마다 다름, 믿지 말 것
```

`#t`는 array part만 센다. nil hole이 있으면 동작이 미정의(undefined behavior)이므로 중간에 `nil`을 끼워 넣은 table에 쓰지 않는다.

#### `ipairs` vs `pairs`

```lua
local t = {10, 20, 30, extra = "x"}

-- ipairs: 연속 정수 키만, 1부터 순서 보장, nil에서 중단
for i, v in ipairs(t) do
  print(i, v)  -- 1 10 / 2 20 / 3 30
end

-- pairs: 전체 키, 순서 미보장 (hash part 포함)
for k, v in pairs(t) do
  print(k, v)  -- 순서 보장 없음, extra도 포함
end
```

nil hole이 있는 배열을 순회할 때도 `ipairs`는 nil에서 멈추므로 이후 요소를 순회 못 한다. 의도에 맞는 것을 골라야 한다.

---

### metatable

table의 동작(연산자, 키 조회 등)을 커스터마이즈하는 메커니즘이다.

```lua
local t = {}
local mt = {}
setmetatable(t, mt)    -- t에 mt를 metatable로 연결
getmetatable(t)        -- mt 반환
```

#### 대표 metamethod

| metamethod | 트리거 조건 |
|------------|-----------|
| `__index` | 키가 없을 때 fallback |
| `__newindex` | 키에 값을 쓸 때 |
| `__call` | table을 함수처럼 호출할 때 |
| `__add`, `__sub`, ... | 연산자 오버로딩 |
| `__tostring` | `tostring(t)` 호출 시 |
| `__len` | `#t` 연산 시 |

#### `__index`로 OOP 흉내내기

Neovim 플러그인에서 가장 자주 보이는 패턴이다.

```lua
local Animal = {}
Animal.__index = Animal  -- 핵심: 자기 자신을 __index로 설정

function Animal.new(name)
  return setmetatable({name = name}, Animal)
end

function Animal:speak()
  print(self.name .. " says hello")
end

local dog = Animal.new("Rex")
dog:speak()  -- "Rex says hello"
-- dog에 speak 키가 없으면 → __index(= Animal)에서 찾음
```

`dog.speak`를 조회할 때 `dog` table에 없으면 metatable의 `__index`를 본다. `__index`가 table이면 거기서 다시 키를 찾고, 함수면 그 함수를 호출한다. 상속도 이 방식으로 구현한다.

---

### Neovim 실전 연결

`require('plugin').setup({...})`에서 넘기는 `{...}`이 전부 table이다.

기본값 병합 시 `vim.tbl_deep_extend`를 쓴다.

```lua
local defaults = {timeout = 500, border = "rounded"}
local user_opts = {timeout = 1000}

local opts = vim.tbl_deep_extend("force", defaults, user_opts)
-- 결과: {timeout = 1000, border = "rounded"}
-- "force" → 뒤 인자가 앞 인자를 덮어씀
```

## 왜 중요한가

Lua는 테이블 하나로 언어 전체를 구성한다. metatable을 이해하면 Neovim 플러그인 소스코드가 읽히고, `vim.*` API가 어떻게 설계됐는지 구조가 보인다. Lua를 "설정 파일 언어"로만 쓰던 시점에서 "언어로 이해하는" 시점으로 넘어가는 첫 번째 관문이다.

## 참고

- [Lua 5.1 Reference Manual — Tables](https://www.lua.org/manual/5.1/manual.html#2.5.7)
- [Programming in Lua — Tables](https://www.lua.org/pil/2.5.html)
- [nvim-lua-guide](https://github.com/nanotee/nvim-lua-guide)
