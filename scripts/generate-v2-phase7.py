"""Phase 7 v2 re-design — 6 DALL·E 3 image generations.

1. public/images/lobby.jpg        — 2D lobby illustration (flat hero image)
2. public/panos/R01/equirect.webp — wide livingroom+dining, DAY (360° equirect)
3. public/panos/R01/sunset.webp   — same wide view, SUNSET lighting
4. public/panos/R01/night.webp    — same wide view, NIGHT lighting
5. public/panos/R01/sofa.webp     — close-up sofa angle waypoint (360° equirect)
6. public/panos/R01/dining.webp   — close-up dining angle waypoint (360° equirect)

Total: 6 × $0.12 (HD) = $0.72
Runtime: ~90-120 seconds total.

Usage:
    python scripts/generate-v2-phase7.py                  # all 6
    python scripts/generate-v2-phase7.py --only lobby     # single
    python scripts/generate-v2-phase7.py --only R01       # R01 main only (3)
    python scripts/generate-v2-phase7.py --only waypoints # sofa + dining only
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


# ─── Prompts ──────────────────────────────────────────────────────────────

LOBBY_PROMPT = (
    "Flat 2D architectural illustration, centered symmetrical composition. "
    "A grand Conran luxury lobby interior seen from front-center, like a "
    "stage set or storefront diorama. "
    "TOP CENTER: An ornate archway with engraved brass signage reading "
    "'CONRAN HOUSE' on the arch, flanked by decorative plasterwork. "
    "CENTER FLOOR: A polished circular emblem inlaid in cream marble. "
    "LEFT WALL: A wide lit archway with 'CONSULT' brass label above, "
    "interior visible through glass — a reception desk with a welcoming "
    "hostess in charcoal suit, warm lamp light. "
    "RIGHT WALL: A matching wide lit archway with 'EXHIBITION' brass label "
    "above, interior visible — luxurious living room with blue velvet sofa "
    "and FLOS Arco floor lamp, warmly lit. "
    "Tall potted topiary trees flanking each archway. Brass wall sconces. "
    "Cream stone walls with gold trim. Warm afternoon ambient light. "
    "Style: contemporary architectural illustration, Kinfolk aesthetic, "
    "editorial wide-angle 16:9, photorealistic 8K detail, "
    "warm amber and cream palette. No people in the foreground, "
    "no text labels on the floor, no watermark."
)

EQUIRECT_SUFFIX = (
    " Wide-angle equirectangular 360-degree interior panorama, 2:1 aspect ratio, "
    "architectural photography, warm editorial color grading, "
    "photorealistic 8K detail, Kinfolk magazine aesthetic. "
    "No people, no text, no watermark."
)

R01_BASE = (
    "An expansive open-plan Conran-style LIVING ROOM + DINING AREA combined, "
    "equirectangular 360-degree panorama. "
    "LEFT SIDE OF FRAME: Living area with deep blue velvet 3-seater sofa, "
    "Eames-style walnut lounge chair with ottoman, travertine coffee table, "
    "FLOS Arco floor lamp arching overhead, Berber handwoven rug. "
    "CENTER: Polished oak parquet flooring, floor-to-ceiling windows with sheer "
    "curtains flooding the space with light. "
    "RIGHT SIDE OF FRAME: Dining area with a solid oak Carl Hansen CH327 dining "
    "table, six Wishbone chairs around it, Louis Poulsen PH5 pendant hanging over "
    "the table, curated glass vase centerpiece. "
    "Background: Cream walls with brass picture rail, built-in walnut shelving "
    "with art books and ceramic objects, a single painting in each area. "
    "Overall mood: spacious, curated, gallery-like, British heritage × modern."
)

R01_DAY    = R01_BASE + " LIGHTING: Bright afternoon daylight, soft diffused natural light from windows, crisp shadows, clean editorial atmosphere."
R01_SUNSET = R01_BASE + " LIGHTING: Golden hour, amber and rose tones painting the walls, long dramatic shadows, warm rim light on furniture, romantic."
R01_NIGHT  = R01_BASE + " LIGHTING: Night scene, interior lamps glowing (Arco, PH5, Wardour candles), dark windows showing twinkling city lights, deep cozy shadows."

R01_SOFA = (
    "Close-up waypoint view within the same Conran living room. "
    "Camera positioned beside the sofa, looking at the seating arrangement. "
    "Foreground: deep blue velvet 3-seater sofa with silk cushions, "
    "Eames-style walnut lounge chair and ottoman directly beside the camera, "
    "travertine coffee table with art books and ceramic bowl. "
    "Background: FLOS Arco floor lamp arching up, oak parquet floor, "
    "Berber rug underfoot, soft afternoon window light. "
    "Equirectangular panorama emphasizing the sofa zone, intimate scale. "
    + EQUIRECT_SUFFIX
)

R01_DINING = (
    "Close-up waypoint view within the same Conran living/dining space. "
    "Camera positioned beside the dining table, looking at the dining arrangement. "
    "Foreground: solid oak Carl Hansen CH327 dining table with carefully set placemats, "
    "Wishbone chairs on both sides, Iittala Aalto glass vase with white flowers, "
    "brass cutlery. "
    "Directly above: Louis Poulsen PH5 pendant lamp hanging over the table at close range. "
    "Background: living area visible in distance (blue velvet sofa), "
    "floor-to-ceiling windows with soft afternoon light, oak parquet floor. "
    "Equirectangular panorama emphasizing the dining zone, intimate scale. "
    + EQUIRECT_SUFFIX
)


# ─── Jobs ─────────────────────────────────────────────────────────────────

JOBS = [
    # (key, output_path, prompt, is_equirect_crop)
    ("lobby",       "public/images/lobby.jpg",        LOBBY_PROMPT,          False),
    ("R01_day",     "public/panos/R01/equirect.webp", R01_DAY + EQUIRECT_SUFFIX, True),
    ("R01_sunset",  "public/panos/R01/sunset.webp",   R01_SUNSET + EQUIRECT_SUFFIX, True),
    ("R01_night",   "public/panos/R01/night.webp",    R01_NIGHT + EQUIRECT_SUFFIX, True),
    ("R01_sofa",    "public/panos/R01/sofa.webp",     R01_SOFA,              True),
    ("R01_dining",  "public/panos/R01/dining.webp",   R01_DINING,            True),
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
        # Center-crop to exact 2:1 aspect
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
        # lobby.jpg
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
    ap.add_argument("--only", help="lobby | R01 | waypoints | a specific key (e.g. R01_sunset)")
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

    # Select jobs
    selected = JOBS
    if args.only:
        if args.only == "lobby":
            selected = [j for j in JOBS if j[0] == "lobby"]
        elif args.only == "R01":
            selected = [j for j in JOBS if j[0].startswith("R01_") and j[0] in ("R01_day", "R01_sunset", "R01_night")]
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
