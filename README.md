# Conran × Lotte Web Virtual Store — MVP

Phase 1 Week 1 착수용 보일러플레이트. 기술 스펙서 [`기획/20260415_콘란샵_웹버추얼스토어_기술스펙.md`](../../기획/20260415_콘란샵_웹버추얼스토어_기술스펙.md) 기준으로 스캐폴딩된 프로젝트입니다.

---

## 빠른 시작

```bash
# Node 20+ / pnpm 9+
pnpm install
cp .env.example .env          # VITE_GA4_ID 등 입력
pnpm dev                      # http://localhost:5173
```

```bash
pnpm validate                 # 데이터 스키마 검증
pnpm build                    # dist/ 로 정적 빌드 (prebuild에서 validate 자동 실행)
pnpm preview                  # 빌드 결과 로컬 확인
```

---

## 기술 스택

- **Preact 10 + @preact/signals** — UI + 반응형 상태
- **Vite 5 + TypeScript 5** — 번들러 + 언어
- **Tailwind 3 + CSS 변수** — 콘란 브랜드 토큰 (`src/styles/tokens.css`)
- **Marzipano 0.10** — 멀티레졸루션 타일 파노라마 (dynamic import)
- **zod 3** — JSON 데이터 스키마 검증 (빌드 타임 + 런타임)
- **GA4 (gtag)** — 이벤트 트래킹

## 디렉토리 구조

```
src/
├─ main.tsx            # 진입
├─ App.tsx             # 씬 라우터 (signal + hash)
├─ scenes/             # 5개 씬 — Exterior / Gate / Customize / Gallery / RoomsetDetail
├─ components/         # HUD, Breadcrumb (+ 향후 ProductOverlay, AIAssistant)
├─ stores/             # Signals store — scene, cart, customize
├─ data/               # zod 스키마 + JSON loader
├─ viewer/             # Marzipano 래퍼 (Phase 1-W2 구현)
├─ analytics/          # gtag 이벤트
├─ commerce/           # 롯데백화점몰 링크 아웃
└─ styles/             # 토큰 CSS + Tailwind 엔트리

public/
├─ data/               # products/rooms/ai-scenarios.json
├─ panos/              # 파노라마 타일 (marzipano-tool 출력)
└─ products/           # 상품 이미지 (WebP)

scripts/
└─ validate-data.ts    # zod 기반 CI 검증

기획/20260415_콘란샵_웹버추얼스토어_기술스펙.md   # 기술 스펙서 (15섹션)
```

## Phase 1 체크리스트

### Week 1 (현재 보일러플레이트 포함 범위)
- [x] Vite + Preact + TS + Tailwind 셋업
- [x] zod 스키마 + `loadAllData()` + 무결성 체크
- [x] Signals 기반 상태 관리 (scene, cart, customize)
- [x] HUD + Breadcrumb 공통 컴포넌트
- [x] 5개 씬 컴포넌트 골격 (정적 데이터로 종점-to-종점 동작)
- [x] GA4 이벤트 래퍼 (`track()`)
- [x] 롯데백화점몰 링크 아웃 헬퍼
- [x] `scripts/validate-data.ts` 프리빌드 검증
- [x] Marzipano 뷰어 래퍼 스텁

### Week 2-1 (완료)
- [x] 테스트 equirect 파노라마 생성 — `scripts/generate-test-panorama.py` (Pillow)
- [x] `<MarzipanoView>` 완성 (equirect/cube 분기, 핫스팟 pulse DOM)
- [x] `Customize` 씬 Marzipano 통합 — 핫스팟 5개 + 카테고리 자동 전환 + 슬롯 자동 채움
- [x] 번들 검증: initial JS **29.66 KB gzip** (예산 150KB 대비 20%) / Marzipano는 별도 lazy 청크

### Week 2 (남은 작업)
- [ ] AI 생성 파노라마 4씬 제작 (Midjourney / Flux) — `scripts/tile-panorama.md` 절차 참조
- [ ] `marzipano-tool` 로 타일화 → `public/panos/R0{2..4}/` 반영
- [ ] `ProductOverlay`, `AIAssistant` 컴포넌트 구현
- [ ] S3 배포 (+ CloudFront Functions로 COOP/COEP 헤더 주입)
- [ ] QA 10분 시연 리허설

## 파노라마 파이프라인

테스트 파노라마 재생성:
```bash
python scripts/generate-test-panorama.py
# → public/panos/R01/equirect.webp (32KB) + preview.jpg
```

실제 AI/UE 파노라마를 cube 타일로 변환하는 절차: [`scripts/tile-panorama.md`](scripts/tile-panorama.md) 참조.

## 데이터 편집

`public/data/` 내 JSON 3종을 수정하면 됩니다. 모든 변경은 `pnpm validate` 통과 필수.

- `products.json` — 상품 (id 형식 `P\d{3}`)
- `rooms.json` — 룸셋 + 핫스팟 yaw/pitch
- `ai-scenarios.json` — AI 프리셋 Q&A

룸셋·시나리오의 상품 참조(`products[]`, `cards[]`)는 자동 무결성 검증됩니다. 오타 시 빌드가 실패합니다.

## 환경 변수

| 변수 | 용도 |
|------|------|
| `VITE_GA4_ID` | GA4 측정 ID |
| `VITE_LOTTE_BASE` | 롯데백화점몰 베이스 URL |
| `VITE_LOTTE_CONRAN_CATEGORY` | 장바구니 일괄 이동 대상 페이지 |

## 관련 문서

- [기술 스펙서](../../기획/20260415_콘란샵_웹버추얼스토어_기술스펙.md) — 16개 기술 의사결정, 아키텍처, 로드맵
- [2D PoC 샘플](../20260415_콘란샵_웹버추얼스토어/) — 회의 시연용 Vanilla HTML 버전
- [경쟁 데모 분석](../../리서치/20260415_참고데모_구현분석.md) — 엘리펙스·EMPERIA·칼리버스 구조 비교
