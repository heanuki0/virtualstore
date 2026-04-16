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
    " Interior retail photography, 16:9 wide-angle, carefully curated low-density "
    "styling with strong negative space, museum-plinth spacing, editorial magazine "
    "quality. Absolutely no text, no signage, no letters, no watermark, no people."
)

# Each shot gets its own mood/angle/furniture emphasis.
# R01 = CLUB zone (deep teal + oak herringbone + brass + cognac leather)
# R02 = LAB zone (matte white + exposed ducts + primary accents)
THEMES = {
    "R01": {
        "name": "Conran Livingroom (CLUB zone)",
        "base": (
            "A Conran CLUB-zone lounge and dining scene. Palette: deep teal-green walls "
            "(Farrow & Ball Inchyra Blue tone), matte black-painted ceiling with warm "
            "recessed 2700K spotlights, oak herringbone parquet floor, brushed brass "
            "trim, travertine stone surfaces, cognac leather, translucent frosted-glass "
            "partition. Furniture: deep blue velvet Matthew Hilton Arbor 3-seater sofa, "
            "Matthew Hilton Sloan cognac lounge chair + ottoman, round travertine coffee "
            "table, FLOS Arco floor lamp, Carl Hansen CH327 dining table with 4 CH24 "
            "Wishbone chairs, Louis Poulsen PH5 pendant, walnut String Furniture shelving. "
            "Low density, strong negative space, curated museum-plinth styling."
        ),
        "shots": [
            "Wide establishing shot from the brushed-brass archway doorway, afternoon "
            "daylight filtering in, full view of the deep-teal lounge vignette with "
            "the Matthew Hilton Arbor sofa centered, strong negative space on the "
            "herringbone floor.",

            "Close-up angle of the Matthew Hilton Sloan cognac-leather lounge chair "
            "and ottoman beside the sofa, warm late afternoon rim light catching the "
            "leather surface.",

            "Top-down bird's-eye view showing the herringbone parquet, travertine "
            "coffee table, and Berber rug placement between the lounge and dining "
            "zones — strict editorial composition.",

            "Evening ambient mood with only the FLOS Arco, PH5 pendant and two "
            "travertine table lamps lit, warm amber pools of light against deep teal "
            "shadow, dark windows.",

            "Side angle emphasizing the walnut String Furniture shelving unit "
            "on the teal wall, curated with 3 widely-spaced ceramic objects and "
            "stacked art books, soft spotlight.",

            "Alternative arrangement: sofa turned 45 degrees toward the brass "
            "archway, coffee table repositioned, one additional Iittala glass vase "
            "on the travertine side table.",

            "Detail shot of the CH327 dining table from the far end with Wishbone "
            "chairs in profile, PH5 pendant glowing warmly overhead, Muuto ceramic "
            "centerpiece catching the light."
        ],
    },
    "R02": {
        "name": "Conran Home Office (LAB zone)",
        "base": (
            "A Conran LAB-zone home office. Palette: matte WHITE walls on all sides, "
            "matte white ceiling with exposed brushed-aluminium service ducts and a "
            "linear LED cove, polished white micro-cement floor, pale jute rug. "
            "Furniture: solid white-oak Carl Hansen CH327 desk floating in negative "
            "space, Vitra Eames soft-pad executive chair, Louis Poulsen AJ task lamp "
            "in cadmium-yellow, USM Haller credenza in signal-red on the left wall, "
            "Kartell Componibili cylinder in cobalt-blue on the floor, Vitra Eames "
            "Lounge Chair in cognac leather + Noguchi Akari paper floor lamp in the "
            "reading corner, floating white-oak String shelving on the back wall "
            "with 3 objects only. One John-Booth-style abstract mural. No wooden "
            "beams, no hanok — pure white gallery space. Low density, strong "
            "negative space."
        ),
        "shots": [
            "Wide establishing shot of the LAB home office from the doorway, bright "
            "even LED daylight, full view of the floating CH327 desk against the "
            "matte-white wall, USM Haller signal-red credenza on the left, Eames "
            "Lounge reading corner on the right.",

            "Close-up of the desk workspace showing the cadmium-yellow AJ lamp "
            "glowing, one closed laptop, ceramic pencil holder, nothing else — "
            "low-density curation with strong negative space.",

            "Top-down bird's-eye view showing the desk-chair-jute-rug layout and "
            "the white micro-cement floor — editorial architectural composition.",

            "Evening scene with the LED cove dimmed and only the AJ task lamp "
            "and Noguchi Akari floor lamp glowing warm 2700K, matte-white walls "
            "in cinematic shadow.",

            "Alternative angle emphasizing the Eames Lounge reading corner with "
            "the Akari paper lamp and a HAY side stool holding one hardcover book, "
            "soft LED wash.",

            "Rearranged layout: desk turned parallel to the wall with the USM "
            "credenza, the Eames lounge moved to face the opposite wall, more "
            "spacious feel, same white palette.",

            "Detail shot of the floating String Furniture shelving on the back "
            "wall — one Iittala Aalto glass vase, two stacked books, one small "
            "ceramic object, widely spaced, museum-plinth feel."
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
