# Les decors du site Nikkie Sushi (LocWeb, 2026-10-14).
#   deco-enso.png   : le cercle au pinceau de leur logo, sans le texte,
#                     pour un grand decor dore derriere la photo du hero.
#   deco-sakura.png : une branche de cerisier rouge, comme sur leurs
#                     visuels Instagram (fleurs rouges sur fond noir).
# Usage : python _source/deco.py <dossier contenant logo-wix.png>
import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__))
DST = os.path.join(ICI, '..', 'photos')

# --- 1. L'enso : on garde l'anneau du logo, on efface tout l'interieur.
logo = Image.open(os.path.join(SRC, 'logo-wix.png')).convert('RGBA')
logo = logo.crop(logo.getbbox())
w, h = logo.size
cx, cy, R = w / 2, h / 2, min(w, h) / 2
px = logo.load()
for y in range(h):
    for x in range(w):
        if math.hypot(x - cx, y - cy) < R * 0.80:
            px[x, y] = (0, 0, 0, 0)
enso = logo.crop(logo.getbbox())
enso.thumbnail((900, 900))
enso.save(os.path.join(DST, 'deco-enso.png'), optimize=True)

# --- 2. La branche de cerisier, dessinee en 3x puis reduite (lissage).
random.seed(7)
K = 3
W, H = 1100, 760
im = Image.new('RGBA', (W * K, H * K), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

def bezier(p0, p1, p2, n=60):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in [i / n for i in range(n + 1)]]

def trait(points, e0, e1, coul):
    for i in range(len(points) - 1):
        e = (e0 + (e1 - e0) * i / (len(points) - 1)) * K
        (x0, y0), (x1, y1) = points[i], points[i + 1]
        d.line([(x0 * K, y0 * K), (x1 * K, y1 * K)], fill=coul, width=max(1, int(e)))
        d.ellipse([x1 * K - e / 2, y1 * K - e / 2, x1 * K + e / 2, y1 * K + e / 2], fill=coul)

BOIS = (58, 30, 24, 255)
fleurs = []
tronc = bezier((W + 20, 40), (760, 230), (300, 330))
trait(tronc, 30, 7, BOIS)
fleurs += [tronc[i] for i in (14, 26, 38, 50, 60)]
rameaux = [((820, 160), (700, 40), (560, 70)), ((640, 260), (560, 420), (420, 520)),
           ((470, 300), (360, 230), (250, 190)), ((380, 320), (250, 380), (130, 470)),
           ((720, 220), (720, 360), (640, 470))]
for a, b, c in rameaux:
    pts = bezier(a, b, c, 40)
    trait(pts, 9, 2.5, BOIS)
    fleurs += [pts[i] for i in (14, 26, 40)]

ROUGES = [(200, 50, 47), (222, 71, 63), (176, 35, 33), (232, 96, 84)]

def fleur(x, y, r, rot, coul, alpha=255):
    calque = Image.new('RGBA', (int(r * 4 * K), int(r * 4 * K)), (0, 0, 0, 0))
    c = ImageDraw.Draw(calque)
    o = r * 2 * K
    for k in range(5):
        a = rot + k * 2 * math.pi / 5
        px_, py_ = o + math.cos(a) * r * 0.95 * K, o + math.sin(a) * r * 0.95 * K
        pr = r * 0.62 * K
        c.ellipse([px_ - pr, py_ - pr * 0.9, px_ + pr, py_ + pr * 0.9], fill=coul + (alpha,))
    c.ellipse([o - r * .32 * K, o - r * .32 * K, o + r * .32 * K, o + r * .32 * K], fill=(120, 20, 22, alpha))
    for k in range(7):  # les etamines dorees
        a = rot + k * 2 * math.pi / 7
        ex, ey = o + math.cos(a) * r * .45 * K, o + math.sin(a) * r * .45 * K
        c.ellipse([ex - 1.6 * K, ey - 1.6 * K, ex + 1.6 * K, ey + 1.6 * K], fill=(226, 190, 110, alpha))
    im.alpha_composite(calque, (int(x * K - o), int(y * K - o)))

for (x, y) in fleurs:
    for _ in range(random.choice([1, 2, 2, 3])):
        fleur(x + random.uniform(-22, 22), y + random.uniform(-22, 22), random.uniform(13, 22),
              random.uniform(0, 6.28), random.choice(ROUGES))
# Quelques boutons et des petales qui tombent.
for _ in range(14):
    x, y = random.choice(fleurs)
    x += random.uniform(-40, 40); y += random.uniform(-40, 40)
    r = random.uniform(4, 7) * K
    d.ellipse([x * K - r, y * K - r * 1.3, x * K + r, y * K + r * 1.3], fill=random.choice(ROUGES) + (255,))
for _ in range(16):
    x, y = random.uniform(80, 900), random.uniform(420, 740)
    r = random.uniform(5, 9) * K
    d.ellipse([x * K - r, y * K - r * .6, x * K + r, y * K + r * .6], fill=random.choice(ROUGES) + (int(random.uniform(120, 220)),))

im = im.resize((W, H), Image.LANCZOS)
im.save(os.path.join(DST, 'deco-sakura.png'), optimize=True)
print('enso', enso.size, 'sakura', im.size)
