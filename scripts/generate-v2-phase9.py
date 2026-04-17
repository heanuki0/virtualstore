"""Phase 9 — spec-matching panorama/image regeneration.

Matches d.pdf spec exactly:
- R01 Livingroom: bright cream/beige natural light living room (spec p.9 reference)
- R02 Home Office: bright natural light study with bookshelves (spec p.10 reference)
- Styling shots: same warm cream tone (spec p.12 reference)

NO LAB/CLUB dual-zone. Pure "bright magazine interior" aesthetic matching the spec.

Usage:
    python scripts/generate-v2-phase9.py                  # all
    python scripts/generate-v2-phase9.py --only R01       # R01 main (3 variants)
    python scripts/generate-v2-phase9.py --only R02       # R02 main (3 variants)
    python scripts/generate-v2-phase9.py --only waypoints # R01 sofa + dining
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


EQUIRECT_SUFFIX = (
    " Wide-angle equirectangular 360-degree interior panorama, "
    "strict 2:1 aspect ratio, seamless horizon. "
    "Photorealistic 8K detail, architectural interior photography, "
    "warm editorial color grading, Kinfolk magazine aesthetic. "
    "Low furniture density with generous negative space. "
    "Absolutely no text, no signage, no letters, no watermark, no people."
)

# ─── R01 LIVINGROOM — matching spec p.9 exactly ─────────────────────

R01_BASE = (
    "A bright, airy contemporary living room in a luxury apartment, "
    "equirectangular 360-degree panorama. "
    "PALETTE: warm cream/beige walls with white molding trim, "
    "light oak wide-plank parquet floor, soft afternoon natural light "
    "streaming through tall sash windows with sheer white curtains. "
    ""
    "LEFT SIDE: a Vitra Eames Lounge Chair and Ottoman in black leather "
    "with dark walnut shell, positioned at an angle facing a glass-topped "
    "Isamu Noguchi coffee table with sculptural walnut base. "
    ""
    "CENTER: a large beige/taupe fabric 3-seater sofa (Conran Chilton style) "
    "with soft cushions, on a textured grey wool area rug. Behind the sofa: "
    "a light grey USM Haller sideboard with minimal objects on top. "
    ""
    "RIGHT SIDE: visible dining area transition — Carl Hansen CH24 Wishbone "
    "chairs in natural oak around a dining table, natural light from windows. "
    ""
    "BACKGROUND: a tall white Louis Poulsen Panthella floor lamp beside "
    "the window, cream walls with subtle white crown molding, one doorway "
    "leading to another room. "
    ""
    "FLOOR: light oak wide-plank parquet, warm honey tone. "
    "RUG: textured grey/beige wool rug under the sofa group. "
    "MOOD: bright, calm, magazine-quality Scandinavian contemporary, "
    "generous negative space between furniture groupings."
)

R01_DAY    = R01_BASE + " LIGHTING: bright afternoon daylight, soft diffused natural light from windows, clean gentle shadows, warm and inviting."
R01_SUNSET = R01_BASE + " LIGHTING: golden hour sunset through windows, amber and rose tones warming the cream walls, long soft shadows on the oak floor."
R01_NIGHT  = R01_BASE + " LIGHTING: evening interior, Panthella floor lamp and table lamps glowing warm 2700K, dark windows, cozy intimate atmosphere, soft amber pools of light."

R01_SOFA = (
    "Close-up waypoint view within a bright cream living room. "
    "Camera beside the beige Conran Chilton sofa, looking at the seating area. "
    "Foreground: sofa cushions and armrest, Vitra Eames Lounge Chair in black "
    "leather directly opposite. Midground: Noguchi glass coffee table. "
    "Background: cream walls, oak floor, natural window light. "
    "Warm, bright, magazine-quality interior."
)

R01_DINING = (
    "Close-up waypoint view of a bright dining area within the same apartment. "
    "Camera beside a Carl Hansen CH327 oak dining table, looking down its length. "
    "Foreground: table edge, Wishbone chairs in natural oak. "
    "Above: Louis Poulsen PH5 pendant lamp hanging over the table. "
    "Background: living area visible (beige sofa, Eames chair in distance). "
    "Light oak floor, cream walls, natural daylight, warm editorial tone."
)

# ─── R02 HOME OFFICE — matching spec p.10 exactly ───────────────────

R02_BASE = (
    "A bright, contemporary home office/study in a luxury apartment, "
    "equirectangular 360-degree panorama. "
    "PALETTE: warm cream/light grey walls, natural oak floor, "
    "natural daylight from tall windows. "
    ""
    "CENTER: a solid oak Carl Hansen CH327 desk facing the room, "
    "a Herman Miller Aeron office chair in black mesh behind it, "
    "one Louis Poulsen AJ table lamp in black on the desk, "
    "a closed laptop and one small pen holder. "
    ""
    "BACK WALL: floor-to-ceiling open bookshelves in light oak/walnut, "
    "filled with neatly arranged books, ceramic vases, small art objects, "
    "and a few design magazines. The shelving has a warm, curated look. "
    ""
    "LEFT SIDE: a Vitra Eames Lounge Chair and Ottoman in black leather "
    "as a reading corner, with a small side table and a stacked book. "
    ""
    "RIGHT SIDE: a USM Haller credenza in white/light grey with minimal "
    "objects on top, a Kartell Componibili cylinder beside it. "
    ""
    "FLOOR: light oak wide-plank parquet, a textured wool area rug "
    "under the desk area. "
    "MOOD: bright, intellectual, organized, warm Scandinavian modern, "
    "generous negative space, magazine editorial quality."
)

R02_DAY    = R02_BASE + " LIGHTING: bright morning daylight, even soft fill from windows, clean shadows, calm productive atmosphere."
R02_SUNSET = R02_BASE + " LIGHTING: late afternoon golden light entering from the side, warm amber tones on the bookshelves, soft shadows."
R02_NIGHT  = R02_BASE + " LIGHTING: evening, desk lamp and one floor lamp glowing warm 2700K, bookshelves lit by accent spotlights, dark windows, studious cozy atmosphere."


JOBS = [
    ("R01_day",     "public/panos/R01/equirect.webp", R01_DAY    + EQUIRECT_SUFFIX, True),
    ("R01_sunset",  "public/panos/R01/sunset.webp",   R01_SUNSET + EQUIRECT_SUFFIX, True),
    ("R01_night",   "public/panos/R01/night.webp",    R01_NIGHT  + EQUIRECT_SUFFIX, True),
    ("R01_sofa",    "public/panos/R01/sofa.webp",     R01_SOFA   + EQUIRECT_SUFFIX, True),
    ("R01_dining",  "public/panos/R01/dining.webp",   R01_DINING + EQUIRECT_SUFFIX, True),
    ("R02_day",     "public/panos/R02/equirect.webp", R02_DAY    + EQUIRECT_SUFFIX, True),
    ("R02_sunset",  "public/panos/R02/sunset.webp",   R02_SUNSET + EQUIRECT_SUFFIX, True),
    ("R02_night",   "public/panos/R02/night.webp",    R02_NIGHT  + EQUIRECT_SUFFIX, True),
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
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "WebP", quality=86, method=6)
    if make_preview:
        preview = img.copy()
        preview.thumbnail((1400, 700))
        preview.save(out_path.parent / "preview.jpg", "JPEG", quality=82)
    return img.size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="R01 | R02 | waypoints | a specific key")
    args = ap.parse_args()

    load_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("✗ OPENAI_API_KEY not found", file=sys.stderr)
        return 2

    from openai import OpenAI
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    selected = JOBS
    if args.only:
        if args.only == "R01":
            selected = [j for j in JOBS if j[0] in ("R01_day", "R01_sunset", "R01_night")]
        elif args.only == "R02":
            selected = [j for j in JOBS if j[0].startswith("R02")]
        elif args.only == "waypoints":
            selected = [j for j in JOBS if j[0] in ("R01_sofa", "R01_dining")]
        else:
            selected = [j for j in JOBS if j[0] == args.only]

    root = Path(__file__).resolve().parent.parent
    print(f"→ Generating {len(selected)} images via DALL·E 3 (1792×1024, hd)")

    for i, (key, rel, prompt, equirect) in enumerate(selected, 1):
        out_path = root / rel
        print(f"\n[{i}/{len(selected)}] {key} → {rel}")
        try:
            bytes_ = generate_one(client, prompt)
            make_preview = key.endswith("_day")
            size = save_image(bytes_, out_path, equirect, make_preview)
            print(f"    ✓ saved ({size[0]}×{size[1]})")
        except Exception as e:
            print(f"    ✗ failed: {e}", file=sys.stderr)

    print("\n✓ done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
