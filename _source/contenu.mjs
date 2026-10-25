// ===================================================================
//  Nikkie Sushi — les informations de l'etablissement (LocWeb, 2026-10-14)
//  Sources : fiche Google, Instagram @nikkie_sushi, Midi Libre du
//  29/05/2026, annuaire des entreprises (SIRET).
// ===================================================================

export const ENTREPRISE = {
  nom: 'Nikkie Sushi',
  raison: 'SAS NIKKIE SUSHI',
  siret: '995 338 555 00023',
  slogan: 'Cuisine nikkei, l’art du Japon et du Pérou',
  tel: '07 50 65 01 24',
  telLien: '+33750650124',
  email: 'nikkiesushi@gmail.com',
  rue: '1 bis rue Porte Olivier',
  lieu: 'place de la Madeleine',
  codePostal: '34500',
  ville: 'Béziers',
  geo: { lat: 43.3443014, lng: 3.2123651 },
  // cid releve sur la fiche Google (ludocid) : ouvre la fiche exacte.
  maps: 'https://maps.google.com/?cid=8935567473499944027',
  instagram: 'https://www.instagram.com/nikkie_sushi/',
  facebook: 'https://www.facebook.com/profile.php?id=61575464975115',
  tiktok: 'https://www.tiktok.com/@nikkie.sushi',
  note: '5,0',
  nbAvis: 102,
  ouverture: '2026-05-17',
  couverts: 12,
};

// Horaires, un tableau par jour (0 = dimanche). Minutes depuis minuit.
// Fiche Google : 12:00-14:30 et 18:45-22:00, ferme le mercredi.
const SERVICES = [[720, 870], [1125, 1320]];
export const HORAIRES = [SERVICES, SERVICES, SERVICES, [], SERVICES, SERVICES, SERVICES];
export const HORAIRES_TEXTE = [
  ['Lundi', '12h – 14h30 · 18h45 – 22h'],
  ['Mardi', '12h – 14h30 · 18h45 – 22h'],
  ['Mercredi', 'Fermé'],
  ['Jeudi', '12h – 14h30 · 18h45 – 22h'],
  ['Vendredi', '12h – 14h30 · 18h45 – 22h'],
  ['Samedi', '12h – 14h30 · 18h45 – 22h'],
  ['Dimanche', '12h – 14h30 · 18h45 – 22h'],
];
export const HORAIRES_SCHEMA = [
  { jours: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], de: '12:00', a: '14:30' },
  { jours: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], de: '18:45', a: '22:00' },
];

// La commande en ligne. `paiement` :
//   'apercu'    -> rien ne part ; le dernier bouton explique ce qui se passera
//   'sur_place' -> commande envoyee, reglee a la livraison ou au retrait
//   'stripe'    -> paiement par carte avant envoi en cuisine
// Les regles de livraison reprennent leur fonctionnement actuel
// (minimum 20 EUR) ; zone et frais sont a confirmer avec Rokib.
export const COMMANDE = {
  paiement: 'apercu',
  // Rokib, 22/10 : 45 min pour une commande (1 h pour la Nikki Box, champ `attente`
  // du plat), pas de livraison le lundi, commandes ouvertes des 10 h POUR LA JOURNEE.
  livraison: { minimum: 20, frais: 0, codesPostaux: ['34500'], delaiMin: 45, joursSans: [1], servicesSans: [[0, 'midi']] },
  retrait: { delaiMin: 45 },
  ouvertureCommandes: 600,
  pas: 15,
};

// Extraits d'avis Google reels (fiche Nikkie Sushi), raccourcis.
export const AVIS = [
  { auteur: 'gabi 34', texte: 'Des assiettes généreuses, pleines de goût, avec des produits de qualité et une vraie attention aux détails. On sent la passion en cuisine.' },
  { auteur: 'Luana G.', texte: 'Un accueil très chaleureux de Laura et une cuisine raffinée, avec un mélange de saveurs exceptionnel préparé avec soin.' },
  { auteur: 'Barrden B., Local Guide', texte: 'Déjà trois fois. Très bon rapport qualité-prix. Les commandes sont préparées sur le moment, ce qui garantit la fraîcheur.' },
];

export const FAQ = [
  { q: 'C’est quoi, la cuisine nikkei ?', a: 'Une cuisine née au Pérou à la fin du XIXe siècle, quand des Japonais émigrés ont adapté leurs recettes aux produits locaux : piment péruvien à la place du wasabi, citron vert, mangue, maïs. On la retrouve dans nos sushis nikkei, nos ceviches et nos tacos.' },
  { q: 'Livrez-vous à domicile ?', a: 'Oui, à Béziers, pendant nos services du midi et du soir (sauf le lundi et le dimanche midi), à partir de 20 € de commande. Commandez en ligne, choisissez votre heure, et nous vous livrons.' },
  { q: 'Comment payer ma commande ?', a: 'En ligne par carte bancaire au moment de commander, sur une page de paiement sécurisée. Votre commande part en cuisine dès que le paiement est validé.' },
  { q: 'Faut-il réserver pour manger sur place ?', a: 'C’est conseillé : la salle compte douze couverts, plus la terrasse sur la place de la Madeleine. Les réservations se font par téléphone au 07 50 65 01 24.' },
  { q: 'Avez-vous des plats végétariens ?', a: 'Oui : Veggie Box, poke veggie, california veggie, spring rolls veggie, maki avocat cheese, gyoza veggie, guacamole et edamame.' },
  { q: 'Et les allergènes ?', a: 'La liste des allergènes de chaque plat est disponible au restaurant et par téléphone. N’hésitez pas à préciser une allergie dans le commentaire de votre commande.' },
];

export const FAQ_LIVRAISON = [
  { q: 'Où livrez-vous ?', a: 'À Béziers (34500). Pour une adresse en dehors, appelez-nous : selon l’heure et la distance, on trouve souvent une solution.' },
  { q: 'Y a-t-il un minimum de commande ?', a: 'Oui, 20 € pour la livraison. Il n’y a pas de minimum pour une commande à emporter.' },
  { q: 'Combien de temps faut-il compter ?', a: 'Nous préparons tout à la minute. Comptez environ 45 minutes en livraison, 20 minutes à emporter, un peu plus le vendredi et le samedi soir. Vous pouvez aussi choisir votre heure.' },
  { q: 'Puis-je commander à l’avance ?', a: 'Oui. Même quand le restaurant est fermé, vous pouvez commander pour le prochain service et choisir l’heure qui vous arrange.' },
  { q: 'Comment payer ?', a: 'En ligne, par carte bancaire, au moment de commander. Le livreur n’a rien à encaisser.' },
];
