# Prepare les photos du site Nikkie Sushi (LocWeb, 2026-10-14).
#   Toutes viennent de leur Instagram @nikkie_sushi (decision de Nicolas :
#   leurs photos plutot qu'Unsplash, elles sont meilleures) et le logo de
#   leur site Wix. A remplacer par leurs fichiers HD a la livraison.
# Usage : python _source/photos.py <dossier source>
import os, sys, json
from PIL import Image, ImageOps

SRC = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__))
DST = os.path.join(ICI, '..', 'photos')
os.makedirs(DST, exist_ok=True)

PHOTOS = {
    'p-nikkie-box.jpg': 'nikki-box-terrasse-madeleine',
    'p-veggie.jpg': 'california-veggie-eglise-madeleine',
    'p-sushi-nikkei.jpg': 'sushi-nikkei-saumon-thon-daurade',
    'p-truffe.jpg': 'nikkie-truffe',
    'p-truffe-2.jpg': 'nikkie-truffe-ardoise',
    'p-samba-tuna.jpg': 'samba-tuna-peruano',
    'p-sashimi.jpg': 'assortiment-sashimi',
    'p-nikkie-pink.jpg': 'nikkie-pink',
    'p-rires.jpg': 'terrasse-nikkie-sushi-beziers',
}

dims = {}
for src, nom in PHOTOS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, src))).convert('RGB')
    for larg in (1600, 800):
        c = im if im.width <= larg else im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
        c.save(os.path.join(DST, f'{nom}-{larg}.webp'), 'WEBP', quality=76, method=6)
    big = Image.open(os.path.join(DST, f'{nom}-1600.webp'))
    dims[nom] = {'l': big.width, 'h': big.height}
    print(f'{nom:38s} {im.width}x{im.height}')

# Image de partage (1200x630) : la terrasse au coucher du soleil, eglise comprise.
im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, 'p-veggie.jpg'))).convert('RGB')
l = im.width; h = round(l * 630 / 1200); y = round(im.height * 0.42 - h / 2)
im.crop((0, max(0, y), l, max(0, y) + h)).resize((1200, 630), Image.LANCZOS).save(os.path.join(DST, 'partage.jpg'), quality=82)

# Le logo : PNG transparent du site Wix, recadre au plus juste.
logo = Image.open(os.path.join(SRC, 'logo-wix.png')).convert('RGBA')
logo = logo.crop(logo.getbbox())
cercle = logo.copy(); cercle.thumbnail((520, 520)); cercle.save(os.path.join(DST, 'logo-nikkie-sushi.png'), optimize=True)
# Le mot seul (sans le cercle au pinceau) pour l'en-tete : centre du logo.
w, h = logo.size
mot = logo.crop((int(w * 0.17), int(h * 0.27), int(w * 0.85), int(h * 0.665)))
mot = mot.crop(mot.getbbox()); mot.thumbnail((420, 200)); mot.save(os.path.join(DST, 'logo-mot.png'), optimize=True)
ico = logo.copy(); ico.thumbnail((192, 192))
fond = Image.new('RGBA', (192, 192), (13, 11, 10, 255)); fond.alpha_composite(ico, ((192 - ico.width) // 2, (192 - ico.height) // 2))
fond.save(os.path.join(DST, 'icone-192.png')); fond.resize((180, 180)).save(os.path.join(DST, 'apple-touch-icon.png'))
fond.resize((32, 32), Image.LANCZOS).save(os.path.join(DST, 'favicon-32.png'))
json.dump(dims, open(os.path.join(ICI, 'photos.json'), 'w'), indent=0)
print('logo', logo.size, '-> mot', mot.size)
