# AI 파노라마 프롬프트 시드

기술 스펙서 §4-3 결정: AI 이미지 생성(Gemini / Midjourney / Flux)으로 콘란샵 파노라마 제작.

본 문서는 콘란 4 스타일 × 실제 씬 구성을 프롬프트 세트로 관리. 모델 바뀌어도 방향성 유지.

---

## 공통 수식어 (모든 프롬프트 앞에 주입)

```
Professional interior architecture photography, wide-angle equirectangular 360 panorama,
2:1 aspect ratio, natural daylight from large windows, warm color grading,
photorealistic, 8K detail, Kinfolk magazine editorial aesthetic,
no people, no text, no watermarks
```

## 스타일별 공통 디렉션

| Style | Materials | Color | Mood | Inspiration |
|-------|-----------|-------|------|-------------|
| modern | travertine, brushed steel, velvet | deep navy, warm taupe, cream | riviera afternoon | Barcelona pavilion, Milan |
| classic | oak, leather, brass, wool | mahogany, golden ochre, forest | English heritage | London Mayfair library |
| mid-century | walnut, teak, felt, cream fabric | terracotta, mustard, cream | 1960s Scandinavian | SAS Royal Hotel, Aalto |
| minimal | linen, oak, pale stone | off-white, pale gray, warm beige | Copenhagen morning | Vipp, Menu showroom |

---

## 씬별 프롬프트 시드 (rooms.json R01~R04 매핑)

### R01 · Modern Sanctuary — 모던 생추어리

**Base prompt:**
> A modern Conran Shop living room interior, riviera afternoon light,
> deep blue velvet sofa in the center, travertine coffee table with rounded corners,
> FLOS Arco floor lamp arching over the sofa,
> Berber handwoven rug, polished concrete floor,
> floor-to-ceiling window on the right wall showing muted sea view,
> warm taupe walls with a single abstract canvas,
> soft diffused daylight, composition balanced for 360 panorama viewing

**Variants:** swap velvet color (emerald / oxblood), add Tom Dixon pendant

### R02 · Classic English — 클래식 잉글리시

**Base prompt:**
> A classic English library-lounge interior in London Mayfair style,
> cognac leather chesterfield sofa against a dark green wainscoted wall,
> solid oak dining table partially visible on the left,
> Anglepoise 1227 desk lamp on a walnut console,
> Berber rug on herringbone oak flooring,
> brass-framed artwork, crystal decanter on the table,
> late afternoon warm glow from tall sash windows,
> atmosphere of a heritage English home

**Variants:** add fireplace with marble mantel, book wall

### R03 · Mid-Century Lounge — 미드센추리 라운지

**Base prompt:**
> A mid-century modern lounge in Scandinavian 1960s style,
> walnut lounge chair with cream wool upholstery (Hans Wegner silhouette),
> teak low table beside it, FLOS Arco lamp arching above,
> terracotta and mustard textile cushions,
> pale oak floor with a geometric Nanimarquina rug,
> large sliding window opening to a pine forest, northern Europe light,
> serene and uncluttered, Aalto architectural detailing

**Variants:** sunset variant, add Poulsen AJ floor lamp

### R04 · Minimal Scandi — 미니멀 스칸디

**Base prompt:**
> A minimal Scandinavian living room in Copenhagen morning light,
> off-white linen modular sofa in the center,
> clear glass console table on the right,
> Artemide Tizio desk lamp in matte aluminum,
> pale jute rug on light oak flooring,
> white walls with single ceramic vase on a floating oak shelf,
> tall window filtering pale northern light through sheer curtains,
> extreme simplicity, negative space, magazine-quality calm

**Variants:** winter variant with snowy window view

---

## Gemini API 호출 시 주의

- `gemini-2.5-flash-image-preview` 모델은 프롬프트에 aspect ratio 지정은 불가능, 결과가 1:1 또는 16:9 로 올 수 있음.
- `imagen-4.0-generate-001` 모델이 가능하면 `aspect_ratio: "16:9"` 설정.
- 어느 경우든 후처리: Pillow 로 4096×2048 로 리사이즈(letterbox or crop)하여 equirectangular 2:1 표준에 맞춤.
- 실제 구면 투영은 아니므로 Marzipano 에서 바닥/천장이 약간 변형되어 보일 수 있음 — PoC 용도로는 충분, 프로덕션 시엔 UE 추출 파노라마로 교체.

## 발주용 단축 프롬프트 (외부 툴에 복붙)

### Midjourney v6 / Flux
```
modern conran shop living room, equirectangular 360 panorama, 2:1 aspect,
deep blue velvet sofa, travertine table, FLOS Arco lamp, Berber rug,
riviera afternoon light --ar 2:1 --style raw --s 100
```

### DALL-E 3 (만약 키 연결되면)
```
A wide-angle interior panorama (aspect ratio 2:1) of a modern Conran Shop living room.
Deep blue velvet sofa center, travertine coffee table, FLOS Arco floor lamp,
Berber rug, warm afternoon light through tall windows.
Photorealistic editorial style, no people, no text.
```
