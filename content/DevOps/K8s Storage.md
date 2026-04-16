---
created: '2026-04-16 09:00'
tags:
  - til
  - devops
  - kubernetes
  - pv
  - pvc
  - rook
  - ceph
  - storage
publish: true
---

## 개요

Kubernetes 스토리지 추상화(PV/PVC)와 Rook Ceph 분산 스토리지.

## PV / PVC

| | PV (Persistent Volume) | PVC (Persistent Volume Claim) |
|---|---|---|
| 역할 | 스토리지 자원 추상화 | Pod이 필요한 스토리지 요청 |
| 관리 | 관리자 생성 또는 StorageClass 동적 생성 | 개발자가 용량/모드 선언 |
| 매핑 | 실제 스토리지(NFS, EBS, Ceph 등) | 적합한 PV에 자동 바인딩 |

## Rook Ceph

K8s에서 Ceph 분산 스토리지를 CRD 기반으로 자동 배포/운영하는 오퍼레이터.

| 장점 | 설명 |
|------|------|
| 통합 스토리지 | 오브젝트(S3) + 블록(PVC) + 파일(CephFS) |
| 확장성 | 노드/디스크 추가만으로 용량 확장 |
| 고가용성 | 자동 리밸런싱, 장애 노드 복구 |
| 벤더 독립 | 특정 클라우드 종속 없음 |

---

**Related**: [[Auto Scaling & Spot Instance]] | [[DevOps]]
