"""Generate 4 Conran-style panoramas via DALL·E 3.

Uses OPENAI_API_KEY from C:/Cowork/.env .
Each image is 1792×1024 (DALL·E 3 wide), center-cropped to 1792×896 for 2:1
equirectangular aspect, then saved as WebP + JPG preview to public/panos/R0{1..4}/ .

Cost estimate: 4 × $0.12 (1792×1024 HD) = ~$0.48
Runtime: 10–20s per image.

Usage:
    python scripts/generate-ai-panoramas.py
    python scripts/generate-ai-panoramas.py --only R03
    python scripts/generate-ai-panoramas.py --quality standard   # $0.08/image
"""
import argparse
import os
import sys
from io import BytesIO
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image  # noqa: E402


def load_env(path: str = "C:/Cowork/.env") -> None:
    with open(path) as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k, v)


COMMON_SUFFIX = (
    " Wide-angle equirectangular 360-degree interior panorama, 2:1 aspect ratio, "
    "architectural photography, "
    "warm editorial color grading, photorealistic 8K detail, "
    "Kinfolk magazine aesthetic. No people, no text, no watermark."
)

# HALL needs a human concierge, so use a separate suffix without "No people"
HALL_SUFFIX = (
    " Wide-angle equirectangular 360-degree interior panorama, 2:1 aspect ratio, "
    "architectural photography, "
    "warm editorial color grading, photorealistic 8K detail, "
    "Kinfolk magazine aesthetic. No watermark."
)

# Lighting overrides per variant. Appended to the base room prompt.
VARIANTS = {
    "day": (
        "equirect.webp",  # re-uses existing filename; preview.jpg is generated from this variant
        "LIGHTING: bright afternoon daylight from tall windows, soft diffused natural light, clean shadows, inviting and calm mood.",
    ),
    "sunset": (
        "sunset.webp",
        "LIGHTING: golden hour sunset through the windows, long dramatic shadows, rich amber and rose tones painting the walls, warm rim light on furniture surfaces, romantic late afternoon mood.",
    ),
    "night": (
        "night.webp",
        "LIGHTING: night-time interior, dark windows revealing city night lights in the distance, warm interior lamplight only (table lamps, floor lamp, pendant glowing), deep moody shadows, cozy after-dark atmosphere.",
    ),
}

ROOMS = [
    {
        "id": "HALL",
        "name": "Entry Hall",
        "prompt": (
            "Interior of a grand luxury design showroom entrance hall, "
            "SYMMETRICAL wide-angle equirectangular 360-degree panorama, "
            "camera at center of hall looking straight ahead. "
            ""
            "DIRECTLY AHEAD at center: polished dark walnut concierge reception desk "
            "with brass edge detail. Behind the desk stands a well-dressed young woman "
            "in a tailored charcoal suit, hands resting on desk, professional smile. "
            "Brass desk lamp and white flowers on desk. "
            ""
            "LEFT SIDE: A wide open CORRIDOR leading deeper into the building, "
            "the corridor opens into a modern living room at its end — "
            "through the passage a deep blue velvet sofa, travertine coffee table "
            "and FLOS Arco floor lamp are CLEARLY VISIBLE in warm afternoon light. "
            "The corridor walls are cream stone with brass sconces. "
            ""
            "RIGHT SIDE: A matching wide open CORRIDOR leading to a classic study — "
            "through the passage dark walnut bookshelves filled with books, "
            "a cognac leather chesterfield armchair and library lamp are CLEARLY VISIBLE. "
            "Same cream stone corridor walls with brass sconces. "
            ""
            "FLOOR: Polished cream marble with circular geometric inlay at center. "
            "CEILING: High barrel-vaulted ceiling, ornate plasterwork, skylight dome "
            "flooding hall with warm daylight, brass chandelier. "
            "Tall potted trees flanking each corridor entrance. "
            "ATMOSPHERE: Grand, symmetrical, welcoming British luxury showroom."
            + HALL_SUFFIX
        ),
    },
    {
        "id": "R01",
        "name": "Modern Sanctuary",
        "prompt": (
            "A modern Conran Shop living room. A deep blue velvet sofa centred, "
            "travertine coffee table with rounded corners, FLOS Arco floor lamp "
            "arching over the sofa, Berber handwoven rug on polished concrete, "
            "floor-to-ceiling window on the right showing muted Riviera sea view, "
            "warm taupe walls with one abstract canvas, soft diffused afternoon light."
            + COMMON_SUFFIX
        ),
    },
    {
        "id": "R02",
        "name": "Classic English",
        "prompt": (
            "A classic English library-lounge in London Mayfair style. "
            "A cognac leather chesterfield sofa against dark green wainscoted walls, "
            "solid oak dining table partially visible on the left, Anglepoise 1227 "
            "desk lamp on a walnut console, Berber rug on herringbone oak flooring, "
            "brass-framed artwork, crystal decanter, late afternoon warm glow from "
            "tall sash windows, heritage English home atmosphere."
            + COMMON_SUFFIX
        ),
    },
    {
        "id": "R03",
        "name": "Mid-Century Lounge",
        "prompt": (
            "A mid-century Scandinavian 1960s lounge. A walnut lounge chair with "
            "cream wool upholstery in Hans Wegner style, teak low table beside it, "
            "FLOS Arco lamp arching above, terracotta and mustard textile cushions, "
            "pale oak floor with a geometric Nanimarquina rug, large sliding window "
            "opening to a pine forest, northern European daylight, serene uncluttered "
            "Aalto architectural detailing."
            + COMMON_SUFFIX
        ),
    },
    {
        "id": "R04",
        "name": "Minimal Scandi",
        "prompt": (
            "A minimal Scandinavian living room in Copenhagen morning light. "
            "An off-white linen modular sofa centred, clear glass console table on "
            "the right, Artemide Tizio desk lamp in matte aluminium, pale jute rug "
            "on light oak flooring, white walls with a single ceramic vase on a "
            "floating oak shelf, tall window filtering pale northern light through "
            "sheer curtains, extreme simplicity, negative space, magazine-quality calm."
            + COMMON_SUFFIX
        ),
    },
]


