// ===================================================================
//  Nikkie Sushi — generateur du site (LocWeb, 2026-10-14)
//     node build.mjs          -> apercu (noindex, shigyn.github.io)
//     PROD=1 node build.mjs   -> mise en ligne (nikkiesushi.com)
//  Pages : accueil, carte, livraison, restaurant, mentions, CGV,
//  confidentialite. La commande (panier, livraison ou retrait, creneau,
//  paiement) vit dans assets/commande.js, sur le modele de KSM.
//  Liens relatifs : le site marche sous github.io comme sur son domaine.
// ===================================================================
import fs from 'node:fs';
import path from 'node:path';
import { ENTREPRISE as E, HORAIRES, HORAIRES_TEXTE, HORAIRES_SCHEMA, COMMANDE, AVIS, FAQ, FAQ_LIVRAISON } from './_source/contenu.mjs';
import { CARTE, VEDETTES } from './_source/carte.mjs';
import { PHOTOS_DECO } from './_source/photos-deco.mjs';

const ICI = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const PROD = process.env.PROD === '1';
const URL_SITE = PROD ? 'https://www.nikkiesushi.com/' : 'https://shigyn.github.io/nikkiesushi/';
const PHOTOS = JSON.parse(fs.readFileSync(path.join(ICI, '_source', 'photos.json'), 'utf8'));
const V = '29';
// Paiement Stripe des que la cle publique est donnee (meme schema qu'Anas Grill).
// Sans cle, le site repasse en apercu et plus rien n'arrive en cuisine : en apercu,
// on prend toute seule la cle TEST du projet (meme garde-fou qu'Anas Grill, 22/10).
const PK_TEST = path.join(ICI, '..', 'projet-8-snacks', 'STRIPE-PK-TEST.txt');
const STRIPE_PK = (process.env.STRIPE_PK || (!PROD && fs.existsSync(PK_TEST) ? fs.readFileSync(PK_TEST, 'utf8') : '')).trim();
COMMANDE.apercuToujoursOuvert = !PROD;
if (STRIPE_PK) { COMMANDE.paiement = 'stripe'; COMMANDE.stripePk = STRIPE_PK; }
// Mise en ligne sans cle Stripe LIVE (27/10, en attendant le compte Stripe du restaurant) :
// commande en ligne, reglee sur place (especes ou carte, au comptoir ou au livreur).
if (PROD && COMMANDE.paiement === 'apercu') COMMANDE.paiement = 'sur_place';
const EN_LIGNE = COMMANDE.paiement === 'stripe';
if (!EN_LIGNE) {
  const SUR_PLACE = 'Sur place : en espèces ou par carte bancaire, au comptoir en récupérant votre commande ou au livreur. Votre commande part en cuisine dès que vous la validez.';
  for (const f of [...FAQ, ...FAQ_LIVRAISON]) if (/^Comment payer/.test(f.q)) f.a = SUR_PLACE;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (ch) => URL_SITE + ch;
const prix = (p) => (Number.isInteger(p) ? `${p}` : p.toFixed(2).replace('.', ',')) + '&nbsp;€';
// Le nom de chaque categorie en japonais, en grand contour or face au titre (Nicolas, 17/10 : « la carte fait vide »).
const KANJI = { plateaux: '盛合せ', box: '箱', midi: '昼', 'nikkei-rolls': '巻', 'sushi-tacos': '寿司', ceviche: '魚', poke: '丼', sashimi: '刺身', 'tataki-chirashi': '炙り', 'donburi-nouilles': '麺', 'maki-rolls': '巻物', entrees: '前菜', desserts: '甘味', boissons: '飲物' };
const TOUS = CARTE.flatMap((c) => c.items.map((i) => ({ ...i, cat: c.id })));
const plat = (id) => { const x = TOUS.find((i) => i.id === id); if (!x) throw new Error('plat inconnu : ' + id); return x; };

function img(r, nom, alt, { eager = false, sizes = '(min-width: 900px) 50vw, 100vw', cls = '' } = {}) {
  const p = PHOTOS[nom];
  if (!p) throw new Error('photo inconnue : ' + nom);
  return `<img${cls ? ` class="${cls}"` : ''} src="${r}photos/${nom}-800.webp" srcset="${r}photos/${nom}-800.webp 800w, ${r}photos/${nom}-1600.webp ${p.l}w" sizes="${sizes}" alt="${esc(alt)}" width="${p.l}" height="${p.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const I = {
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>',
  sac: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 14H5L4 7zm2 0h6V6a3 3 0 0 0-6 0z"/></svg>',
  scooter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h3l2.6 7.2A4 4 0 1 1 15 15H9.9A4 4 0 1 1 6 11h6.4l-1.2-3H8V6h4.6l1.2 3H15l-1-3h-1V4zM6 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>',
  table: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18v3h-2v10h-2v-6H7v6H5V10H3zm4 5h10v-2H7z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>',
  fleche: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3z"/></svg>',
  etoile: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.5l-6.4 3.7 1.6-7.1L1.8 9.3 9 8.6z"/></svg>',
  insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
};

/* ---------------- donnees structurees ---------------- */
const ENTITE = {
  '@type': 'Restaurant',
  '@id': URL_SITE + '#restaurant',
  name: E.nom,
  alternateName: 'Nikkie Sushi Béziers',
  description: 'Restaurant de cuisine nikkei (fusion japonaise et péruvienne) place de la Madeleine à Béziers : sushis, ceviches, tacos nikkei, poke bowls. Sur place, à emporter et en livraison.',
  url: URL_SITE,
  logo: URL_SITE + 'photos/logo-nikkie-sushi.png',
  image: [URL_SITE + 'photos/partage.jpg', URL_SITE + 'photos/nikki-box-terrasse-madeleine-1600.webp'],
  telephone: E.tel,
  email: E.email,
  priceRange: '20–30 €',
  servesCuisine: ['Japonaise', 'Péruvienne', 'Nikkei', 'Sushi'],
  acceptsReservations: 'Oui, par téléphone',
  hasMenu: abs('carte/'),
  address: { '@type': 'PostalAddress', streetAddress: E.rue, addressLocality: E.ville, postalCode: E.codePostal, addressRegion: 'Occitanie', addressCountry: 'FR' },
  geo: { '@type': 'GeoCoordinates', latitude: E.geo.lat, longitude: E.geo.lng },
  hasMap: E.maps,
  openingHoursSpecification: HORAIRES_SCHEMA.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.jours, opens: h.de, closes: h.a })),
  sameAs: [E.instagram, E.facebook, E.tiktok],
  potentialAction: { '@type': 'OrderAction', target: abs('carte/'), deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModePickUp', 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet'] },
};
const fil = (etapes) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Accueil', ''], ...etapes].map(([n, ch], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(ch) })),
});
const faqSchema = (l) => ({ '@type': 'FAQPage', mainEntity: l.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
const menuSchema = () => ({
  '@type': 'Menu',
  '@id': abs('carte/') + '#menu',
  name: 'La carte de Nikkie Sushi',
  inLanguage: 'fr',
  hasMenuSection: CARTE.map((c) => ({
    '@type': 'MenuSection', name: c.nom,
    hasMenuItem: c.items.map((i) => ({
      '@type': 'MenuItem', name: i.n, ...(i.d ? { description: i.d } : {}),
      offers: { '@type': 'Offer', price: i.p.toFixed(2), priceCurrency: 'EUR' },
      ...(i.vg ? { suitableForDiet: 'https://schema.org/VegetarianDiet' } : {}),
    })),
  })),
});

/* ---------------- gabarit commun ---------------- */
const NAV = [['carte/', 'La carte'], ['livraison-sushi-beziers/', 'Livraison'], ['restaurant/', 'Le restaurant']];

function page(chemin, { titre, description, corps, schemas = [], ariane = null, image = null, classe = '' }) {
  const r = '../'.repeat(chemin.split('/').filter(Boolean).length);
  const accueil = r || './';
  const titreComplet = chemin === '' || titre.length > 44 ? titre : `${titre} | Nikkie Sushi Béziers`;
  const actif = (ch) => (chemin === ch ? ' aria-current="page"' : '');
  const og = image ? `${URL_SITE}photos/${image}-1600.webp` : `${URL_SITE}photos/partage.jpg`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>document.documentElement.classList.add('js')</script>
<title>${esc(titreComplet)}</title>
<meta name="description" content="${esc(description)}">
${PROD ? '' : '<meta name="robots" content="noindex,nofollow">\n'}<link rel="canonical" href="${abs(chemin)}">
<meta property="og:type" content="restaurant.restaurant">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Nikkie Sushi">
<meta property="og:title" content="${esc(titreComplet)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d0b0a">
<link rel="icon" href="${r}photos/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${r}photos/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r}assets/style.css?v=${V}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [ENTITE, ...schemas] })}</script>
</head>
<body class="${classe}">
<a class="evitement" href="#contenu">Aller au contenu</a>

<header class="entete" data-entete>
  <div class="entete-in">
    <a class="marque" href="${accueil}" aria-label="Nikkie Sushi, accueil"><img src="${r}photos/logo-mot.png" alt="Nikkie Sushi" width="352" height="200"></a>
    <nav class="nav" aria-label="Navigation principale">
      ${NAV.map(([ch, t]) => `<a href="${r}${ch}"${actif(ch)}>${t}</a>`).join('\n      ')}
      <a href="${r}#infos">Horaires &amp; accès</a>
    </nav>
    <a class="entete-tel" href="tel:${E.telLien}">${I.tel}<span>${E.tel}</span></a>
    <a class="bouton bouton-or entete-cta" href="${r}carte/">${I.sac} Commander</a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="menu-mobile" aria-label="Ouvrir le menu"><span></span><span></span></button>
  </div>
  <div class="menu-mobile" id="menu-mobile" hidden>
    <a href="${accueil}">Accueil</a>
    ${NAV.map(([ch, t]) => `<a href="${r}${ch}">${t}</a>`).join('\n    ')}
    <a href="${r}#infos">Horaires &amp; accès</a>
    <a class="bouton bouton-or" href="${r}carte/">${I.sac} Commander en ligne</a>
    <a class="bouton bouton-ligne" href="tel:${E.telLien}">${I.tel} ${E.tel}</a>
  </div>
</header>

<main id="contenu">
${ariane ? `<nav class="ariane" aria-label="Fil d’Ariane"><div class="cadre"><a href="${accueil}">Accueil</a>${ariane.map(([n, ch], i) => (i === ariane.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${r}${ch}">${esc(n)}</a>`)).join('')}</div></nav>` : ''}
${corps(r)}
</main>

<footer class="pied">
  <div class="cadre pied-haut">
    <div class="pied-marque">
      <img src="${r}photos/logo-nikkie-sushi.png" alt="Nikkie Sushi" width="520" height="515" loading="lazy">
      <p>${esc(E.slogan)}. Sushis, ceviches et tacos nikkei, place de la Madeleine à Béziers.</p>
    </div>
    <div>
      <h2 class="pied-titre">Nous trouver</h2>
      <p>${E.rue}<br>${E.lieu}<br>${E.codePostal} ${E.ville}</p>
      <p><a href="${E.maps}" target="_blank" rel="noopener">Itinéraire</a></p>
    </div>
    <div>
      <h2 class="pied-titre">Horaires</h2>
      <p>Midi : 12h – 14h30<br>Soir : 18h45 – 22h<br>Fermé le mercredi</p>
    </div>
    <div>
      <h2 class="pied-titre">Contact</h2>
      <p><a href="tel:${E.telLien}">${E.tel}</a><br><a href="mailto:${E.email}">${E.email}</a></p>
      <p class="pied-reseaux"><a href="${E.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${I.insta}</a></p>
    </div>
  </div>
  <div class="cadre pied-bas">
    <span>© ${new Date().getFullYear()} ${E.raison}</span>
    <span><a href="${r}mentions-legales/">Mentions légales</a> · <a href="${r}cgv/">Conditions de vente</a> · <a href="${r}confidentialite/">Confidentialité</a>${PROD ? ' · Site réalisé par <a href="https://locweb.fr" target="_blank" rel="noopener">LocWeb</a>' : ''}</span>
  </div>
</footer>

<nav class="barre-mobile" aria-label="Actions rapides" data-barre>
  <a href="tel:${E.telLien}">${I.tel}<span>Appeler</span></a>
  <a href="${r}carte/" class="barre-commander">${I.sac}<span>Commander</span></a>
</nav>
<button class="barre-panier" type="button" data-ouvrir-panier hidden><span class="barre-panier-n" data-panier-n>0</span><span>Voir ma commande</span><b data-panier-total>0 €</b></button>

<div class="panier-voile" data-panier-voile hidden></div>
<aside class="panier" id="panier" aria-label="Votre commande" aria-hidden="true" data-panier>
  <div class="panier-tete">
    <button type="button" class="panier-retour" data-panier-retour aria-label="Étape précédente" hidden>${I.fleche}</button>
    <h2 data-panier-titre>Votre commande</h2>
    <button type="button" class="panier-fermer" data-fermer-panier aria-label="Fermer">×</button>
  </div>
  <div class="panier-etat" data-panier-etat hidden></div>
  <div class="panier-corps" data-panier-corps></div>
  <div class="panier-pied" data-panier-pied></div>
</aside>
<div class="choix-voile" data-choix hidden></div>
<p class="toast" role="status" aria-live="polite" data-toast></p>

<script>
  window.LOCWEB_CONFIG = {
    supabaseUrl: 'https://ibqawtgnucakzdldnitj.supabase.co',
    supabaseAnonKey: 'sb_publishable_rpLrUo4Cqnfl8zSohDqO0A_Q5Vkj2Hk',
    clientId: '',
    ga4Id: ''
  };
  window.NIKKIE = ${JSON.stringify({ racine: r, horaires: HORAIRES, ...COMMANDE })};
</script>
<script src="${r}mesure.js" defer></script>
<script src="${r}assets/site.js?v=${V}" defer></script>
<script src="${r}assets/commande.js?v=${V}" defer></script>
</body>
</html>
`;
}

/* ---------------- blocs ---------------- */
const badges = (i) => [i.maison ? '<span class="badge badge-maison">Spécialité de la maison</span>' : '', i.sig ? '<span class="badge badge-nikkei">Nikkei</span>' : '', i.vg ? '<span class="badge badge-vg">Végétarien</span>' : '', i.midi ? '<span class="badge badge-midi">Le midi</span>' : ''].join('');
const boutonAjout = (i) => `<button type="button" class="ajouter" data-ajouter="${i.id}" aria-label="Ajouter ${esc(i.n)} à la commande">${I.plus}</button>`;

const carteVedette = (r, id) => {
  const i = plat(id);
  return `
  <article class="vedette reveler">
    <div class="vedette-photo">${img(r, i.photo, `${i.n}, Nikkie Sushi Béziers`, { sizes: '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 90vw' })}</div>
    <div class="vedette-corps">
      <div class="vedette-haut"><h3>${esc(i.n)}</h3>${i.q ? `<span class="portion">${esc(i.q)}</span>` : ''}</div>
      ${i.d ? `<p>${esc(i.d)}</p>` : ''}
      <div class="vedette-bas"><b class="prix">${prix(i.p)}</b>${boutonAjout(i)}</div>
    </div>
  </article>`;
};

/* Chaque plat a son cadre de vignette, photo ou non : la carte reste
   alignee, et les cadres vides se rempliront avec les photos du
   restaurant. En attendant, un pictogramme de la famille du plat. */
const PICTO = {
  bento: 'M3 5h18v14H3zm2 2v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm8 0v4h6v-4z',
  roll: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6zm0 3a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z',
  nigiri: 'M4 14.5C4 12 7.6 10 12 10s8 2 8 4.5V17H4zM5 9c2-2.6 4.4-3.8 7-3.8 2.8 0 5.2 1.2 7 3.8-2.2-1-4.5-1.5-7-1.5S7.2 8 5 9z',
  bol: 'M2 11h20a10 10 0 0 1-6 9.2V21H8v-.8A10 10 0 0 1 2 11zm5-6c1 1 1 2 0 3h-1.5c1-1 1-2 0-3zm4-1c1 1.2 1 2.6 0 4H9.5c1-1.4 1-2.8 0-4zm4 1c1 1 1 2 0 3h-1.5c1-1 1-2 0-3z',
  poisson: 'M3 12c3-4.6 7-6.4 11-5.6 2.4.5 4.2 2 5.4 3.6L22 8v8l-2.6-2C18.2 15.6 16.4 17 14 17.6 10 18.4 6 16.6 3 12zm11.5-1.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z',
  mochi: 'M7 8a5 5 0 0 1 5 5H2a5 5 0 0 1 5-5zm10 0a5 5 0 0 1 5 5H12a5 5 0 0 1 5-5zM2 14h20v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z',
  verre: 'M6 3h12l-1.6 16.2A2 2 0 0 1 14.4 21H9.6a2 2 0 0 1-2-1.8zm2.2 2 .5 5h6.6l.5-5z',
};
const PICTO_CAT = { plateaux: 'bento', box: 'bento', midi: 'bento', 'nikkei-rolls': 'roll', 'maki-rolls': 'roll', 'sushi-tacos': 'nigiri', ceviche: 'bol', poke: 'bol', 'donburi-nouilles': 'bol', entrees: 'bol', sashimi: 'poisson', 'tataki-chirashi': 'poisson', desserts: 'mochi', boissons: 'verre' };
// La photo du restaurant si elle existe, sinon une photo de decor (Unsplash, a remplacer).
const vignette = (r, i) => (i.photo || PHOTOS_DECO[i.id])
  ? `<div class="plat-vignette">${img(r, i.photo || PHOTOS_DECO[i.id], i.n, { sizes: '(max-width: 760px) 92px, 112px' })}</div>`
  : `<div class="plat-vignette vide" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${PICTO[PICTO_CAT[i.cat] || 'bento']}"/></svg></div>`;

const ligneCarte = (r, i) => `
      <li class="plat" id="${i.id}">
        ${vignette(r, i)}
        <div class="plat-texte">
          <h3>${esc(i.n)}${i.q ? ` <span class="portion">${esc(i.q)}</span>` : ''}</h3>
          ${badges(i) ? `<p class="badges">${badges(i)}</p>` : ''}
          ${i.d ? `<p class="plat-desc">${esc(i.d)}</p>` : ''}
          ${i.s ? `<p class="plat-sauce">Sauce ${i.s.map(esc).join(' · ')}</p>` : ''}
          ${i.choix ? `<p class="plat-sauce">Au choix : ${i.choix.map(esc).join(', ')}</p>` : ''}
        </div>
        <div class="plat-prix"><b class="prix">${prix(i.p)}</b>${boutonAjout(i)}</div>
      </li>`;

const faqHtml = (l) => `<div class="faq">${l.map((x, i) => `
  <details class="reveler"${i === 0 ? ' open' : ''}><summary><span>${esc(x.q)}</span><i aria-hidden="true"></i></summary><p>${esc(x.a)}</p></details>`).join('')}</div>`;

const horairesTable = () => `
  <table class="horaires" data-horaires>
    <caption class="sr">Horaires d’ouverture</caption>
    <tbody>${HORAIRES_TEXTE.map(([j, h], k) => `<tr data-jour="${(k + 1) % 7}"><th scope="row">${j}</th><td${h === 'Fermé' ? ' class="ferme"' : ''}>${h}</td></tr>`).join('')}</tbody>
  </table>`;

const etat = () => `<p class="etat" data-etat-ouverture><i></i><span>12h – 14h30 · 18h45 – 22h · fermé le mercredi</span></p>`;

const modes = (r) => `
<div class="modes">
  <a class="mode reveler" href="${r}livraison-sushi-beziers/">${I.scooter}<b>Livraison</b><span>À Béziers, dès ${COMMANDE.livraison.minimum} €. ${EN_LIGNE ? 'Payé en ligne, rien à régler à la porte.' : 'Réglé à la livraison, en espèces ou par carte.'}</span></a>
  <a class="mode reveler" href="${r}carte/">${I.sac}<b>À emporter</b><span>Commandez, choisissez l’heure, passez récupérer : c’est prêt.</span></a>
  <a class="mode reveler" href="${r}restaurant/">${I.table}<b>Sur place</b><span>12 couverts et une terrasse sur la place. Réservation au ${E.tel}.</span></a>
</div>`;

const appel = (r, titre = 'Une envie de sushis ?') => `
<section class="appel">
  <img class="deco deco-sakura-appel" src="${r}photos/deco-sakura.png" alt="" aria-hidden="true" width="1100" height="760" loading="lazy">
  <div class="cadre appel-in reveler">
    <h2>${titre}</h2>
    <p>Commandez en ligne en deux minutes : livré à Béziers ou prêt à emporter, à l’heure que vous choisissez.</p>
    <div class="actions"><a class="bouton bouton-or" href="${r}carte/">${I.sac} Commander en ligne</a><a class="bouton bouton-ligne" href="tel:${E.telLien}">${I.tel} ${E.tel}</a></div>
  </div>
</section>`;

/* Le bandeau des saveurs, sous le hero : les mots de la cuisine nikkei,
   Japon et Perou alternes. Il defile lentement (immobile si le visiteur
   a coupe les animations). Le texte est double pour boucler sans saut. */
const MOTS = ['Sushi', 'Ceviche', 'Tataki', 'Leche de tigre', 'Sashimi', 'Maracuja', 'Maki', 'Rocoto', 'Chirashi', 'Choclo', 'Teriyaki', 'Tacos nikkei'];
const bandeauSaveurs = () => {
  const suite = MOTS.map((m) => `<span>${esc(m)}</span><i aria-hidden="true"></i>`).join('');
  return `
<div class="saveurs" aria-label="Les saveurs de la cuisine nikkei">
  <div class="saveurs-in"><div>${suite}</div><div aria-hidden="true">${suite}</div></div>
</div>`;
};

/* ===================================================================
   PAGES
   =================================================================== */
const PAGES = [];
const ajouter = (ch, o) => PAGES.push([ch, o]);

ajouter('', {
  titre: 'Nikkie Sushi Béziers — Sushi & cuisine nikkei, livraison',
  description: 'Sushis, ceviches et tacos nikkei place de la Madeleine à Béziers. Cuisine japonaise et péruvienne préparée à la minute. Commande en ligne, livraison et à emporter.',
  schemas: [{ '@type': 'WebSite', url: URL_SITE, name: E.nom, inLanguage: 'fr-FR' }, faqSchema(FAQ)],
  classe: 'accueil',
  corps: (r) => `
<section class="hero">
  <img class="deco deco-sakura-hero" src="${r}photos/deco-sakura.png" alt="" aria-hidden="true" width="1100" height="760">
  <div class="cadre hero-in">
    <div class="hero-texte">
      <p class="surtitre hero-anim">${I.pin} Place de la Madeleine · Béziers</p>
      <h1 class="hero-anim">Sushi &amp; cuisine nikkei <span>à Béziers</span></h1>
      <p class="hero-chapo hero-anim">Le Japon rencontre le Pérou. Sushis, ceviches et tacos nikkei préparés à la minute, à déguster sur la place, à emporter ou livrés chez vous.</p>
      <div class="actions hero-anim">
        <a class="bouton bouton-or" href="${r}carte/">${I.sac} Commander en ligne</a>
        <a class="bouton bouton-ligne" href="${r}carte/">Voir la carte</a>
      </div>
      <div class="hero-preuves hero-anim">
        <a class="note" href="${E.maps}" target="_blank" rel="noopener"><span class="etoiles">${I.etoile.repeat(5)}</span><b>${E.note}</b><span>${E.nbAvis} avis Google</span></a>
        ${etat()}
      </div>
    </div>
    <div class="hero-visuel hero-anim">
      <img class="deco deco-enso" src="${r}photos/deco-enso.png" alt="" aria-hidden="true" width="900" height="891">
      <span class="kanji" aria-hidden="true">日系</span>
      <div class="hero-photo">${img(r, 'nikki-box-terrasse-madeleine', 'La Nikki Box servie en terrasse, face à l’église de la Madeleine à Béziers', { eager: true, sizes: '(min-width: 900px) 42vw, 100vw' })}</div>
      <div class="hero-fiche">
        <span class="hero-fiche-eti">À partager</span>
        <b>Nikki Box</b><span>42 pièces · nos créations fusion</span>
        <div><b class="prix">${prix(60)}</b>${boutonAjout(plat('nikki-box'))}</div>
      </div>
    </div>
  </div>
</section>

${bandeauSaveurs()}

<div class="cadre">${modes(r)}</div>

<section class="section">
  <div class="cadre">
    <div class="tete-section tete-ligne reveler">
      <div><p class="surtitre">Les incontournables</p><h2>Par où commencer</h2></div>
      <a class="lien-fleche" href="${r}carte/">Toute la carte ${I.fleche}</a>
    </div>
    <div class="vedettes">${VEDETTES.map((id) => carteVedette(r, id)).join('')}</div>
  </div>
</section>

<section class="section section-encre">
  <div class="cadre histoire">
    <div class="histoire-photos reveler">
      <figure class="histoire-a">${img(r, 'sushi-nikkei-saumon-thon-daurade', 'Sushis nikkei saumon, thon et daurade en terrasse', { sizes: '(min-width: 900px) 30vw, 70vw' })}</figure>
      <figure class="histoire-b">${img(r, 'nikkie-truffe-ardoise', 'Nikkie Truffe dressés sur ardoise', { sizes: '(min-width: 900px) 22vw, 50vw' })}</figure>
    </div>
    <div class="histoire-texte reveler">
      <p class="surtitre">Cuisine nikkei</p>
      <h2>Cuisine japonaise <em>et péruvienne</em></h2>
      <p>À la fin du XIXe siècle, des Japonais partent travailler au Pérou. Loin de chez eux, ils cuisinent avec ce qu’ils trouvent : le piment péruvien remplace le wasabi, le citron vert relève le poisson cru. Les Péruviens les appellent les Nikkei, et leur cuisine devient l’une des plus inventives au monde.</p>
      <p>Rokib et Laura ont ouvert Nikkie Sushi en mai 2026, la première adresse nikkei de Béziers. Lui en cuisine, elle en salle, tous deux formés au lycée hôtelier Jean-Moulin. Le principe : des recettes traditionnelles, une touche personnelle, et tout préparé à la minute.</p>
      <a class="lien-fleche" href="${r}restaurant/">Le restaurant ${I.fleche}</a>
    </div>
  </div>
</section>

<section class="section section-papier">
  <div class="cadre">
    <div class="tete-section reveler"><p class="surtitre">Ils en parlent</p><h2>${E.note} sur 5, ${E.nbAvis} avis Google</h2></div>
    <div class="avis">${AVIS.map((a) => `
      <figure class="avis-carte reveler"><span class="etoiles" aria-label="5 étoiles sur 5">${I.etoile.repeat(5)}</span><blockquote>« ${esc(a.texte)} »</blockquote><figcaption>${esc(a.auteur)} · avis Google</figcaption></figure>`).join('')}
    </div>
    <p class="avis-lien reveler"><a class="lien-fleche" href="${E.maps}" target="_blank" rel="noopener">Lire tous les avis sur Google ${I.fleche}</a></p>
  </div>
</section>

<section class="section section-encre" id="infos">
  <div class="cadre infos">
    <figure class="infos-photo reveler">${img(r, 'terrasse-nikkie-sushi-beziers', 'Terrasse de Nikkie Sushi, place de la Madeleine à Béziers', { sizes: '(min-width: 900px) 40vw, 100vw' })}</figure>
    <div class="infos-texte reveler">
      <p class="surtitre">Horaires &amp; accès</p>
      <h2>Place de la Madeleine</h2>
      ${etat()}
      ${horairesTable()}
      <p class="infos-adresse">${I.pin}<span>${E.rue}, ${E.lieu}<br>${E.codePostal} ${E.ville}</span></p>
      <div class="actions"><a class="bouton bouton-or" href="${E.maps}" target="_blank" rel="noopener">${I.pin} Itinéraire</a><a class="bouton bouton-ligne" href="tel:${E.telLien}">${I.tel} Réserver une table</a></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="cadre etroit">
    <div class="tete-section tete-centree reveler"><p class="surtitre">Questions</p><h2>Bon à savoir</h2></div>
    ${faqHtml(FAQ)}
  </div>
</section>
${appel(r)}`,
});

ajouter('carte/', {
  titre: 'La carte — Sushi, ceviche, poke et tacos nikkei',
  description: `La carte de Nikkie Sushi à Béziers : nikkei rolls, sushi, ceviche, tacos, poke bowls, plateaux et box à partager. Prix, compositions, commande en ligne.`,
  ariane: [['La carte', 'carte/']],
  schemas: [fil([['La carte', 'carte/']]), menuSchema()],
  classe: 'page-carte',
  corps: (r) => `
<section class="tete-page">
  <div class="cadre">
    <h1>La carte</h1>
    <p>${TOUS.length} plats, de la soupe miso à la Nikki Box. Touchez <span class="plus-inline">${I.plus}</span> pour ajouter un plat à votre commande, en livraison ou à emporter.</p>
    ${etat()}
  </div>
</section>
<nav class="onglets" aria-label="Catégories de la carte" data-onglets>
  <div class="onglets-in">${CARTE.map((c) => `<a href="#${c.id}">${esc(c.nom)}</a>`).join('')}</div>
</nav>
<div class="cadre carte">
  ${CARTE.map((c) => `
  <section class="categorie" id="${c.id}" aria-labelledby="t-${c.id}">
    <div class="categorie-tete"${KANJI[c.id] ? ` data-kanji="${KANJI[c.id]}"` : ''}><h2 id="t-${c.id}">${esc(c.nom)}</h2>${c.intro ? `<p>${esc(c.intro)}</p>` : ''}</div>
    <ul class="plats">${c.items.map((i) => ligneCarte(r, { ...i, cat: c.id })).join('')}
    </ul>
  </section>`).join('')}
  <p class="carte-note">Prix TTC. Liste des allergènes disponible au restaurant et par téléphone. L’abus d’alcool est dangereux pour la santé ; vente d’alcool interdite aux mineurs.</p>
</div>`,
});

ajouter('livraison-sushi-beziers/', {
  titre: 'Livraison de sushi à Béziers — Commande en ligne',
  description: 'Livraison de sushis, ceviches et poke bowls à Béziers, midi et soir, dès 20 €. Commandez en ligne, ' + (EN_LIGNE ? 'payez par carte' : 'réglez à la livraison') + ', choisissez votre heure.',
  ariane: [['Livraison à Béziers', 'livraison-sushi-beziers/']],
  schemas: [fil([['Livraison à Béziers', 'livraison-sushi-beziers/']]), faqSchema(FAQ_LIVRAISON)],
  image: 'sushi-nikkei-saumon-thon-daurade',
  corps: (r) => `
<section class="tete-service">
  <div class="cadre tete-service-in">
    <div class="reveler">
      <p class="surtitre">${I.scooter} Livraison · Béziers</p>
      <h1>Livraison de sushi à Béziers</h1>
      <p class="chapo">Nos sushis, ceviches et nikkei rolls, préparés à la minute place de la Madeleine et livrés chez vous. ${EN_LIGNE ? 'Commande et paiement en ligne' : 'Commande en ligne, réglée à la livraison'}, à l’heure que vous choisissez.</p>
      <div class="actions"><a class="bouton bouton-or" href="${r}carte/">${I.sac} Commander maintenant</a><a class="bouton bouton-ligne" href="tel:${E.telLien}">${I.tel} ${E.tel}</a></div>
      ${etat()}
    </div>
    <figure class="tete-service-photo reveler">${img(r, 'sushi-nikkei-saumon-thon-daurade', 'Sushis nikkei livrés à Béziers', { eager: true, sizes: '(min-width: 900px) 40vw, 100vw' })}</figure>
  </div>
</section>

<section class="section">
  <div class="cadre">
    <div class="tete-section tete-centree reveler"><p class="surtitre">Comment ça marche</p><h2>Trois gestes, c’est parti</h2></div>
    <ol class="etapes">
      <li class="reveler"><b>Composez votre commande</b><span>Toute la carte est disponible en livraison, du plateau à la soupe miso.</span></li>
      <li class="reveler"><b>Choisissez l’heure et payez</b><span>Dès 10h, pour ce midi ou ce soir. ${EN_LIGNE ? 'Paiement par carte ou sur place.' : 'Réglez sur place, en espèces ou par carte.'}</span></li>
      <li class="reveler"><b>On prépare, on livre</b><span>Préparé à la minute, livré chez vous. Vous suivez l’avancement depuis votre téléphone.</span></li>
    </ol>
  </div>
</section>

<section class="section section-encre">
  <div class="cadre conditions">
    <div class="condition reveler"><b>${COMMANDE.livraison.minimum} €</b><span>minimum de commande en livraison</span></div>
    <div class="condition reveler"><b>~${COMMANDE.livraison.delaiMin} min</b><span>en moyenne, préparé à la minute</span></div>
    <div class="condition reveler"><b>Midi &amp; soir</b><span>12h – 14h30 · 18h45 – 22h, sauf mercredi. Pas de livraison le lundi ni le dimanche midi</span></div>
    <div class="condition reveler"><b>Béziers</b><span>${COMMANDE.livraison.codesPostaux.join(', ')} — ailleurs, appelez-nous</span></div>
  </div>
</section>

<section class="section">
  <div class="cadre">
    <div class="tete-section tete-ligne reveler">
      <div><p class="surtitre">Nos signatures</p><h2>Pour une première fois</h2></div>
      <a class="lien-fleche" href="${r}carte/">Toute la carte ${I.fleche}</a>
    </div>
    <div class="vedettes">${['nikkie-truffe', 'sashimi-assortiment', 'nikki-box'].map((id) => carteVedette(r, id)).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="cadre etroit">
    <div class="tete-section tete-centree reveler"><h2>Vos questions sur la livraison</h2></div>
    ${faqHtml(FAQ_LIVRAISON)}
  </div>
</section>
${appel(r, 'On vous livre ce soir ?')}`,
});

ajouter('restaurant/', {
  titre: 'Le restaurant — Cuisine nikkei, place de la Madeleine',
  description: 'Nikkie Sushi, le premier restaurant nikkei de Béziers : Rokib en cuisine, Laura en salle, 12 couverts et une terrasse face à l’église de la Madeleine. Réservation par téléphone.',
  ariane: [['Le restaurant', 'restaurant/']],
  schemas: [fil([['Le restaurant', 'restaurant/']])],
  image: 'california-veggie-eglise-madeleine',
  corps: (r) => `
<section class="tete-service">
  <div class="cadre tete-service-in">
    <div class="reveler">
      <p class="surtitre">${I.table} Sur place · Béziers</p>
      <h1>Le restaurant</h1>
      <p class="chapo">Douze couverts, une déco qui garde l’âme du lieu, et une terrasse face à l’église de la Madeleine. Le service à table fait partie de la maison.</p>
      <div class="actions"><a class="bouton bouton-or" href="tel:${E.telLien}">${I.tel} Réserver au ${E.tel}</a><a class="bouton bouton-ligne" href="${r}carte/">Voir la carte</a></div>
    </div>
    <figure class="tete-service-photo reveler">${img(r, 'california-veggie-eglise-madeleine', 'California veggie en terrasse au coucher du soleil, église de la Madeleine', { eager: true, sizes: '(min-width: 900px) 40vw, 100vw' })}</figure>
  </div>
</section>

<section class="section">
  <div class="cadre histoire">
    <div class="histoire-photos reveler">
      <figure class="histoire-a">${img(r, 'terrasse-nikkie-sushi-beziers', 'Clientes en terrasse chez Nikkie Sushi', { sizes: '(min-width: 900px) 30vw, 70vw' })}</figure>
      <figure class="histoire-b">${img(r, 'assortiment-sashimi', 'Assortiment de sashimi saumon, thon et daurade', { sizes: '(min-width: 900px) 22vw, 50vw' })}</figure>
    </div>
    <div class="histoire-texte texte-riche reveler">
      <p class="surtitre">Rokib &amp; Laura</p>
      <h2>Un rêve de longue date, <em>ouvert le 17 mai 2026</em></h2>
      <p>Ils y pensaient depuis des années. Freinés par le Covid, Rokib et Laura ont finalement ouvert leur premier restaurant au printemps 2026, sur la place de la Madeleine. Tous deux sortent du lycée hôtelier Jean-Moulin de Béziers.</p>
      <p>En cuisine, Rokib part des recettes traditionnelles de la gastronomie nikkei et y met sa touche : pâte à gyoza croustillante cuite en tacos, ceviche à la leche de tigre, sushis relevés de maracuja ou de piment rouge.</p>
      <p>En salle, Laura veille au couvert et au service, aussi importants à ses yeux que l’assiette. Un détail : tout est préparé à la minute. Un peu d’attente parfois, mais une fraîcheur que nos clients remarquent.</p>
    </div>
  </div>
</section>

<section class="section section-encre">
  <div class="cadre infos">
    <div class="infos-texte reveler">
      <p class="surtitre">Réserver</p>
      <h2>Par téléphone uniquement</h2>
      <p>La salle est petite et tout est fait à la minute : appelez-nous pour réserver, surtout le vendredi et le samedi soir.</p>
      <div class="actions"><a class="bouton bouton-or" href="tel:${E.telLien}">${I.tel} ${E.tel}</a><a class="bouton bouton-ligne" href="${E.maps}" target="_blank" rel="noopener">${I.pin} Itinéraire</a></div>
    </div>
    <div class="infos-texte reveler">
      ${etat()}
      ${horairesTable()}
      <p class="infos-adresse">${I.pin}<span>${E.rue}, ${E.lieu}<br>${E.codePostal} ${E.ville}</span></p>
    </div>
  </div>
</section>
${appel(r, 'Pas le temps de vous asseoir ?')}`,
});

ajouter('mentions-legales/', {
  titre: 'Mentions légales',
  description: 'Mentions légales du site de Nikkie Sushi, Béziers.',
  ariane: [['Mentions légales', 'mentions-legales/']],
  corps: () => `
<section class="tete-page"><div class="cadre"><h1>Mentions légales</h1></div></section>
<section class="section"><div class="cadre etroit texte-riche">
  <h2>Éditeur du site</h2>
  <p>${E.raison} — SIRET ${E.siret}<br>${E.rue}, ${E.codePostal} ${E.ville}<br>Téléphone : ${E.tel} — ${E.email}</p>
  <p>Directeur de la publication : le président de ${E.raison}.</p>
  <h2>Hébergement</h2><p>GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. Les commandes sont enregistrées chez Supabase, Inc. (serveurs dans l’Union européenne).</p>
  <h2>Crédits</h2><p>Photographies : Nikkie Sushi. Réalisation : LocWeb.</p>
</div></section>`,
});

ajouter('cgv/', {
  titre: 'Conditions générales de vente',
  description: 'Conditions générales de vente des commandes en ligne de Nikkie Sushi : livraison, retrait, paiement, réclamations.',
  ariane: [['Conditions de vente', 'cgv/']],
  corps: () => `
<section class="tete-page"><div class="cadre"><h1>Conditions générales de vente</h1></div></section>
<section class="section"><div class="cadre etroit texte-riche">
  <h2>1. Objet</h2><p>Les présentes conditions régissent les commandes passées sur ce site auprès de ${E.raison}, ${E.rue}, ${E.codePostal} ${E.ville}, SIRET ${E.siret}.</p>
  <h2>2. Commandes</h2><p>Les commandes sont acceptées pendant les horaires d’ouverture, ou à l’avance pour un service à venir. Le restaurant peut refuser une commande en cas d’affluence ou de rupture d’un produit ; le client en est alors informé et, s’il a payé, intégralement remboursé.</p>
  <h2>3. Prix</h2><p>Les prix sont indiqués en euros, toutes taxes comprises. Ceux en vigueur au moment de la commande s’appliquent.</p>
  <h2>4. Paiement</h2><p>${EN_LIGNE ? 'Le paiement s’effectue en ligne par carte bancaire au moment de la commande, sur une page sécurisée opérée par Stripe, ou sur place si le client le choisit. Le restaurant n’a jamais accès aux numéros de carte. Une commande payée en ligne n’est transmise en cuisine qu’une fois le paiement accepté.' : 'Le paiement s’effectue sur place, en espèces ou par carte bancaire : au comptoir lors du retrait, ou au livreur à la livraison. La commande est transmise en cuisine dès sa validation sur le site.'}</p>
  <h2>5. Livraison et retrait</h2><p>La livraison est assurée à Béziers (${COMMANDE.livraison.codesPostaux.join(', ')}) à partir de ${COMMANDE.livraison.minimum} € de commande. Les délais sont indicatifs. Pour un retrait, la commande est à récupérer au restaurant à l’heure choisie.</p>
  <h2>6. Droit de rétractation</h2><p>Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux denrées alimentaires susceptibles de se détériorer rapidement.</p>
  <h2>7. Allergènes</h2><p>La liste des allergènes de chaque plat est disponible au restaurant et par téléphone. Le client signale toute allergie dans le commentaire de sa commande.</p>
  <h2>8. Alcool</h2><p>La vente d’alcool est interdite aux mineurs. Une pièce d’identité peut être demandée à la livraison ou au retrait.</p>
  <h2>9. Réclamations</h2><p>Toute réclamation se fait par téléphone au ${E.tel} ou par e-mail à ${E.email}, de préférence le jour même. En cas de litige, le client peut recourir gratuitement à un médiateur de la consommation, dont les coordonnées lui sont communiquées sur simple demande.</p>
</div></section>`,
});

ajouter('confidentialite/', {
  titre: 'Politique de confidentialité',
  description: 'Comment Nikkie Sushi traite les données transmises lors d’une commande en ligne.',
  ariane: [['Confidentialité', 'confidentialite/']],
  corps: () => `
<section class="tete-page"><div class="cadre"><h1>Politique de confidentialité</h1></div></section>
<section class="section"><div class="cadre etroit texte-riche">
  <h2>Responsable du traitement</h2><p>${E.raison}, ${E.rue}, ${E.codePostal} ${E.ville} — ${E.email}.</p>
  <h2>Les données recueillies</h2><p>Pour une commande : votre nom, votre téléphone, votre adresse de livraison le cas échéant, et votre commentaire. Elles servent uniquement à préparer, livrer et suivre votre commande (exécution de la commande). Elles ne sont ni vendues ni cédées, et ne servent à aucune prospection.</p>
  <h2>Qui y a accès</h2><p>Le restaurant, pour préparer et livrer votre commande. Ses prestataires techniques, uniquement pour faire fonctionner le service : LocWeb (réalisation et maintenance du site), GitHub (hébergement des pages), Supabase (enregistrement des commandes, serveurs dans l’Union européenne)${EN_LIGNE ? ' et Stripe (paiement)' : ''}.</p>
  ${EN_LIGNE ? '<h2>Paiement</h2><p>Les données de carte bancaire sont saisies et traitées par Stripe ; elles ne transitent jamais par le restaurant ni par le site. Stripe dépose les cookies nécessaires à la sécurité du paiement et à la lutte contre la fraude.</p>' : ''}
  <h2>Conservation</h2><p>Vos nom, téléphone et adresse sont conservés au plus 3 ans après votre dernière commande, puis effacés ; le détail des ventes, sans vos coordonnées, est gardé pour la comptabilité du restaurant.</p>
  <h2>Cookies et stockage</h2><p>Le site n’utilise ni cookie publicitaire ni mesure d’audience. Il garde seulement dans votre navigateur ce qui est indispensable à la commande : votre panier, et un identifiant anonyme de l’appareil qui protège le restaurant contre les fausses commandes${EN_LIGNE ? ', ainsi que les cookies de sécurité de Stripe au moment du paiement' : ''}. Ces éléments sont exemptés de consentement : aucun bandeau ne vous est donc demandé. Les polices de caractères sont fournies par Google Fonts, qui reçoit à cette occasion votre adresse IP.</p>
  <h2>Vos droits</h2><p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données, ou vous opposer à leur traitement, en écrivant à ${E.email}. Si la réponse ne vous satisfait pas, vous pouvez saisir la CNIL (cnil.fr).</p>
</div></section>`,
});

/* ---------------- ecriture ---------------- */
for (const [ch, o] of PAGES) {
  fs.mkdirSync(path.join(ICI, ch), { recursive: true });
  fs.writeFileSync(path.join(ICI, ch, 'index.html'), page(ch, o));
}
// La carte pour le panier : ce que commande.js doit savoir de chaque plat.
const pourPanier = Object.fromEntries(TOUS.map((i) => [i.id, { n: i.n, p: i.p, ...(i.q ? { q: i.q } : {}), ...(i.choix ? { choix: i.choix } : {}), ...(i.midi ? { midi: 1 } : {}), ...(i.attente ? { attente: i.attente } : {}), ...(i.photo ? { photo: i.photo } : {}) }]));
fs.writeFileSync(path.join(ICI, 'assets', 'carte.json'), JSON.stringify(pourPanier));
// L'espace pro (cuisine + gestion) : page a part, jamais indexee, sans mesure.
fs.mkdirSync(path.join(ICI, 'espace'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'espace', 'index.html'), `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Espace pro — Nikkie Sushi</title>
<meta name="theme-color" content="#0d0b0a"><link rel="icon" type="image/png" href="../photos/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css?v=${V}"><link rel="stylesheet" href="../assets/espace.css?v=${V}">
</head><body>
<template data-logo><img class="logo" src="../photos/logo-nikkie-sushi.png" alt="Nikkie Sushi" width="520" height="515"></template>
<div id="app"></div>
<script>window.LOCWEB_CONFIG = { supabaseUrl: 'https://ibqawtgnucakzdldnitj.supabase.co', supabaseAnonKey: 'sb_publishable_rpLrUo4Cqnfl8zSohDqO0A_Q5Vkj2Hk' }; window.NS_V = '${V}';</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<script src="../assets/espace.js?v=${V}" defer></script>
</body></html>
`);
// La page /inscription/ : lien fixe du compte de paiement Stripe (QR dans l'espace pro).
fs.mkdirSync(path.join(ICI, 'inscription'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'inscription', 'index.html'), `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Paiement en ligne — Nikkie Sushi</title>
<meta name="theme-color" content="#0d0b0a"><link rel="icon" type="image/png" href="../photos/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css?v=${V}"><link rel="stylesheet" href="../assets/espace.css?v=${V}">
</head><body>
<template data-logo><img class="logo" src="../photos/logo-nikkie-sushi.png" alt="Nikkie Sushi" width="520" height="515"></template>
<div id="app"></div>
<script>window.LOCWEB_CONFIG = { supabaseUrl: 'https://ibqawtgnucakzdldnitj.supabase.co', supabaseAnonKey: 'sb_publishable_rpLrUo4Cqnfl8zSohDqO0A_Q5Vkj2Hk' };</script>
<script src="../assets/inscription.js?v=${V}" defer></script>
</body></html>
`);
// La version : la tablette la compare pour se mettre a jour HORS service.
fs.writeFileSync(path.join(ICI, 'espace', 'version.json'), JSON.stringify({ v: V }));
// La carte du serveur (fonctions ns-*, propres a Nikkie) : c'est elle qui fait foi pour le prix.
const DOSSIER_NS = path.join(ICI, '..', 'supabase-functions', 'supabase', 'functions', '_ns');
fs.mkdirSync(DOSSIER_NS, { recursive: true });
fs.writeFileSync(path.join(DOSSIER_NS, 'ns-carte.ts'), '// Genere par nikkie-sushi/build.mjs — ne pas modifier a la main.\nexport const CARTE: any = ' + JSON.stringify({
  reglages: { horaires: HORAIRES, livraison: COMMANDE.livraison, retrait: COMMANDE.retrait, pas: COMMANDE.pas, avanceParCreneau: 3, ouvertureCommandes: COMMANDE.ouvertureCommandes },
  plats: Object.fromEntries(TOUS.map((i) => [i.id, { n: i.n, p: i.p, ...(i.choix ? { choix: i.choix } : {}), ...(i.midi ? { midi: 1 } : {}), ...(i.attente ? { attente: i.attente } : {}) }])),
  categories: TOUS.map((i) => ({ id: i.id, n: i.n })),
}) + ';\n');
fs.writeFileSync(path.join(ICI, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.filter(([ch]) => !/cgv|confidentialite|mentions/.test(ch)).map(([ch]) => `  <url><loc>${abs(ch)}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ICI, 'robots.txt'), PROD ? `User-agent: *\nAllow: /\n\nSitemap: ${URL_SITE}sitemap.xml\n` : `# Apercu : pas d'indexation avant la mise en ligne.\nUser-agent: *\nDisallow: /\n`);
console.log(`${PAGES.length} pages, ${TOUS.length} plats — ${PROD ? 'PRODUCTION' : 'apercu (noindex)'} — paiement : ${COMMANDE.paiement}`);
