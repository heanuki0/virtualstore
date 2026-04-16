"""Generate styling shot gallery images via DALL·E 3.

Produces 7 landscape styling shots per theme (Living + Home Office) for the
Customize scene's bottom carousel. Each shot shows a different furniture
combination / mood / time-of-day, aligning with spec p.12.

Output: public/images/styling/{R01|R02}/shot{1..7}.jpg (1024×1024 cropped to 16:9)

Cost: 14 images × $0.04 (standard) = ~$0.56
Runtime: ~2-3 minutes total

Usage:
    python scripts/generate-styling-shots.py
    python scripts/generate-styling-shots.py --only R01
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


COMMON_SUFFIX = (
    " Interior photography, warm editorial color grading, photorealistic, "
    "magazine-quality, Kinfolk aesthetic, 16:9 wide-angle composition, "
    "luxury home interior. No people, no text, no watermark."
)

# Each shot gets its own mood/angle/furniture emphasis.
THEMES = {
    "R01": {
        "name": "Conran Livingroom",
        "base": (
            "A luxurious modern Conran-style living room with deep blue velvet sofa, "
            "travertine coffee table, FLOS Arco floor lamp arching overhead, "
            "Berber handwoven rug on polished concrete floor, floor-to-ceiling windows, "
            "cream walls, warm walnut accents, carefully curated art books."
        ),
        "shots": [
            "Wide establishing shot from the entrance, afternoon natural light, "
            "full view of sofa arrangement with coffee table centered.",

            "Close-up angle of the Eames-style lounge chair with ottoman beside the sofa, "
            "warm late afternoon sun streaming through sheer curtains.",

            "Top-down bird's eye view showing the Berber rug, coffee table placement, "
            "and furniture layout from above — editorial composition.",

            "Evening ambient mood with all lamps lit (Arco floor, table lamps), "
            "warm amber glow, dark window showing city night lights outside.",

            "Side angle emphasizing the walnut sideboard with ceramic vase and art book stack, "
            "soft morning light casting long shadows.",

            "Alternative furniture arrangement: sofa turned 90 degrees toward window, "
            "coffee table repositioned, showcasing flexibility of the space.",

            "Detail shot of the reading corner with chesterfield chair, "
            "floor lamp, and side table with bowl of fruit, cozy afternoon atmosphere."
        ],
    },
    "R02": {
        "name": "Conran Home Office",
        "base": (
            "A sophisticated Scandinavian home office with solid oak Carl Hansen CH327 "
            "desk, Herman Miller Aeron chair, floor-to-ceiling String Furniture shelving "
            "filled with books and art objects, Louis Poulsen AJ lamp, Eames lounge "
            "chair in reading corner, textured wool rug, tall sash windows."
        ),
        "shots": [
            "Wide establishing shot of the office from the doorway, bright morning daylight, "
            "full view of desk arrangement with shelving backdrop.",

            "Close-up of the desk workspace showing the AJ lamp glowing, "
            "open books, and ceramic pen holder, late afternoon warm light.",

            "Top-down view of the room showing desk-chair-rug layout from above, "
            "architectural editorial composition.",

            "Evening scene with desk lamp and ceiling pendants glowing, "
            "warm intimate light, dark window hinting at night outside.",

            "Alternative angle emphasizing the Eames lounge chair reading corner "
            "with floor lamp and side table of books, soft window light.",

            "Rearranged layout: desk turned parallel to window, "
            "shelving in background, more spacious feel.",

            "Detail shot of the bookshelf styling with ceramic vases, sculptural objects, "
            "framed art, and carefully arranged books, warm editorial light."
        ],
    },
}


def generate_one(client, prompt: str) -> bytes:
    resp = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1792x1024",
        quality="standard",
        n=1,
    )
    url = resp.data[0].url
    import urllib.request

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def save_shot(img_bytes: bytes, out_path: Path) -> tuple[int, int]:
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    # Keep aspect ratio; DALL·E returns 1792×1024, which is already 16:9-ish
    # Optionally downscale to 1400×800 for bandwidth
    img.thumbnail((1400, 800))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "JPEG", quality=84, optimize=True)
    return img.size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Theme ID (R01 or R02)")
    ap.add_argument("--start", type=int, default=1, help="Start from shot N (1-indexed)")
    args = ap.parse_args()

    load_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("✗ OPENAI_API_KEY not found", file=sys.stderr)
        return 2

    try:
        from openai import OpenAI
    except ImportError:
        print("✗ openai package missing — run: pip install openai", file=sys.stderr)
        return 2

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    root = Path(__file__).resolve().parent.parent
    base_out = root / "public" / "images" / "styling"

    themes = {k: v for k, v in THEMES.items() if not args.only or k == args.only}
    if not themes:
        print(f"✗ No theme matching --only {args.only}", file=sys.stderr)
        return 2

    total = sum(len(t["shots"]) for t in themes.values())
    print(f"→ Generating {total} styling shots via DALL·E 3 (1792×1024, standard)")
    i = 0
    for theme_id, theme in themes.items():
        for idx, mood in enumerate(theme["shots"], 1):
            if idx < args.start:
                continue
            i += 1
            out_file = base_out / theme_id / f"shot{idx}.jpg"
            if out_file.exists():
                print(f"[{i}/{total}] {theme_id}/shot{idx}.jpg — already exists, skipping")
                continue
            prompt = f"{theme['base']} {mood}{COMMON_SUFFIX}"
            print(f"\n[{i}/{total}] {theme_id}/shot{idx}.jpg")
            try:
                bytes_ = generate_one(client, prompt)
                size = save_shot(bytes_, out_file)
                print(f"    ✓ saved ({size[0]}×{size[1]})")
            except Exception as e:
                print(f"    ✗ failed: {e}", file=sys.stderr)

    print("\n✓ done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
