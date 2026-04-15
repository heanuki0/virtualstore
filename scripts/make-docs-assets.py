"""Generate README visual assets.

Outputs:
  docs/hero.jpg                      — 2×2 grid of 4 roomset previews, with overlay label
  docs/screenshots/01_exterior.png   — live Exterior scene
  docs/screenshots/02_customize.png  — live Customize + Marzipano
  docs/screenshots/03_ai.png         — AI assistant opened with a response

Hero requires only Pillow + existing preview.jpg files.
Scene screenshots spin up Playwright against the running dev server (port 5173).

Usage:
  npm run dev   # in another terminal, wait for "ready"
  python scripts/make-docs-assets.py           # generate everything
  python scripts/make-docs-assets.py --hero    # hero only
"""
import argparse
import sys
from pathlib import Path
from time import sleep

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image, ImageDraw, ImageFilter, ImageFont  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PANOS = ROOT / "public" / "panos"
DOCS = ROOT / "docs"
SHOTS = DOCS / "screenshots"


# ---------------------------------------------------------------------------
# Hero collage
# ---------------------------------------------------------------------------
def make_hero() -> Path:
    """2×2 grid with title overlay, saved as docs/hero.jpg."""
    tiles = [
        ("R01", "Modern Sanctuary", "모던"),
        ("R02", "Classic English", "클래식"),
        ("R03", "Mid-Century Lounge", "미드센추리"),
        ("R04", "Minimal Scandi", "미니멀"),
    ]
    TILE_W, TILE_H = 700, 350
    GRID_W, GRID_H = TILE_W * 2, TILE_H * 2
    canvas = Image.new("RGB", (GRID_W, GRID_H), (10, 10, 10))

    for i, (rid, name, ko) in enumerate(tiles):
        src = PANOS / rid / "preview.jpg"
        img = Image.open(src).convert("RGB")
        img.thumbnail((TILE_W * 2, TILE_H * 2))
        # center-crop to tile aspect
        w, h = img.size
        target_ratio = TILE_W / TILE_H
        if w / h > target_ratio:
            new_w = int(h * target_ratio)
            img = img.crop(((w - new_w) // 2, 0, (w + new_w) // 2, h))
        else:
            new_h = int(w / target_ratio)
            img = img.crop((0, (h - new_h) // 2, w, (h + new_h) // 2))
        img = img.resize((TILE_W, TILE_H))

        # darken edges for text legibility
        overlay = Image.new("RGBA", (TILE_W, TILE_H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rectangle([0, TILE_H - 80, TILE_W, TILE_H], fill=(0, 0, 0, 140))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

        # labels
        d = ImageDraw.Draw(img)
        try:
            title_font = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 26)
            sub_font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 14)
        except OSError:
            title_font = sub_font = ImageFont.load_default()
        d.text((24, TILE_H - 60), name, fill=(255, 255, 255), font=title_font)
        d.text((24, TILE_H - 26), ko, fill=(184, 147, 90), font=sub_font)

        col = i % 2
        row = i // 2
        canvas.paste(img, (col * TILE_W, row * TILE_H))

    # global top bar with app title
    bar = Image.new("RGBA", (GRID_W, 80), (10, 10, 10, 230))
    bd = ImageDraw.Draw(bar)
    try:
        brand_font = ImageFont.truetype("C:/Windows/Fonts/georgiaz.ttf", 32)
        tag_font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 14)
    except OSError:
        brand_font = tag_font = ImageFont.load_default()
    bd.text((30, 14), "The Conran Shop × LOTTE", fill=(255, 255, 255), font=brand_font)
    bd.text((32, 52), "WEB VIRTUAL STORE · 4 curated roomsets × 3 moods", fill=(184, 147, 90), font=tag_font)

    hero = canvas.convert("RGBA")
    hero.paste(bar, (0, 0), bar)
    hero = hero.convert("RGB")

    DOCS.mkdir(parents=True, exist_ok=True)
    out = DOCS / "hero.jpg"
    hero.save(out, "JPEG", quality=88, optimize=True)
    print(f"OK  hero.jpg  {out.stat().st_size / 1024:.1f} KB")
    return out


# ---------------------------------------------------------------------------
# Live scene screenshots via Playwright
# ---------------------------------------------------------------------------
def make_screenshots(base_url: str = "http://localhost:5173") -> None:
    from playwright.sync_api import sync_playwright

    SHOTS.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            ctx = browser.new_context(viewport={"width": 1440, "height": 900})
            page = ctx.new_page()

            # 1. Exterior
            page.goto(base_url + "/#/exterior", wait_until="networkidle")
            page.wait_for_timeout(1500)
            page.screenshot(path=str(SHOTS / "01_exterior.png"), full_page=False)
            print("OK  01_exterior.png")

            # 2. Customize + Marzipano
            page.goto(base_url + "/#/customize", wait_until="networkidle")
            page.wait_for_timeout(3500)  # wait for panorama + hotspots
            page.screenshot(path=str(SHOTS / "02_customize.png"), full_page=False)
            print("OK  02_customize.png")

            # 3. AI assistant with a response
            page.click("button[aria-label='AI 어시스턴트 열기']")
            page.wait_for_timeout(500)
            # trigger the "5만원대 선물" preset
            for el in page.locator("button").all():
                txt = (el.inner_text() or "").strip()
                if "5만원대 선물" in txt:
                    el.click()
                    break
            page.wait_for_timeout(2500)
            page.screenshot(path=str(SHOTS / "03_ai.png"), full_page=False)
            print("OK  03_ai.png")
        finally:
            browser.close()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hero", action="store_true", help="Only build the hero collage")
    ap.add_argument("--shots", action="store_true", help="Only capture scene screenshots")
    ap.add_argument("--url", default="http://localhost:5173", help="Dev server URL")
    args = ap.parse_args()

    if not args.shots:
        make_hero()
    if not args.hero:
        try:
            make_screenshots(args.url)
        except Exception as e:
            print(f"✗ screenshot capture failed: {e}", file=sys.stderr)
            print("  (is the dev server running on", args.url, "?)", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
