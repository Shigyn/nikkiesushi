# Photos de decor Unsplash pour les plats sans photo (Nicolas, 17/10 : « si t'as
# pas la photo exacte, pas grave, c'est pour decorer »). Choisies une a une sur
# planches, fond sombre de preference. A remplacer par les photos du restaurant.
# Ecrit photos/u-*.webp, complete _source/photos.json et _source/photos-deco.mjs.
# Usage : python _source/photos_unsplash.py
import os, json, urllib.request
from io import BytesIO
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

ICI = os.path.dirname(os.path.abspath(__file__))
DST = os.path.join(ICI, '..', 'photos')

# plat -> photo Unsplash (identifiant images.unsplash.com/photo-<...>)
PLATS = {
    'premium-salmon-box': '1788016634163-77b7c547b9d4', 'nikkie-maki': '1709984110217-57d7d18e5299',
    'sushi-mix': '1563612116625-3012372fccce', 'nikkie-california-maki': '1774635800472-41eaa93c1453',
    'oignon-dream': '1582450871972-ab5ca641643d', 'veggie-box': '1648146298829-9d49087ea728',
    'nikkie-salmon': '1553621042-f6e147245754', 'rock-and-roll': '1611143669185-af224c5e3252',
    'duo-box': '1763647756796-af9230245bf8',
    'midi-chirashi-tartare': '1565967531713-45739e0cad63', 'midi-poke-saumon': '1597958792579-bd3517df6399',
    'midi-classic': '1579584425555-c3ce17fd4351', 'midi-salmon': '1787589481636-a69533c81edb',
    'samba-exotic': '1631655376078-b6319604bd17', 'spicy-dragon-tempura': '1761314026068-f07ec1ce6e2b',
    'samba-rocoto': '1787589481636-a69533c81edb', 'samba-takuan': '1730900737657-66c48d35ed3a',
    'sushi-thon-nikkei': '1654238117310-3771f78c6d6b', 'sushi-daurade-nikkei': '1675870793092-7c85b6bec0ba',
    'sushi-saumon': '1562158074-d49fbeffcc91', 'sushi-thon': '1772285283419-b34f42b4a4df',
    'sushi-daurade': '1641932982747-bd7be260a040',
    'tacos-saumon': '1660180750968-4fbc84789a96', 'tacos-thon': '1627564803215-ad55bad5c5ea', 'tacos-daurade': '1612783322327-32aee68ad0a1',
    'ceviche-saumon': '1761314036709-f6f68a3d7cf1', 'ceviche-thon': '1769830644804-0ede2ee32a62', 'ceviche-daurade': '1535399831218-d5bd36d1a6b3',
    'poke-saumon': '1602881917445-0b1ba001addf', 'poke-poulet': '1602881916963-5daf2d97c06e', 'poke-veggie': '1600335895229-6e75511892c8',
    'poke-thon-truffe': '1623428187969-5da2dcea5ebf', 'poke-tataki-saumon': '1604259597308-5321e8e4789c', 'poke-daurade': '1556040220-4096d522378d',
    'poke-crevette': '1597958792579-bd3517df6399', 'poke-leche-de-tigre': '1604259596863-57153177d40b',
    'sashimi-saumon': '1675870791718-a12568cfef43', 'sashimi-thon': '1676037150294-837ff0c29599', 'sashimi-daurade': '1534256958597-7fe685cbd745',
    'tataki-saumon': '1638866381709-071747b518c8', 'tataki-thon': '1772285283419-b34f42b4a4df',
    'chirashi-tartare': '1781976250672-87b5f123c031', 'chirashi-saumon': '1775889184873-9d74b093e791',
    'chirashi-thon': '1529065973568-41540b11f7de', 'chirashi-mix': '1785735364431-2147763061cd',
    'donburi-chicken-balls': '1789977968137-67d77ef9b439', 'donburi-chicken-grilled': '1682566509568-ded8649b26bb', 'donburi-salmon': '1740982947324-e4cf44b0e6ff',
    'yakisoba-poulet': '1674516585624-422828b423f1', 'yakisoba-saumon': '1624904025321-24e2f17d06ce',
    'maki-avocat-cheese': '1648146298796-2d4ab2f380d2', 'maki-saumon': '1617196034738-26c5f7c977ce', 'maki-thon-spicy': '1730900737644-e146f78db8e7',
    'cheesy-fondant': '1648146299220-dda12a7c315d', 'tataki-cheesy-fondant': '1728691190534-e1e8c564014e',
    'california-saumon-avocat': '1585144570564-9629fa5ab791', 'california-thon-cuit': '1648146298829-9d49087ea728',
    'california-chicken': '1582450871972-ab5ca641643d', 'california-crevette': '1730049952532-54cf58af3235',
    'spring-saumon-avocat': '1618406854423-ef169758d6a6', 'spring-veggie': '1594020292985-216a72a2c7ce',
    'guacamole': '1600728256404-aaa448921ad9', 'gyoza-poulet': '1738681336104-608b4e7dc3b0', 'gyoza-veggie': '1588182728399-e8f2df121744',
    'chicken-barbecue': '1783788357923-649e29b7b006', 'chicken-balls': '1727281970324-4bda7bab3073', 'edamame': '1557621956-ce58555aa0ce',
    'soupe-miso': '1763470260582-894ae15f43bb', 'soupe-miso-saumon': '1680137248903-7af5d51a3350',
    'salade-chou': '1537784969314-05a37106f68e', 'salade-chou-crevettes': '1573403707491-38a4ea19edc1', 'salade-wakame': '1690789627117-eb8d3b6a46f4',
    'riz-nature': '1516684732162-798a0062be99', 'riz-vinaigre': '1644131447497-8723db691320',
    'mochi-mangue': '1662499866816-4a0985da9f0b', 'mochi-vanille': '1706350091276-ba994c35cd99', 'mochi-matcha': '1629984164142-21c2039de926',
    'cheesecake': '1524351199678-941a58a3df50', 'coupe-fruits-exotiques': '1787980342670-5efa8eadf225',
    'coupe-mangue': '1631153609867-daf57f90cd42', 'coupe-ananas': '1614963366795-973eb8748ebb',
    'jus-passion': '1583577612013-4fecf7bf8f13', 'jus-litchi': '1650292390827-51240d74eb0a', 'jus-coco': '1589990203735-f02f3bb1118d',
    'coca': '1581098365948-6a5a912b7a49', 'ice-tea': '1769737184213-af66b3637edb', 'orangina': '1689066117649-0ca9762fc92c',
    'san-pellegrino': '1616118134296-63970235de49', 'biere-asahi': '1624819592966-0b5ce5dfd1a9', 'biere-kirin': '1552853041-59e6f459f83b',
    'vin-verre': '1547595628-c61a29f496f0', 'the-vert': '1622480916113-9000ac49b79d',
    'cafe-expresso': '1559496417-e7f25cb247f3', 'cafe-allonge': '1512568400610-62da28bc8a13',
}

