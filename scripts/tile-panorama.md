# 파노라마 타일화 레시피 (Production 전환 시)

`MarzipanoView`는 두 가지 파노라마 입력을 지원합니다:

1. **`equirect`** — 단일 equirectangular 이미지 (현재 R01에서 사용 중 — 개발용)
2. **`base` + `levels`** — multi-resolution cube 타일 (프로덕션 권장)

AI 생성(Midjourney/Flux) 혹은 UE 추출 파노라마가 나오면 아래 절차로 타일화하여 `base+levels` 포맷으로 전환합니다.

---

## 전제 조건

- Node.js 20+ (프로젝트 요건과 동일)
- 입력 파노라마: **4096×2048** 이상 equirectangular JPG/PNG
- 권장 출력 해상도 레벨: 1024, 2048, 4096

## 1. marzipano-tool 설치

```bash
npm install -g marzipano-tool
# 또는 프로젝트 dev dep로
npm install -D marzipano-tool
```

## 2. 타일 생성

```bash
# 입력: input.jpg  →  출력: public/panos/R02/
npx marzipano-tool input.jpg \
  --output public/panos/R02/ \
  --tile-size 512 \
  --tile-overlap 1 \
  --output-format jpeg \
  --output-quality 85
```

생성되는 디렉토리 구조:

```
public/panos/R02/
├─ 1/  2/  3/                  # mipmap level 디렉토리
│  └─ {face}/{y}_{x}.jpg       # face: b/d/f/l/r/u (cube faces)
├─ preview.jpg                  # cube map low-res preview
└─ tiles.json                   # marzipano-tool 메타 (참고용)
```

## 3. `rooms.json` 업데이트

```json
{
  "id": "R02",
  "panorama": {
    "base": "/panos/R02/",
    "levels": [1024, 2048, 4096],
    "previewUrl": "/panos/R02/preview.jpg"
  }
}
```

`equirect` 필드는 제거하거나 그대로 두어도 됨(뷰어는 `equirect`가 있으면 그것을 우선 사용).
프로덕션 전환 시에는 `equirect` 제거 권장.

## 4. 검증

```bash
npm run validate    # zod 스키마 통과 확인
npm run dev         # http://localhost:5173 에서 육안 확인
```

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 이음새(seam)가 보임 | tile-overlap 0 | `--tile-overlap 1` 이상 |
| 확대하면 흐릿함 | 입력 해상도 부족 | 8K(8192×4096) 원본으로 재추출 |
| 바닥/천장 변형 심함 | equirect 투영 특성 | cube 타일화가 해결 (본 절차) |
| iOS Safari에서 로딩 실패 | CORS 헤더 누락 | CloudFront Functions에 `Access-Control-Allow-Origin: *` 추가 |

## AI 파노라마 프롬프트 시드 (Phase 1-W2 후반)

> 기술 스펙서 §4-3 파노라마 제작 결정: **Midjourney/Flux 생성** → 본 절차로 타일화.

콘란 스타일 × 씬 프롬프트 세트는 별도 문서 `기획/20260416_콘란샵_파노라마_프롬프트.md` (예정)에서 관리.
