# -*- coding: utf-8 -*-
"""
Sinh bộ biểu tượng PWA cho TeenVoca AI (cây nghề nghiệp: gốc rễ – thân – tán – quả).
Chạy:  python tools/generate_icons.py   -> ghi vào thư mục icons/
Vẽ ở độ phân giải 1024px rồi thu nhỏ để nét mượt.
"""
import os
import sys

from PIL import Image, ImageDraw

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons')
S = 1024

GREEN_TOP = (16, 185, 129)     # #10b981
GREEN_BOTTOM = (4, 120, 87)    # #047857
WHITE = (255, 255, 255)
FRUIT = (251, 191, 36)         # quả ngọt – vàng cam
ROOT_COLOR = (167, 243, 208)   # rễ – xanh nhạt


def gradient(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(GREEN_TOP[i] + (GREEN_BOTTOM[i] - GREEN_TOP[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img


def draw_tree(img, scale):
    """Vẽ cây ở giữa ảnh; scale = tỉ lệ kích thước cây so với ảnh (vùng an toàn cho maskable)."""
    d = ImageDraw.Draw(img)
    c = S / 2

    def p(v):  # quy đổi toạ độ tương đối (-0.5..0.5) quanh tâm
        return c + v * S * scale

    # Tán lá: 3 vòng tròn chồng nhau
    for cx, cy, r in [(-0.17, -0.12, 0.2), (0.17, -0.12, 0.2), (0.0, -0.25, 0.23)]:
        d.ellipse([p(cx - r), p(cy - r), p(cx + r), p(cy + r)], fill=WHITE)
    # Thân cây
    d.rounded_rectangle([p(-0.055), p(-0.15), p(0.055), p(0.3)], radius=S * scale * 0.03, fill=WHITE)
    # Rễ
    w = int(S * scale * 0.035)
    d.line([p(0), p(0.28), p(-0.2), p(0.42)], fill=ROOT_COLOR, width=w)
    d.line([p(0), p(0.28), p(0.2), p(0.42)], fill=ROOT_COLOR, width=w)
    d.line([p(0), p(0.29), p(0), p(0.45)], fill=ROOT_COLOR, width=w)
    # Quả ngọt
    for fx, fy in [(-0.15, -0.1), (0.13, -0.05), (0.03, -0.3), (-0.02, -0.12)]:
        r = 0.045
        d.ellipse([p(fx - r), p(fy - r), p(fx + r), p(fy + r)], fill=FRUIT)


def rounded_mask(size, radius_ratio):
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255)
    return mask


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)
    print('✓', name, f'{size}x{size}')


def main():
    os.makedirs(OUT, exist_ok=True)

    # Biểu tượng thường (purpose "any"): bo góc, nền trong suốt ngoài góc
    base = gradient(S)
    draw_tree(base, 0.8)
    any_icon = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    any_icon.paste(base, (0, 0), rounded_mask(S, 0.22))
    for size in (512, 192):
        save(any_icon, f'icon-{size}.png', size)
    save(any_icon, 'favicon-32.png', 32)

    # Biểu tượng maskable: tràn nền, cây nằm trong vùng an toàn (hình tròn bán kính 40%) ở giữa
    mask_img = gradient(S)
    draw_tree(mask_img, 0.62)
    save(mask_img, 'icon-maskable-512.png', 512)
    save(mask_img, 'icon-maskable-192.png', 192)

    # iPhone/iPad: không hỗ trợ nền trong suốt, iOS tự bo góc
    apple = gradient(S)
    draw_tree(apple, 0.76)
    save(apple, 'apple-touch-icon.png', 180)


if __name__ == '__main__':
    main()
