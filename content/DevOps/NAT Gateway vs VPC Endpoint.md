---
created: '2026-06-25 15:20'
updated: '2026-06-25 15:20'
tags:
  - til
  - devops
  - aws
  - networking
  - vpc
  - cost-optimization
publish: true
---

# TIL: NAT Gateway vs VPC Endpoint

## 상황

cloud-infra PR #9에서 S3 Gateway Endpoint를 도입했다. "VPC 안에서 S3를 쓰면 NAT Gateway 안 거쳐도 된다"는 말은 들어봤지만, 실제로 어떻게 동작하는지, 언제 써야 하는지를 제대로 정리한 적이 없었다. Terraform으로 직접 박으면서 처음으로 명확하게 이해했다.

---

## 핵심

### 1. NAT Gateway 과금이 S3 트래픽에서 특히 아픈 이유

NAT Gateway 요금은 두 축이다.

```
$0.045/hour  ← AZ당, 프로비저닝 시간 기준 (고정비)
$0.045/GB    ← NAT를 통과하는 데이터 처리량 (변동비)
```

고정비는 어떻게든 낸다. 진짜 문제는 데이터 처리 비용이다. ML 모델 파일이나 의료 영상을 S3에서 당겨오는 EKS 워크로드에서는 수백 GB가 일상이다. Endpoint 없이 private subnet에서 S3로 가면 무조건 NAT를 타기 때문에, 이게 그대로 비용이 된다.

S3는 퍼블릭 엔드포인트다. 별도 설정 없이는 private subnet → 인터넷 → S3 경로로 흐른다.

### 2. Gateway Endpoint는 무료다 — 근데 처음엔 헷갈렸다

VPC Endpoint에는 두 종류가 있다.

```
Gateway Endpoint   → S3, DynamoDB 전용 / 무료 / 라우팅 테이블 기반
Interface Endpoint → 나머지 AWS 서비스 / 시간당 + GB 과금 / ENI 기반 (PrivateLink)
```

처음에 "VPC Endpoint 쓰면 비용 아낀다"는 말을 듣고 두 가지를 뭉뚱그려서 생각했다가 착각했다. Interface Endpoint는 **무료가 아니다.**

```
Interface Endpoint 요금:
  $0.01/hour (AZ당)
  $0.01/GB   (처리량)
```

NAT Gateway보다 GB당 단가는 낮지만, 멀티 AZ 구성이면 시간 비용이 AZ 수만큼 곱해진다. 트래픽이 적은 서비스에 Interface Endpoint를 붙이면 NAT 공유 비용보다 오히려 비쌀 수 있다. **"Endpoint = 무조건 NAT 대비 저렴"은 틀렸다.**

S3와 DynamoDB만이 Gateway Endpoint로 완전 무료 경로를 확보할 수 있다.

### 3. Gateway Endpoint 동작 원리 — 라우팅 테이블에 Prefix List 주입

Gateway Endpoint는 ENI를 만들지 않는다. 대신 연결된 라우팅 테이블에 **Prefix List** 항목을 자동으로 삽입한다.

```
목적지: pl-xxxxxxxx  (com.amazonaws.ap-northeast-2.s3)
대상:   vpce-xxxxxxxxxxxxxxxxx
```

Prefix List는 S3 퍼블릭 IP 범위를 동적으로 관리하는 AWS 관리형 목록이다. 이 항목이 추가된 서브넷에서 S3로 가는 트래픽은 NAT를 우회하고 AWS 내부망을 직접 탄다.

처음에 헷갈렸던 부분: **어느 서브넷에 적용되느냐는 Endpoint 생성 시 라우팅 테이블을 직접 연결해서 결정한다.** 연결하지 않은 서브넷은 계속 NAT를 탄다.

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.private_route_table_ids  # private subnet 명시 필수
}
```

### 4. 언제 NAT, 언제 Endpoint를 선택하나

내 판단 기준:

| 상황 | 선택 |
|------|------|
| private subnet → S3 / DynamoDB | Gateway Endpoint (무조건, 공짜) |
| private subnet → ECR, Secrets Manager 등 | 트래픽 볼륨 계산 후 결정 |
| private subnet → 외부 인터넷 (apt, 외부 API) | NAT Gateway 필수, 대체 불가 |
| 트래픽이 적은 AWS 서비스 | NAT 공유가 더 쌀 수 있음 |

요약:
- **S3/DynamoDB → Gateway Endpoint 즉시 도입.** 공짜라 손해가 없다.
- **나머지 AWS API → 볼륨 보고 결정.** 오히려 비쌀 수도 있다.
- **인터넷 필요 → NAT는 유지.** Endpoint로 대체 불가.

### 5. 도입하면서 부딪힌 gotcha

**① private subnet 라우팅 테이블만 연결하면 된다**

public subnet도 연결할 수 있긴 한데, public subnet은 IGW로 직접 S3에 간다. 굳이 연결할 필요 없고, 연결하면 라우트 테이블만 복잡해진다.

**② Security Group으로 접근 제어를 못 한다**

Gateway Endpoint는 ENI가 없어서 Security Group을 붙일 수 없다. 접근 제어는 S3 Bucket Policy로 해야 한다. `aws:SourceVpce` 조건으로 특정 Endpoint에서 온 요청만 허용하는 방식이 맞다.

```json
{
  "Condition": {
    "StringEquals": {
      "aws:SourceVpce": "vpce-xxxxxxxxxxxxxxxxx"
    }
  }
}
```

**③ 적용 후 NAT 트래픽이 실제로 줄었는지 확인해야 한다**

Endpoint 붙였다고 자동으로 다 되는 게 아니다. 라우팅 테이블 연결이 빠진 서브넷이 있으면 해당 서브넷 트래픽은 계속 NAT를 탄다. CloudWatch에서 NAT Gateway의 `BytesOutToDestination` 메트릭이 줄었는지 확인했다. 안 줄었다면 연결이 누락된 라우팅 테이블이 있는 것이다.

---

## 왜 중요한가

NAT Gateway는 인터넷 접근이 필요한 워크로드에 반드시 있어야 한다. 근데 S3 같은 AWS 내부 서비스까지 NAT를 타게 두는 건 그냥 돈 낭비다. Gateway Endpoint는 무료에 설정도 간단해서 도입하지 않을 이유가 없다.

Interface Endpoint는 서비스별로 비용 계산이 필요하지만, S3만큼은 계산 없이 바로 달면 된다.

EKS + ML 워크로드처럼 S3 트래픽이 heavy한 환경일수록 Gateway Endpoint 효과가 더 크다.

---

## 참고

- [[DevOps]] — DevOps TIL 목록
