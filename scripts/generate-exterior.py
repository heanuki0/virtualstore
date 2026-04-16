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
    "Exterior view of THE CONRAN SHOP flagship store in Seoul Gangnam, "
    "photographed from the opposite sidewalk at golden-hour dusk, three-quarter angle. "
    "Contemporary four-storey retail building with a restrained Conran & Partners facade: "
    "dark bronze-anodised aluminium vertical fins, full-height low-iron glass, "
    "a recessed ground-floor entrance clad in warm travertine stone, bronze-framed door. "
    "Through the glazing — dual-zone interior reveal: "
    "the GROUND FLOOR glows with bright white LAB gallery lighting revealing white "
    "display plinths with colourful object silhouettes (a cobalt-blue vase, a cadmium-yellow "
    "Kartell Componibili, a signal-red accent); "
    "the UPPER FLOOR glows with warmer amber CLUB light revealing a cognac leather lounge "
    "chair silhouette, a brass pendant, and a deep teal-green wall in the background. "
    "Discreet small brass wordmark signage on the travertine wall is intentionally "
    "OUT OF FOCUS and illegible. "
    "Korean streetscape detail: clean granite paving, a single gingko tree, soft "
    "reflections on damp asphalt. "
    "Sky gradient from dusk amber to deep indigo. "
    "Photorealistic 8K architectural photography, editorial color grading, "
    "calm low-density composition. Absolutely no visible text, no letters, "
    "no signage, no watermark, no people."
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
