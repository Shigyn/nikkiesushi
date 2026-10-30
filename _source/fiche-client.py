# Nikkie Sushi — la fiche remise au restaurant le 29/10 (LocWeb).
#   python -I _source/fiche-client.py
# Page 1 : les acces (espace pro + code, appli d'impression, compte de
# paiement Stripe). Page 2 : l'abonnement et ses conditions, avec la
# signature « Bon pour accord ». Le code est lu dans CODE-ESPACE-PRO.md
# (jamais publie) ; le PDF part dans le dossier Organisation, pas sur le site.
import base64, io, json, os, re, subprocess, sys, urllib.request
import qrcode

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPACE = 'https://www.nikkiesushi.com/espace/'
APPLI = 'https://github.com/Shigyn/nikkiesushiprint/releases/latest/download/nikkiesushi-cuisine.apk'
FN = 'https://ibqawtgnucakzdldnitj.supabase.co/functions/v1/ns-espace'
SORTIE = os.path.expanduser(r'~\Desktop\Organisation\1. Clients\En cours\Nikkie Sushi\Nikkie Sushi - accès et abonnement (CONFIDENTIEL).pdf')

code = re.search(r'`(\d{8})`', open(os.path.join(ICI, 'CODE-ESPACE-PRO.md'), encoding='utf-8').read()).group(1)

