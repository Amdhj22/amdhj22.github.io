---
created: '2026-06-09 18:30'
updated: '2026-06-09 18:30'
tags:
  - til
  - devops
  - terraform
  - iac
  - infrastructure
  - troubleshooting
publish: true
---

# TIL: Terraform이 조용히 되돌리는 3가지 순간

## 상황

오늘 `jira-terraform` 작업을 하면서 세 번 "아, 이렇게 동작하는 거였어?"를 경험했다.
공통 주제는 하나 — Terraform은 내가 기대한 것과 다른 기준으로 움직인다.

---

## 핵심

### 1. GUI에서 바꿨다고 state가 바뀌는 게 아니다

Terraform이 비교하는 세 축을 착각하고 있었다.

```
config   →  .tf 파일 (내가 원하는 상태)
state    →  terraform.tfstate (Terraform의 스냅샷)
live     →  실제 인프라 (Jira 프로젝트, AWS 리소스 등)
```

`plan`이 실행되는 순서:

```
1. live를 refresh → state를 메모리에서 갱신
2. config vs 갱신된 state 비교
3. 차이를 diff로 출력
```

Jira 콘솔에서 프로젝트 이름을 수동으로 바꿨다고 가정하자.
내 착각: "GUI 변경 → state도 같이 업데이트됐겠지."
실제: live만 바뀌었고, state는 낡은 채로 남아 있다.

**그 상태에서 `terraform apply`를 실행하면?**

`.tf`(config)에 여전히 예전 이름이 적혀 있으면, Terraform은 config를 기준으로
GUI에서 바꾼 이름을 **조용히 원래대로 되돌린다.**

```hcl
# Jira 프로젝트 이름을 GUI에서 "NXT Dev"로 바꿨지만
# .tf에 여전히 이전 값이 있으면:
resource "jira_project" "this" {
  name = "NXT"   # ← 이게 이기고, "NXT Dev"는 사라진다
}
```

교훈: GUI에서 수동으로 뭔가 바꿨으면, `.tf`도 반드시 맞춰줘야 한다.
안 그러면 다음 `apply`가 되돌린다. 에러도 없이.

---

### 2. `default` 바꿨는데 왜 안 먹히지? — tfvars가 이긴다

변수 우선순위를 놓쳤다.

```
환경변수 TF_VAR_xxx
  > terraform.tfvars (자동 로드)
    > *.auto.tfvars
      > variables.tf의 default
```

오늘 실제 사건:

```hcl
# variables.tf
variable "aws_region" {
  type    = string
  default = "ap-northeast-2"   # ← 이걸 바꿨다
}
```

```hcl
# terraform.tfvars
aws_region = "us-east-1"   # ← 이게 살아 있었다
```

provider는 `us-east-1`을 바라보고, Secrets Manager 시크릿은 `ap-northeast-2`에 있었다.
결과: "couldn't find resource" 에러. `default`를 바꿔도 `tfvars`가 이기므로 아무 의미가 없었다.

**교훈: `default` 값을 바꾸기 전에 `terraform.tfvars`를 먼저 확인.**
실제로 어떤 값이 쓰이는지는 `terraform console`이나 `terraform plan`의 변수 출력으로 검증할 것.

```bash
# 현재 적용된 변수값 확인
echo 'var.aws_region' | terraform console
```

---

### 3. state 파일에 API 토큰이 평문으로 박혀 있다

`apply` 후 state를 들여다보다가 발견했다.
`aws_secretsmanager_secret_version` 리소스를 쓰면, `secret_string`이 state에 **그대로** 기록된다.

```json
// terraform.tfstate 내부
"secret_string": "ATATxxxxxxxxxxxxxxxx"
```

이건 Terraform의 설계 상 어쩔 수 없는 부분이다.
state는 인프라 스냅샷이고, 시크릿 값도 attribute 중 하나라서 그냥 들어간다.

그래서 S3 backend에서 암호화가 필수다.

```hcl
terraform {
  backend "s3" {
    bucket       = "neuroxt-tf-state"
    key          = "jira/prod-dev/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true                  # PUT 시 SSE 강제
    use_lockfile = true                  # TF 1.11+, DynamoDB 불필요
  }
}
```

`encrypt = true`는 버킷 기본 암호화와 별개다.
버킷에 default encryption이 걸려 있어도, 이 플래그가 없으면 Terraform이 암호화 없이 PUT할 수 있다.
belt-and-suspenders 개념으로 둘 다 켜두는 게 맞다.

암호화 방식은 **SSE-KMS + `aws/s3` 관리형 키**. CMK는 state용으로 쓰려면
Terraform 실행 주체에 `kms:Decrypt` 키 정책을 직접 넣어야 해서 오버엔지니어링이다.

---

## 왜 중요한가

세 가지 모두 "에러 없이 조용히 잘못된 결과"를 만든다는 공통점이 있다.

- GUI 수동 변경 → 다음 `apply`가 되돌림 (에러 없음, 로그 없음)
- `default` 변경 → tfvars가 덮어씀 (에러 없음, 내가 원한 값이 안 쓰임)
- state에 평문 시크릿 → 암호화 안 하면 S3에 노출 (암호화 없이도 동작은 함)

Terraform은 선언한 대로만 움직인다. 내가 선언을 잘못 이해하면 결과도 조용히 틀어진다.

---

## 참고

- [[Jira Terraform 헷갈렸던 개념]] — 오늘 헷갈렸던 9개 항목 전체 정리
- [[State 관리]] — Remote backend, locking, 격리 전략 상세
- [[기초]] — Terraform 핵심 개념, 워크플로우
