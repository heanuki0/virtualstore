"""Generate a single Conran-style building exterior image via DALL·E 3.

Saves as WebP to public/images/exterior.webp (NOT equirectangular — regular wide image).

Usage:
    python scripts/generate-exterior.py
"""
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


PROMPT = (
    "Exterior view of an elegant Georgian townhouse design shop in Mayfair London, "
    "photographed from across the street at golden hour dusk. "
    "SYMMETRICAL cream Portland stone facade, 3 storeys, 5 bays of tall sash windows. "
    "Central entrance: polished black lacquered double door with brass door knocker "
    "and a beautiful semicircular fanlight window above. "
    "Ground floor: two large shop display windows with warm interior light glowing, "
    "left window shows a blue velvet sofa and modern floor lamp, "
    "right window shows dark walnut bookshelves and a cognac leather chair. "
    "Brass street lamps flanking the entrance, casting warm glow. "
    "Two spherical topiary in terracotta pots beside the door. "
    "3-step stone entrance staircase with elegant iron handrails. "
    "Slate roof with symmetrical chimneys. "
    "London plane trees with golden autumn leaves across the street. "
    "Stone paving sidewalk. Twilight sky with warm amber-to-deep-blue gradient. "
    "Photorealistic 8K, cinematic wide-angle composition, "
    "warm editorial color grading, architectural photography, "
    "Kinfolk magazine aesthetic. No people, no text, no watermark."
)


def main() -> int:
    load_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("✗ OPENAI_API_KEY not found", file=sys.stderr)
        return 2

    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    print("→ Generating exterior image via DALL·E 3 (1792×1024, hd)...")
    resp = client.images.generate(
        model="dall-e-3",
        prompt=PROMPT,
        size="1792x1024",
        quality="hd",
        n=1,
    )
    url = resp.data[0].url

    import urllib.request

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        img_bytes = r.read()

    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    out_dir = Path(__file__).resolve().parent.parent / "public" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)

    out_path = out_dir / "exterior.webp"
    img.save(out_path, "WebP", quality=90, method=6)
    print(f"  ✓ saved {out_path}  ({img.size[0]}×{img.size[1]})")

    # Also save a smaller JPEG for preview/fallback
    preview = img.copy()
    preview.thumbnail((1400, 800))
    preview.save(out_dir / "exterior_preview.jpg", "JPEG", quality=85)
    print(f"  ✓ saved exterior_preview.jpg")

    print("\n✓ done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
