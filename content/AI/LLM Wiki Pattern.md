---
created: '2026-05-15 17:56'
updated: '2026-05-15 18:10'
tags:
  - til
  - ai
  - llm
  - knowledge-management
  - karpathy
publish: true
---

# LLM Wiki Pattern — Karpathy의 compounding knowledge base 아이디어

2026년 4월 초 Andrej Karpathy가 트윗으로 던지고 [llm-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)로 정리한 패턴. 코드도 앱도 아닌 **아키텍처/운영 컨벤션** 수준의 제안이다. 본문은 그 핵심만 정리한다.

> 이하 "bookkeeping"은 **교차참조·정합성 유지·문서 갱신 같은 사무적 정리 작업**을 가리키는 용어로 고정한다.

## 문제의식 — RAG는 지식이 누적되지 않는다

전통적인 RAG는 매 쿼리마다 raw 문서를 다시 뒤져서 답을 합성한다. 결과적으로 **세션 사이 지식의 누적이 없다** — 어제 합성한 결론이 오늘 다시 합성된다. cross-reference, contradiction 추적 같은 bookkeeping은 사실상 부재하다.

Karpathy의 관찰을 풀어쓰면: *"지루한 부분은 읽기나 사고가 아니라 bookkeeping이다."* (필자 번역) 그리고 LLM은 bookkeeping에 **피로가 없다**는 게 패턴의 출발점이다.

## 핵심 아이디어 — Persistent, Compounding Wiki

- Raw 자료를 dump하는 폴더 + LLM이 점진적으로 **유지하는 markdown wiki**를 만든다.
- 사람은 **소스 큐레이션과 질문**만, LLM은 **wiki 작성·갱신·정합성 유지** 담당.
- 새 문서가 들어오면 기존 wiki 페이지들이 그에 맞춰 갱신된다 → 지식이 **시간이 지날수록 compound**된다.

## 3-Layer 아키텍처

```text
[Raw sources]   →   [Wiki]                →   [Schema document]
(immutable)         (LLM-generated md)         (컨벤션/설정)
```

| Layer | 성격 | 누가 관리 |
|-------|------|-----------|
| Raw sources | 원본 (논문 PDF, 캡처, 메모 등). **immutable** | 사람이 dump |
| Wiki | LLM이 작성·유지하는 구조화된 markdown | LLM |
| Schema doc | 카테고리 컨벤션, 페이지 형식, 링크 규칙 | 사람이 정의 |

컴파일러 비유: **raw = source code, wiki = 컴파일된 실행 파일, LLM = 컴파일러.** raw가 갱신되면 wiki를 다시 "빌드"한다.

## 3대 연산

| 연산 | 입력 | 출력 | LLM의 역할 |
|------|------|------|-----------|
| Ingest | 신규 raw 소스 | 신규 wiki 페이지 + 기존 페이지 갱신 | bookkeeping 일괄 수행 |
| Query | 사람의 질문 | 답변 + (선택) wiki write-back | 검색·합성·환류 |
| Lint | 현 wiki 상태 | 정합성 리포트 | 모순·orphan·끊긴 링크 감사 |

### Ingest

- 신규 raw 소스를 처리한다.
- 요약 페이지를 새로 쓰고, **관련된 기존 wiki 페이지 10~15개의 cross-reference를 갱신**한다.
- 이게 사람에게는 가장 지루하고 LLM에게는 가장 잘 맞는 작업.

### Query

- 질문이 들어오면 wiki 페이지를 먼저 검색해서 답을 합성한다 (raw가 아님).
- 합성 과정에서 가치 있는 새 정리/통찰이 나오면 **다시 wiki로 환류** (write-back).
- 질의-응답이 곧 knowledge graph 확장이 된다.

### Lint

- Wiki 자체의 health check.
- 모순되는 주장, orphan 페이지 (어디서도 링크 안 되는 페이지), 끊어진 cross-reference 등을 LLM이 주기적으로 감사한다.

## 특수 파일

| 파일 | 역할 |
|------|------|
| `index.md` | 카테고리별 콘텐츠 카탈로그 |
| `log.md` | **append-only** 활동 기록 (무엇이 언제 ingest/update 되었는가) |

Optional: 하이브리드 검색 CLI (BM25 + vector, gist에서 `qmd` 언급).

## 역사적 맥락 — Memex의 부활

1945년 Vannevar Bush가 *As We May Think*에서 제안한 **Memex** — 사람이 자기 자료에 trail(자료 간 연결고리)을 그어가며 자기만의 지식 그래프를 키우자는 개념. 80년간 못 풀린 건 **trail 유지보수 비용**이었다. 사람이 직접 cross-reference를 깔끔하게 유지하는 건 불가능에 가깝다.

LLM Wiki는 정확히 그 비용을 LLM에게 떠넘기는 패턴이다. *bookkeeping 자체가 LLM의 비교우위*라는 관찰에서 나오는 직접적인 귀결.

## RAG와의 비교

| 측면 | RAG | LLM Wiki |
|------|-----|----------|
| 1차 인덱스 | raw chunks (embedding) | LLM이 쓴 wiki 페이지 |
| 지식 누적 | 없음 (매번 재합성) | 있음 (wiki에 영속) |
| cross-reference | embedding 유사도로 간접 | 명시적 링크, LLM이 유지 |
| 모순 검출 | 안 함 | Lint 단계에서 명시적으로 함 |
| 비용 분포 | 쿼리 시 | Ingest 시 |

요약: RAG는 "검색 + 합성", LLM Wiki는 "**미리 컴파일된 지식 + 검색 + 합성 + write-back**".

## 출처

- 원본 gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>
- 발단 트윗 (2026-04-02): viral 후 Karpathy가 "idea file" 형태로 재정리
- 본 노트는 gist의 컨셉/아키텍처/연산 부분만 정리한 것이며, 구체 구현은 의도적으로 빠져 있다 (도메인/사용자별로 다름).

---

**Related**: [[AI]]