def build_prompt(room: dict, variant: str) -> str:
    _file, lighting = VARIANTS[variant]
    return f"{room['prompt']} {lighting}"


def generate_one(client, prompt: str, size: str, quality: str) -> bytes:
    resp = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size=size,
        quality=quality,
        n=1,
    )
    url = resp.data[0].url
    import urllib.request

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def save_panorama(img_bytes: bytes, out_dir: Path, filename: str, make_preview: bool) -> tuple[int, int]:
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    w, h = img.size
    # Center-crop to exact 2:1 aspect (equirectangular standard)
    target_h = w // 2
    if target_h < h:
        top = (h - target_h) // 2
        img = img.crop((0, top, w, top + target_h))
    elif target_h > h:
        target_w = h * 2
        left = (w - target_w) // 2
        img = img.crop((left, 0, left + target_w, h))

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    img.save(out_path, "WebP", quality=86, method=6)

    if make_preview:
        preview = img.copy()
        preview.thumbnail((1400, 700))
        preview.save(out_dir / "preview.jpg", "JPEG", quality=80)

    return img.size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Room id (e.g. R03)")
    ap.add_argument(
        "--variant",
        default="day",
        choices=["day", "sunset", "night", "all"],
        help="Time-of-day variant. 'all' generates day+sunset+night.",
    )
    ap.add_argument("--size", default="1792x1024", choices=["1792x1024", "1024x1024"])
    ap.add_argument("--quality", default="hd", choices=["standard", "hd"])
    args = ap.parse_args()

    load_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("✗ OPENAI_API_KEY not found in C:/Cowork/.env", file=sys.stderr)
        return 2

    try:
        from openai import OpenAI
    except ImportError:
        print("✗ openai package missing — run: pip install openai", file=sys.stderr)
        return 2

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    root = Path(__file__).resolve().parent.parent
    base_out = root / "public" / "panos"

    rooms = [r for r in ROOMS if not args.only or r["id"] == args.only]
    if not rooms:
        print(f"✗ No rooms matching --only {args.only}", file=sys.stderr)
        return 2

    variants = ["day", "sunset", "night"] if args.variant == "all" else [args.variant]
    jobs = [(room, v) for room in rooms for v in variants]

    print(
        f"→ {len(jobs)} generations via DALL·E 3 "
        f"({args.size}, {args.quality}) — {len(rooms)} room(s) × {len(variants)} variant(s)"
    )
    for i, (room, variant) in enumerate(jobs, 1):
        filename, _lighting = VARIANTS[variant]
        print(f"\n[{i}/{len(jobs)}] {room['id']} / {variant}  →  {filename}")
        try:
            prompt = build_prompt(room, variant)
            bytes_ = generate_one(client, prompt, args.size, args.quality)
            # preview.jpg is generated from the "day" variant (the card hero)
            make_preview = variant == "day"
            size = save_panorama(bytes_, base_out / room["id"], filename, make_preview)
            print(f"    ✓ saved {room['id']}/{filename}  ({size[0]}×{size[1]})")
        except Exception as e:
            print(f"    ✗ failed: {e}", file=sys.stderr)

    print("\n✓ done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
