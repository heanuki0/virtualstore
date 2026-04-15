"""Generate a synthetic equirectangular test panorama for development.

실제 AI 파노라마(Phase 1-W2 후반)가 나오기 전, Marzipano 파이프라인이 end-to-end
동작하는지 검증하기 위한 플레이스홀더.  Output:  public/panos/R01/equirect.webp

Usage:
  python scripts/generate-test-panorama.py
"""
import sys
import os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

W, H = 4096, 2048  # equirectangular 2:1

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "public", "panos", "R01")
os.makedirs(OUT_DIR, exist_ok=True)
OUT = os.path.join(OUT_DIR, "equirect.webp")
PREVIEW = os.path.join(OUT_DIR, "preview.jpg")


def fill_band(draw: ImageDraw.ImageDraw, y0: int, y1: int, c0, c1) -> None:
    span = max(1, y1 - y0)
    for y in range(y0, y1):
        t = (y - y0) / span
        c = tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))
        draw.line([(0, y), (W, y)], fill=c)


def main() -> None:
    img = Image.new("RGB", (W, H), (240, 232, 208))
    draw = ImageDraw.Draw(img)

    # Ceiling
    fill_band(draw, 0, H // 5, (30, 25, 20), (70, 60, 45))
    # Upper wall (warm cream)
    fill_band(draw, H // 5, H // 2, (235, 220, 180), (230, 210, 170))
    # Baseboard (thin dark strip)
    fill_band(draw, H // 2 - 14, H // 2, (50, 35, 22), (50, 35, 22))
    # Floor (wood tone)
    fill_band(draw, H // 2, H, (210, 170, 100), (120, 85, 50))

    # Front-facing window (center: x=W/2)
    wx, wy, ww, wh = W // 2 - 500, H // 4 + 40, 1000, 620
    draw.rectangle([wx, wy, wx + ww, wy + wh], fill=(200, 220, 235), outline=(30, 22, 16), width=14)
    draw.line([(wx + ww // 2, wy), (wx + ww // 2, wy + wh)], fill=(30, 22, 16), width=10)
    draw.line([(wx, wy + wh // 2), (wx + ww, wy + wh // 2)], fill=(30, 22, 16), width=10)

    # Light beam on floor
    draw.polygon(
        [
            (wx + 80, wy + wh),
            (wx + ww - 80, wy + wh),
            (wx + ww + 360, H - 80),
            (wx - 360, H - 80),
        ],
        fill=(245, 225, 170),
    )

    # Art frames on each side wall (x≈W/4 and x≈3W/4)
    for cx in [W // 4, W * 3 // 4]:
        ax, ay, aw, ah = cx - 140, H // 3, 280, 400
        draw.rectangle([ax, ay, ax + aw, ay + ah], fill=(60, 40, 28), outline=(125, 85, 45), width=14)
        draw.rectangle([ax + 20, ay + 20, ax + aw - 20, ay + ah - 20], fill=(190, 155, 115))

    # Back wall panel (x≈0 / x≈W due to wrap-around) — decorative moulding
    for seg in [(0, 200), (W - 200, W)]:
        draw.rectangle([seg[0], H // 3, seg[1], H * 2 // 3], outline=(120, 85, 45), width=8)

    # Soft blur to disguise equirect seams a little
    img = img.filter(ImageFilter.GaussianBlur(radius=2))

    img.save(OUT, "WebP", quality=85, method=6)
    # Preview thumbnail (Marzipano preview + gallery hero)
    preview = img.copy()
    preview.thumbnail((1400, 700))
    preview.save(PREVIEW, "JPEG", quality=80)

    print(f"OK  equirect  {OUT}  ({os.path.getsize(OUT) / 1024:.1f} KB)")
    print(f"OK  preview   {PREVIEW}  ({os.path.getsize(PREVIEW) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
