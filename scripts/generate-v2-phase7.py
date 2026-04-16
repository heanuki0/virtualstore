"""Phase 8 — Conran LAB/CLUB palette regeneration (no text, no hanok).

Generates the full set of panorama / image assets re-keyed to the real
Gangnam-style LAB (1F white gallery) + CLUB (2F dark heritage) palette.

Hero batch (6 HD images):
  1. public/images/lobby.jpg        — LAB 2D flat illustration (NO TEXT)
  2. public/panos/R01/equirect.webp — CLUB day (living + dining)
  3. public/panos/R01/sunset.webp   — CLUB sunset
  4. public/panos/R01/night.webp    — CLUB night
  5. public/panos/R01/sofa.webp     — CLUB sofa close-up waypoint
  6. public/panos/R01/dining.webp   — CLUB dining close-up waypoint

Total batch: 6 × $0.12 (HD) = $0.72
HALL + R02 batch is in generate-ai-panoramas.py (also updated).

Usage:
    python scripts/generate-v2-phase7.py
    python scripts/generate-v2-phase7.py --only lobby
    python scripts/generate-v2-phase7.py --only R01
    python scripts/generate-v2-phase7.py --only waypoints
"""
import argparse
import os
import sys
from io import BytesIO
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image


def load_env(path: str = "C:/Cowork/.env") -> None:
    with open(path) as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k, v)


# ─── Shared suffixes ─────────────────────────────────────────────────────

EQUIRECT_SUFFIX = (
    " Wide-angle equirectangular 360-degree interior panorama, "
    "strict 2:1 aspect ratio, seamless horizon, no tilted horizon line. "
    "Architectural photography for a luxury design retailer, shallow curated "
    "density with strong negative space between objects, museum-plinth spacing. "
    "Photorealistic 8K detail. Absolutely no text, no signage, no letters, "
    "no watermark, no people."
)

# ─── Prompts ──────────────────────────────────────────────────────────────

LOBBY_PROMPT = (
    "Flat 2D architectural illustration of a Conran flagship lobby interior, "
    "seen from front-centre in perfect symmetry, staged like a diorama stage-set. "
    "Master palette: matte WHITE walls, matte WHITE vaulted ceiling with exposed "
    "brushed-aluminium service ducts and a linear LED cove, polished white "
    "micro-cement floor with a single inlaid brushed-brass circle at centre. "
    "CENTER: an empty white monolithic reception plinth, 1.2m high, nothing on it "
    "except two low cobalt-blue ceramic vessels. "
    "LEFT ARCHWAY: a tall minimalist rectangular portal, interior visible through "
    "— a white plinth showing a single FLOS Arco floor lamp and a deep-blue velvet "
    "seat, warm amber glow behind. "
    "RIGHT ARCHWAY: a matching rectangular portal, interior visible through "
    "— a white plinth showing stacked art books and a cognac leather lounge chair "
    "silhouette, warm amber glow behind. "
    "A single cobalt-blue abstract John-Booth-style mural on the wall between "
    "archways. Two matte-white spherical planters with olive topiary flanking the "
    "centre plinth. Soft daylight from an unseen skylight. "
    "CRITICAL: do NOT render any letters, words, labels, numbers, or signage "
    "anywhere in the image. Absolutely zero text. All labels will be added as "
    "HTML overlays later. "
    "Contemporary architectural illustration, Conran minimal gallery aesthetic, "
    "photorealistic 8K detail, editorial wide-angle 16:9, cool white + warm amber "
    "dual palette, low density, strong negative space, no watermark, no people."
)

R01_BASE = (
    "An expansive open-plan Conran lounge and dining scene in the CLUB zone "
    "aesthetic, equirectangular 360-degree panorama. "
    "CORE PALETTE: deep teal-green walls (Farrow & Ball Inchyra Blue tone), "
    "matte black-painted ceiling with warm recessed 2700K spotlights, oak "
    "herringbone parquet floor, brushed brass trim and a single brass archway, "
    "travertine stone plinths, cognac leather, translucent frosted-glass partition "
    "at one end. "
    "LEFT HALF OF FRAME — living vignette: a deep blue velvet Matthew Hilton "
    "Arbor three-seater sofa, a Matthew Hilton Sloan lounge chair and ottoman in "
    "cognac leather beside it, a round travertine coffee table with two art books "
    "and a single Iittala Aalto glass vase, a FLOS Arco floor lamp arching "
    "overhead, a low-pile Berber handwoven rug. "
    "CENTER: oak herringbone parquet stretching between the two vignettes, "
    "completely clear floor space (strong negative space). "
    "RIGHT HALF OF FRAME — dining vignette: a solid oak Carl Hansen CH327 dining "
    "table, four Carl Hansen CH24 Wishbone chairs around it, one Louis Poulsen "
    "PH5 pendant hanging low over the table, a single ceramic centerpiece (one "
    "Muuto bowl, no clutter). "
    "BACKGROUND: translucent frosted-glass partition on the far wall glowing "
    "softly from behind, a single large abstract painting on the teal wall, a "
    "built-in walnut String Furniture shelf with widely spaced art books and "
    "three ceramic objects only (low density). "
    "Curated museum-spacing density, nothing on the floor between vignettes, no "
    "clutter, no stacked magazines, no houseplants."
)

