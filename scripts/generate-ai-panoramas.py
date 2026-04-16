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
        "LIGHTING: bright even daylight, calm gallery brightness, soft diffused light, clean shadows, inviting and calm mood.",
    ),
    "sunset": (
        "sunset.webp",
        "LIGHTING: low-angle golden hour light, amber tones across walls and floor, long soft shadows, warm rim light on surfaces, romantic late afternoon mood.",
    ),
    "night": (
        "night.webp",
        "LIGHTING: night-time interior, only interior lamps glowing warm 2700K (table lamps, floor lamp, pendant), deep moody shadows, cinematic after-dark atmosphere.",
    ),
}

ROOMS = [
    {
        "id": "HALL",
        "name": "Entry Hall (LAB→CLUB transition)",
        "prompt": (
            "Interior entry hall of a Conran flagship design showroom, "
            "SYMMETRICAL equirectangular 360-degree panorama, camera at centre "
            "of hall facing forward. Dual-zone reveal: the hall itself is the "
            "WHITE LAB aesthetic; the corridors at left and right reveal the "
            "DARK CLUB aesthetic."
            ""
            "DIRECTLY AHEAD at centre: a low white monolithic plinth, 1m high, "
            "matte white lacquer, with one single cobalt-blue Alvar Aalto Savoy "
            "vase on it. Behind the plinth stands a young woman concierge in a "
            "tailored cream linen blazer, hands relaxed at her sides, calm "
            "professional smile."
            ""
            "LEFT CORRIDOR OPENING: a tall rectangular white-framed portal leading "
            "into the CLUB zone — inside the corridor: oak herringbone parquet "
            "floor, deep teal-green wall (Farrow & Ball Inchyra Blue tone), a "
            "cognac leather armchair and travertine side table with a brass FLOS "
            "Arco floor lamp clearly visible, warm 2700K spotlighting."
            ""
            "RIGHT CORRIDOR OPENING: a matching tall portal leading into a "
            "mirrored CLUB zone — inside: oak herringbone parquet floor, deep "
            "teal-green wall, a walnut String Furniture shelving unit with "
            "curated ceramic objects and a single Louis Poulsen AJ table lamp "
            "glowing, warm spotlighting."
            ""
            "FLOOR of the main hall: polished white micro-cement with a single "
            "inlaid brushed-brass circle at centre. "
            "CEILING of the main hall: matte white, exposed brushed-aluminium "
            "service ducts running parallel, linear LED cove lighting producing "
            "bright even daylight. "
            "WALLS of the main hall: matte white with one large John-Booth-style "
            "abstract mural in cobalt-blue, cadmium-yellow and signal-red."
            ""
            "Low density, strong negative space, museum-plinth spacing. "
            "ATMOSPHERE: contemporary Conran gallery hall transitioning to a "
            "warmer residential display zone on either side."
            + HALL_SUFFIX
        ),
    },
    {
        "id": "R02",
        "name": "Conran Home Office (LAB)",
        "prompt": (
            "A Conran Home Office in the LAB zone aesthetic, equirectangular "
            "360-degree panorama. Master palette: matte WHITE walls on all four "
            "sides, matte WHITE ceiling with exposed brushed-aluminium service "
            "ducts and a linear LED cove, polished white micro-cement floor, "
            "white lacquered surfaces with minimal primary-color accent objects only."
            ""
            "CENTER OF FRAME: a solid white-oak Carl Hansen CH327 desk floating "
            "in negative space, a Vitra Eames soft-pad executive chair tucked "
            "under it, one Louis Poulsen AJ table lamp in cadmium-yellow, one "
            "laptop closed, one ceramic pencil holder, nothing else on the "
            "desk (low density)."
            ""
            "LEFT SIDE: a USM Haller modular credenza in signal-red, 150cm wide, "
            "floating off the white wall, one Kartell Componibili cylinder in "
            "cobalt-blue beside it on the floor, a single John-Booth-style "
            "abstract mural above it."
            ""
            "RIGHT SIDE: a Vitra Eames Lounge Chair and ottoman in cognac leather "
            "and black shell as the reading corner, an Isamu Noguchi Akari paper "
            "floor lamp beside it, one HAY side stool as a side table with "
            "a single stacked book."
            ""
            "BACK WALL: matte-white wall with a minimal floating white-oak String "
            "Furniture shelving unit (3 shelves only), widely spaced with 1 "
            "Iittala Aalto glass vase, 2 stacked hardcover books, and one small "
            "ceramic object. Nothing more."
            ""
            "FLOOR: polished white micro-cement, a pale jute rug defining the "
            "desk zone, otherwise strong negative space. No wooden beams, no "
            "wooden columns, no hanok architecture — pure minimalist white "
            "gallery space."
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