def appel(corps):
    r = urllib.request.Request(FN, data=json.dumps(corps).encode(), headers={'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=30))

# Le lien fixe d'inscription Stripe (le meme que dans l'espace pro, onglet Paiement en ligne).
jeton = appel({'action': 'connexion', 'code': code})['jeton']
INSCRIPTION = appel({'action': 'ventes', 'jeton': jeton})['inscription']

def qr(url):
    im = qrcode.make(url, box_size=8, border=1); b = io.BytesIO(); im.save(b, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

sig = base64.b64encode(open(os.path.join(ICI, '..', 'devis', '2026-09-initium3', 'signature.png'), 'rb').read()).decode()

def bloc(titre, url, texte):
    return f'<div class="lien"><img src="{qr(url)}" alt=""><div><b>{titre}</b><br><a href="{url}">{url}</a><p>{texte}</p></div></div>'

html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Nikkie Sushi — accès et abonnement</title><style>
@page {{ size: A4; margin: 14mm; }}
body {{ font: 10.3pt/1.45 'Segoe UI', Arial, sans-serif; color: #1d1d1f; margin: 0; }}
h1 {{ font-size: 19pt; margin: 0 0 1mm; }} h2 {{ font-size: 12.5pt; margin: 6mm 0 2mm; }}
.sous {{ color: #6e6e73; margin: 0 0 4mm; }}
.alerte {{ background: #fdecea; border: 1px solid #f2b8b5; border-radius: 3mm; padding: 2.5mm 4mm; margin: 3mm 0; }}
.code {{ font: 700 22pt/1 Consolas, monospace; letter-spacing: .14em; }}
.lien {{ display: flex; gap: 5mm; align-items: center; border: 1.5px solid #1d1d1f; border-radius: 3mm; padding: 3mm 4mm; margin: 3mm 0; }}
.lien img {{ width: 25mm; height: 25mm; }} .lien b {{ font-size: 12pt; }} .lien a {{ color: #2457c5; word-break: break-all; font-size: 9pt; }} .lien p {{ margin: 1.5mm 0 0; }}
ol {{ margin: 1mm 0 0; padding-left: 5mm; }} li {{ margin: 1mm 0; }}
table {{ width: 100%; border-collapse: collapse; }} td {{ border-bottom: 1px solid #e3e3e8; padding: 2.4mm 2mm; vertical-align: top; }}
td.prix {{ text-align: right; white-space: nowrap; font-weight: 700; }}
td small {{ display: block; color: #6e6e73; }}
.parties {{ display: flex; gap: 8mm; margin: 2mm 0 4mm; }} .parties div {{ flex: 1; font-size: 9.5pt; }} .parties small {{ display: block; text-transform: uppercase; letter-spacing: .08em; color: #6e6e73; font-size: 8pt; }}
.signatures {{ display: flex; gap: 10mm; margin-top: 6mm; }} .signatures div {{ flex: 1; border: 1px solid #c7c7cc; border-radius: 2mm; padding: 3mm; min-height: 30mm; font-size: 9.5pt; }}
.signatures img {{ height: 16mm; }}
.saut {{ page-break-before: always; }}
.pied {{ margin-top: 6mm; color: #6e6e73; font-size: 8pt; }}
</style></head><body>
<h1>Nikkie Sushi — vos accès</h1>
<p class="sous">Préparé par LocWeb le 29 octobre 2026. Document confidentiel : ne le partagez qu’avec l’équipe du restaurant.</p>

<h2>1. L’espace pro (commandes, plats épuisés, ventes, réglages)</h2>
{bloc('Espace pro', ESPACE, 'Sur la tablette et sur le téléphone de la cuisine. Ajoutez la page à l’écran d’accueil pour l’ouvrir comme une appli.')}
<p>Votre code personnel : <span class="code">{code[:4]} {code[4:]}</span></p>
<p class="alerte">Ce code donne accès aux commandes et aux coordonnées de vos clients. Ne le donnez qu’à votre équipe. En cas de doute, LocWeb le change en quelques minutes.</p>

<h2>2. L’appli d’impression des tickets (téléphone Android de la cuisine)</h2>
{bloc('Appli Nikkie Sushi cuisine', APPLI, 'Elle imprime chaque commande sur l’imprimante à tickets et sonne quand une commande arrive. Code : le même que l’espace pro.')}

<h2>3. Recevoir les paiements par carte du site</h2>
{bloc('Ouvrir le compte de paiement du restaurant', INSCRIPTION, 'Chez Stripe, le service qui encaisse les cartes. À préparer : le SIREN de la société, son RIB et la pièce d’identité du président. Environ 10 minutes, et vous pouvez reprendre plus tard avec ce même lien.')}
<p>Dès que Stripe a validé le compte, le paiement par carte s’ouvre tout seul sur le site. L’argent arrive directement sur le compte bancaire du restaurant : le premier versement sous 7 jours environ, puis en 2 à 3 jours ouvrés.</p>

<div class="saut"></div>
<h1>Votre abonnement LocWeb</h1>
<div class="parties">
  <div><small>Prestataire</small><b>Nicolas Masia</b> — entrepreneur individuel<br>Nom commercial : LocWeb<br>24 rue Diderot, 34500 Béziers<br>SIRET 909 584 138 00020 · locweb.fr</div>
  <div><small>Client</small><b>SAS NIKKIE SUSHI</b><br>1 bis rue Porte Olivier, place de la Madeleine<br>34500 Béziers<br>SIRET 995 338 555 00023</div>
</div>
<table>
  <tr><td><b>Mise en place</b><small>Site www.nikkiesushi.com, carte complète, commande en ligne (livraison et à emporter), espace pro, appli d’impression, nom de domaine branché.</small></td><td class="prix">90 €<br><small>une fois</small></td></tr>
  <tr><td><b>Abonnement mensuel</b><small>Hébergement, nom de domaine, espace pro, appli d’impression, mises à jour de la carte et du site, sauvegardes et support par WhatsApp.</small></td><td class="prix">70 € / mois</td></tr>
  <tr><td><b>Frais de paiement en ligne</b><small>1 % des paiements par carte faits sur le site, prélevé automatiquement au moment du paiement et rendu en cas de remboursement. Les frais de Stripe sont à la charge du restaurant, sur son propre compte. Aucun frais sur les commandes payées sur place.</small></td><td class="prix">1 %</td></tr>
</table>
<p style="margin-top:3mm">TVA non applicable, article 293 B du CGI. Paiement de la mise en place et de l’abonnement par lien sécurisé Stripe, prélevé chaque mois automatiquement. Abonnement sans engagement : il s’arrête à la fin du mois en cours sur simple demande, le site est alors mis hors ligne.</p>

<h2>Ce qui reste à la charge du restaurant</h2>
<ol>
  <li><b>La caisse :</b> le restaurant saisit l’ensemble des paiements reçus sur place dans son système de caisse certifié. L’espace de commande LocWeb est un outil de prise de commande, pas un logiciel de caisse.</li>
  <li><b>Le médiateur de la consommation</b> (obligatoire pour vendre en ligne) : adhésion par le restaurant, par exemple chez CM2C (cm2c.net). LocWeb ajoute ses coordonnées aux conditions de vente du site dès réception.</li>
  <li><b>Le compte de paiement Stripe</b> du restaurant (point 3 de la page 1) et l’exactitude de la carte et des prix affichés.</li>
</ol>

<div class="signatures">
  <div><b>LocWeb</b> — Nicolas Masia<br>Le 29 octobre 2026<br><img src="data:image/png;base64,{sig}" alt="Signature"></div>
  <div><b>SAS NIKKIE SUSHI</b> — nom et signature, précédés de « Bon pour accord »<br>Le ____ / ____ / 2026</div>
</div>
<p class="pied">Nicolas Masia, entrepreneur individuel — LocWeb — 24 rue Diderot, 34500 Béziers — SIRET 909 584 138 00020 — TVA non applicable, art. 293 B du CGI</p>
</body></html>'''

src = os.path.join(os.environ.get('TEMP', ICI), 'fiche-nikkie.html')
open(src, 'w', encoding='utf-8').write(html)
os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
subprocess.run([r'C:\Program Files\Google\Chrome\Application\chrome.exe', '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                '--print-to-pdf=' + SORTIE, 'file:///' + src.replace('\\', '/')], check=True, capture_output=True)
os.remove(src)
print('PDF :', SORTIE)