R01_DAY    = R01_BASE + " LIGHTING: calm afternoon daylight from an unseen side window, even soft fill, brass highlights, no harsh shadows."
R01_SUNSET = R01_BASE + " LIGHTING: golden-hour rim light entering from the right, long soft shadows across the herringbone floor, amber glow on brass and leather, teal walls deepening to indigo in shadow."
R01_NIGHT  = R01_BASE + " LIGHTING: night scene, exterior darkness, only interior lamps glowing — the PH5 pendant, the FLOS Arco, two small travertine table lamps — warm pools of light against deep teal shadow, cognac leather catching firelight reflections."

R01_SOFA = (
    "Close-up waypoint view inside the same Conran CLUB lounge vignette. "
    "Camera positioned beside the Matthew Hilton Arbor deep-blue-velvet sofa, "
    "facing the seating arrangement. "
    "Foreground: the sofa with two silk-linen cushions (one cognac, one cream), "
    "a Matthew Hilton Sloan cognac-leather lounge chair directly beside the camera. "
    "Midground: round travertine coffee table with two art books and a single "
    "Iittala Aalto glass vase, nothing else. "
    "Background: FLOS Arco floor lamp arching up, oak herringbone parquet, "
    "deep teal-green wall, warm 2700K spotlight pool. "
    "Intimate residential scale, low-density curated styling, strong negative "
    "space on the floor. Matching palette to the main R01 panorama exactly."
)

R01_DINING = (
    "Close-up waypoint inside the same Conran CLUB dining vignette. "
    "Camera positioned at one end of the solid oak Carl Hansen CH327 dining "
    "table, looking down its length. "
    "Foreground: table edge and one Carl Hansen CH24 Wishbone chair in profile. "
    "Midground: three more Wishbone chairs around the table, Louis Poulsen PH5 "
    "pendant hanging low and glowing softly overhead, one single Muuto ceramic "
    "centerpiece. "
    "Background: deep teal-green wall with a single framed abstract artwork, a "
    "brushed-brass arch doorway revealing the translucent frosted-glass partition "
    "beyond. Oak herringbone parquet floor with strong negative space. "
    "Warm 2700K light pool under the pendant. Intimate scale, low-density "
    "styling, curatorial feel. Matching palette to the main R01 panorama exactly."
)


# ─── Jobs ─────────────────────────────────────────────────────────────────

JOBS = [
    # (key, output_path, prompt, is_equirect_crop)
    ("lobby",       "public/images/lobby.jpg",        LOBBY_PROMPT,               False),
    ("R01_day",     "public/panos/R01/equirect.webp", R01_DAY    + EQUIRECT_SUFFIX, True),
    ("R01_sunset",  "public/panos/R01/sunset.webp",   R01_SUNSET + EQUIRECT_SUFFIX, True),
    ("R01_night",   "public/panos/R01/night.webp",    R01_NIGHT  + EQUIRECT_SUFFIX, True),
    ("R01_sofa",    "public/panos/R01/sofa.webp",     R01_SOFA   + EQUIRECT_SUFFIX, True),
    ("R01_dining",  "public/panos/R01/dining.webp",   R01_DINING + EQUIRECT_SUFFIX, True),
]


def generate_one(client, prompt: str) -> bytes:
    resp = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1792x1024",
        quality="hd",
        n=1,
    )
    url = resp.data[0].url
    import urllib.request

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def save_image(img_bytes: bytes, out_path: Path, equirect_crop: bool, make_preview: bool) -> tuple[int, int]:
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    if equirect_crop:
        w, h = img.size
        target_h = w // 2
        if target_h < h:
            top = (h - target_h) // 2
            img = img.crop((0, top, w, top + target_h))
        elif target_h > h:
            target_w = h * 2
            left = (w - target_w) // 2
            img = img.crop((left, 0, left + target_w, h))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.suffix == ".webp":
        img.save(out_path, "WebP", quality=86, method=6)
    else:
        if max(img.size) > 1600:
            img.thumbnail((1600, 1600))
        img.save(out_path, "JPEG", quality=88, optimize=True)

    if make_preview and out_path.suffix == ".webp":
        preview = img.copy()
        preview.thumbnail((1400, 700))
        preview.save(out_path.parent / "preview.jpg", "JPEG", quality=82)

    return img.size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="lobby | R01 | waypoints | a specific key")
    args = ap.parse_args()

    load_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("✗ OPENAI_API_KEY not found", file=sys.stderr)
        return 2

    try:
        from openai import OpenAI
    except ImportError:
        print("✗ openai package missing", file=sys.stderr)
        return 2

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    selected = JOBS
    if args.only:
        if args.only == "lobby":
            selected = [j for j in JOBS if j[0] == "lobby"]
        elif args.only == "R01":
            selected = [j for j in JOBS if j[0] in ("R01_day", "R01_sunset", "R01_night")]
        elif args.only == "waypoints":
            selected = [j for j in JOBS if j[0] in ("R01_sofa", "R01_dining")]
        else:
            selected = [j for j in JOBS if j[0] == args.only]

    if not selected:
        print(f"✗ No jobs matching --only {args.only}", file=sys.stderr)
        return 2

    root = Path(__file__).resolve().parent.parent
    print(f"→ Generating {len(selected)} images via DALL·E 3 (1792×1024, hd)")

    for i, (key, rel, prompt, equirect) in enumerate(selected, 1):
        out_path = root / rel
        print(f"\n[{i}/{len(selected)}] {key} → {rel}")
        try:
            bytes_ = generate_one(client, prompt)
            make_preview = (key == "R01_day")
            size = save_image(bytes_, out_path, equirect, make_preview)
            print(f"    ✓ saved ({size[0]}×{size[1]})")
        except Exception as e:
            print(f"    ✗ failed: {e}", file=sys.stderr)

    print("\n✓ done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
