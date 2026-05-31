#!/usr/bin/env python3
"""Genereert nette placeholder-afbeeldingen (.webp) in stijl C (navy/goud).
Leest content/projecten/*.json voor titels en fotobestandsnamen.
Gegenereerde bestanden zijn bedoeld om later 1-op-1 vervangen te worden
door echte foto's met dezelfde bestandsnaam."""

import json, os, glob, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
IMG = os.path.join(ROOT, 'assets', 'images')
IMG_SITE = os.path.join(IMG, 'site')
IMG_PROJ = os.path.join(IMG, 'projecten')
PROJ = os.path.join(ROOT, 'content', 'projecten')
os.makedirs(IMG_SITE, exist_ok=True)
os.makedirs(IMG_PROJ, exist_ok=True)

CAT_LABELS = {'woning': 'Woning', 'appartement': 'Appartement',
              'bedrijfspand': 'Bedrijfspand', 'renovatie': 'Renovatie'}

SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIF_B = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

NAVY = (14, 31, 61)
NAVY_DARK = (8, 18, 38)
GOLD = (200, 168, 86)
GOLD_LT = (216, 189, 114)
CREAM = (247, 244, 237)


def font(path, size):
    return ImageFont.truetype(path, size)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(size, c1, c2, angle=120):
    w, h = size
    base = Image.new('RGB', size, c1)
    top = Image.new('RGB', size, c2)
    mask = Image.new('L', size)
    md = mask.load()
    rad = math.radians(angle)
    dx, dy = math.cos(rad), math.sin(rad)
    # projectie-bereik normaliseren
    vals = [0 * dx + 0 * dy, w * dx + 0 * dy, 0 * dx + h * dy, w * dx + h * dy]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1
    for y in range(h):
        ydy = y * dy
        for x in range(w):
            t = ((x * dx + ydy) - lo) / span
            md[x, y] = int(t * 255)
    return Image.composite(top, base, mask)


def vignette(im):
    w, h = im.size
    v = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(v)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    v = v.filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    dark = Image.new('RGB', (w, h), NAVY_DARK)
    return Image.composite(im, dark, v)


def draw_center(d, cx, y, text, fnt, fill, spacing=0, anchor_top=True):
    if spacing:
        # letter-spacing simuleren
        widths = [d.textlength(ch, font=fnt) for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = cx - total / 2
        for ch, wch in zip(text, widths):
            d.text((x, y), ch, font=fnt, fill=fill)
            x += wch + spacing
        return
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    d.text((cx - tw / 2, y), text, font=fnt, fill=fill)


def wrap(d, text, fnt, maxw):
    words = text.split()
    lines, cur = [], ''
    for wd in words:
        test = (cur + ' ' + wd).strip()
        if d.textlength(test, font=fnt) <= maxw:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def make(path, size, title, label, tint=0.0, with_frame=True):
    w, h = size
    c2 = lerp(NAVY, (18, 40, 70), tint)
    im = gradient(size, NAVY_DARK, c2, angle=120 + tint * 40)
    im = vignette(im)
    d = ImageDraw.Draw(im, 'RGBA')

    scale = h / 600.0
    # gouden kaderlijn
    if with_frame:
        m = int(26 * scale)
        d.rectangle([m, m, w - m, h - m], outline=GOLD + (120,), width=max(1, int(1.5 * scale)))

    # wordmark boven
    fw = font(SANS, max(11, int(15 * scale)))
    draw_center(d, w / 2, int(46 * scale), 'SAARLOOS VASTGOED', fw, GOLD_LT, spacing=int(6 * scale))

    # decoratieve gouden streep
    sw = int(46 * scale)
    d.line([(w / 2 - sw, h * 0.40), (w / 2 + sw, h * 0.40)], fill=GOLD, width=max(1, int(2 * scale)))

    # titel (serif, gewikkeld)
    ft = font(SERIF_B, max(20, int(40 * scale)))
    lines = wrap(d, title, ft, w * 0.78)
    lh = (ft.getbbox('Hg')[3] - ft.getbbox('Hg')[1]) * 1.25
    ty = h * 0.46
    for ln in lines:
        draw_center(d, w / 2, ty, ln, ft, CREAM)
        ty += lh

    # label onder
    fl = font(SANS, max(10, int(14 * scale)))
    draw_center(d, w / 2, h - int(60 * scale), label, fl, GOLD_LT + (220,), spacing=int(3 * scale))

    im.save(path, 'WEBP', quality=82, method=6)


def main():
    count = 0

    # Site-brede beelden (bedrijfsfoto's) → assets/images/site/
    make(os.path.join(IMG_SITE, 'hero.webp'), (1600, 900),
         'Vastgoed met visie en vakmanschap', 'PROFESSIONELE VASTGOEDFOTO — PLACEHOLDER', tint=0.2)
    count += 1
    make(os.path.join(IMG_SITE, 'og-image.webp'), (1200, 630),
         'Saarloos Vastgoed B.V.', 'AANKOOP · VERKOOP · ONTWIKKELING · RENOVATIE', tint=0.15)
    count += 1
    make(os.path.join(IMG_SITE, 'over-pand.webp'), (1000, 750),
         'Ons vakmanschap', 'BEDRIJFSFOTO — PLACEHOLDER', tint=0.1)
    count += 1
    make(os.path.join(IMG_SITE, 'over-team.webp'), (800, 1000),
         'Het team van Saarloos', 'PORTRETFOTO — PLACEHOLDER', tint=0.25)
    count += 1
    make(os.path.join(IMG_SITE, 'cta-pand.webp'), (1600, 700),
         'Samen uw vastgoeddoel bereiken', 'PLACEHOLDER', tint=0.18)
    count += 1

    # Algemene projectplaceholder → assets/images/projecten/
    make(os.path.join(IMG_PROJ, 'project-placeholder.webp'), (600, 400),
         'Project', 'PROJECTFOTO — PLACEHOLDER', tint=0.1)
    count += 1

    # Projectbeelden uit JSON → assets/images/projecten/
    files = sorted(glob.glob(os.path.join(PROJ, '*.json')))
    for idx, f in enumerate(files):
        with open(f, encoding='utf-8') as fh:
            p = json.load(fh)
        tint = (idx % 5) * 0.07
        label = CAT_LABELS.get(p.get('categorie', ''), p.get('categorie', '')).upper()
        # uitgelichte afbeelding (kale bestandsnaam in JSON)
        make(os.path.join(IMG_PROJ, p['uitgelichte_afbeelding']), (900, 600),
             p['titel'], p['locatie'].upper() + ' · ' + label, tint=tint)
        count += 1
        # galerij
        for i, foto in enumerate(p.get('fotos', []), start=1):
            make(os.path.join(IMG_PROJ, foto['src']), (1200, 900),
                 p['titel'], 'FOTO ' + str(i), tint=tint, with_frame=True)
            count += 1

    print('Gegenereerd: %d afbeeldingen (site/ + projecten/)' % count)


if __name__ == '__main__':
    main()