def nom(pid): return 'u-' + pid.split('-')[1][:10]
def faire(pid):
    n = nom(pid)
    if os.path.exists(os.path.join(DST, n + '-1600.webp')): return n
    data = urllib.request.urlopen('https://images.unsplash.com/photo-' + pid + '?w=800&h=800&fit=crop&crop=entropy&q=85&fm=jpg').read()
    im = Image.open(BytesIO(data)).convert('RGB')
    im.save(os.path.join(DST, n + '-1600.webp'), 'WEBP', quality=80, method=6)
    im.resize((480, 480), Image.LANCZOS).save(os.path.join(DST, n + '-800.webp'), 'WEBP', quality=78, method=6)
    return n

uniques = sorted(set(PLATS.values()))
with ThreadPoolExecutor(10) as ex: list(ex.map(faire, uniques))
pj = os.path.join(ICI, 'photos.json'); P = json.load(open(pj, encoding='utf-8'))
for pid in uniques: P[nom(pid)] = {'l': 800, 'h': 800, 'unsplash': pid}
json.dump(P, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(os.path.join(ICI, 'photos-deco.mjs'), 'w', encoding='utf-8') as f:
    f.write('// Genere par photos_unsplash.py : photo de decor (Unsplash) des plats sans photo du restaurant.\n')
    f.write('export const PHOTOS_DECO = ' + json.dumps({k: nom(v) for k, v in PLATS.items()}, indent=1) + ';\n')
print(len(PLATS), 'plats,', len(uniques), 'photos')
