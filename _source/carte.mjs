// ===================================================================
//  La carte de Nikkie Sushi — relevee sur leur fiche Google le
//  2026-10-14 (« Fourni par l'etablissement »), texte brut dans
//  carte-google.txt. Coquilles corrigees (snake -> snacke, coriande,
//  comcombre, Carbernet, Punzu, mais).
//
//  Champs : id (stable : sert au panier, puis a la correspondance avec
//  la table `produits` apres signature), n nom, p prix TTC, d
//  composition, s sauces, q portion, photo, choix (variante a choisir),
//  midi (servi le midi seulement), sig (creation Nikkei), vg (vegetarien).
// ===================================================================

export const CARTE = [
  {
    id: 'plateaux', nom: 'Les plateaux', intro: 'Assortiments pour une personne.',
    items: [
      { id: 'premium-salmon-box', n: 'Premium Salmon Box', p: 25, d: '8 Nikkie Pink, 8 Samba Exotic, 2 sushi saumon, 2 sushi saumon nikkei', sig: true },
      { id: 'nikkie-maki', n: 'Nikkie Maki', p: 13, d: '6 maki saumon, 6 maki thon, 6 maki avocat cheese' },
      { id: 'sushi-mix', n: 'Sushi Mix', p: 12, d: '2 sushi saumon, 2 sushi thon, 2 sushi daurade' },
      { id: 'nikkie-california-maki', n: 'Nikkie California Maki', p: 15, d: '8 california saumon avocat, 6 maki avocat cheese, 6 maki thon spicy' },
      { id: 'oignon-dream', n: 'Oignon Dream', p: 14, d: '8 crispy onion saumon avocat, 8 crispy onion poulet avocat', s: ['teriyaki', 'spicy mayo'] },
      { id: 'veggie-box', n: 'Veggie Box', p: 17, d: '8 california veggie, 8 spring rolls veggie, 6 maki avocat cheese', s: ['spicy mayo'], vg: true },
      { id: 'nikkie-salmon', n: 'Nikkie Salmon', p: 18.5, d: '4 sushi saumon, 8 spring rolls saumon avocat, 8 california saumon avocat' },
      { id: 'rock-and-roll', n: 'Rock and Roll', p: 19, d: '8 spring saumon avocat, 6 cheesy fondant, 8 Samba Takuan', s: ['mangue miso'] },
    ],
  },
  {
    id: 'box', nom: 'Box à partager', intro: 'Pour deux, ou pour une tablée.',
    items: [
      { id: 'duo-box', n: 'Duo Box', p: 42, d: '6 cheesy fondant, 8 spring rolls veggie, 6 maki avocat cheese, 8 california saumon avocat, 8 Samba Takuan, 2 sushi saumon, 2 sushi thon' },
      { id: 'nikki-box', n: 'Nikki Box', p: 60, attente: 60, d: '6 maki avocat cheese, 8 Nikkie Pink, 8 Samba Exotic, 8 Samba Tuna Peruano, 8 Samba Rocoto, 2 sushi saumon nikkei, 2 sushi thon nikkei', photo: 'nikki-box-terrasse-madeleine', sig: true },
    ],
  },
  {
    id: 'midi', nom: 'Le midi', intro: 'Servis le midi seulement, de 12 h à 14 h 30.',
    items: [
      { id: 'midi-chirashi-tartare', n: 'Chirashi tartare de saumon', p: 12.9, d: 'Saumon, riz vinaigré, avocat, concombre, oignons frits, oignons nouveaux, graines de sésame, pousses de moutarde', s: ['tartare'], midi: true },
      { id: 'midi-poke-saumon', n: 'Midi Poke saumon', p: 12.9, d: 'Saumon, riz vinaigré, avocat, ananas, edamame, chou rouge mariné, noisettes torréfiées, oignons frits, ciboulette, coriandre', s: ['ponzu'], midi: true },
      { id: 'midi-classic', n: 'Formule Midi Classic', p: 13, d: '4 sushi saumon, 8 california saumon avocat', midi: true },
      { id: 'midi-salmon', n: 'Formule Midi Salmon', p: 16, d: '6 cheesy fondant, 8 spring rolls saumon avocat, 2 sushi saumon', midi: true },
    ],
  },
  {
    id: 'nikkei-rolls', nom: 'Nikkei rolls', intro: 'Les créations du chef, entre cuisine japonaise et péruvienne. 8 pièces.',
    items: [
      { id: 'nikkie-truffe', n: 'Nikkie Truffe', p: 16, q: '8 pièces', d: 'Ebi fry, daurade, concombre, carotte, carpaccio de truffe d’été, mayonnaise, ciboulette', s: ['teriyaki', 'huile à la truffe', 'mayonnaise ciboulette'], photo: 'nikkie-truffe', sig: true },
      { id: 'samba-tuna-peruano', n: 'Samba Tuna Peruano', p: 13, q: '8 pièces', d: 'Thon, avocat, concombre, oignons frits, oignons nouveaux', s: ['teriyaki', 'spicy mayo'], photo: 'samba-tuna-peruano', sig: true },
      { id: 'nikkie-pink', n: 'Nikkie Pink', p: 13, q: '8 pièces', d: 'Saumon, saumon snacké, pickles de légumes, cream cheese, wasabi mariné, graines de sésame', s: ['mangue miso', 'mayonnaise'], photo: 'nikkie-pink', sig: true },
      { id: 'samba-exotic', n: 'Samba Exotic', p: 12.9, q: '8 pièces', d: 'Avocat, crevette tempura, saumon snacké, oignon nouveau, épices japonaises (shichimi)', s: ['maracuja'], sig: true },
      { id: 'spicy-dragon-tempura', n: 'Spicy Dragon Tempura', p: 12.5, q: '8 pièces', d: 'Crevette tempura, avocat', s: ['spicy mayo', 'teriyaki'] },
      { id: 'samba-rocoto', n: 'Samba Rocoto', p: 12, q: '8 pièces', d: 'Crispy chicken, concombre, guacamole, piment rouge, graines de sésame, pousses de moutarde', s: ['spicy mayo', 'teriyaki'], sig: true },
      { id: 'samba-takuan', n: 'Samba Takuan', p: 11.5, q: '8 pièces', d: 'Saumon, radis japonais mariné, graines de sésame, coriandre, noisettes', s: ['mangue miso'] },
    ],
  },
  {
    id: 'sushi-tacos', nom: 'Sushi nikkei & tacos', intro: 'Notre spécialité de la maison : le tacos nikkei, une pâte à gyoza croustillante garnie comme un ceviche.',
    items: [
      { id: 'sushi-saumon-nikkei', n: 'Sushi saumon nikkei', p: 3, q: '1 pièce', d: 'Saumon, pousses de moutarde, épices japonaises', s: ['maracuja'], photo: 'sushi-nikkei-saumon-thon-daurade', sig: true },
      { id: 'sushi-thon-nikkei', n: 'Sushi thon nikkei', p: 3.5, q: '1 pièce', d: 'Thon, graines de sésame, wasabi, oignon rouge, piment rouge', s: ['spicy mayo'], sig: true },
      { id: 'sushi-daurade-nikkei', n: 'Sushi daurade nikkei', p: 3.5, q: '1 pièce', d: 'Daurade snackée, fruit de la passion, mangue, oignon rouge, pousses de moutarde, épices japonaises', sig: true },
      { id: 'sushi-saumon', n: 'Sushi saumon', p: 4.5, q: '2 pièces' },
      { id: 'sushi-thon', n: 'Sushi thon', p: 5, q: '2 pièces' },
      { id: 'sushi-daurade', n: 'Sushi daurade', p: 5.5, q: '2 pièces' },
      { id: 'tacos-saumon', maison: true, n: 'Tacos saumon', p: 12.5, q: '3 pièces', d: 'Saumon, grenade, concombre, oignons rouges', s: ['spicy mayo'], sig: true },
      { id: 'tacos-thon', maison: true, n: 'Tacos thon', p: 13, q: '3 pièces', d: 'Thon, concombre, oignon rouge, ciboulette, graines de sésame', s: ['soja yuzu'], sig: true },
      { id: 'tacos-daurade', maison: true, n: 'Tacos daurade', p: 13, q: '3 pièces', d: 'Daurade, mangue, oignons rouges, piment rouge', s: ['maracuja'], sig: true },
    ],
  },
  {
    id: 'ceviche', nom: 'Ceviche', intro: 'Le classique péruvien : poisson cru mariné au citron vert, leche de tigre.',
    items: [
      { id: 'ceviche-saumon', n: 'Ceviche saumon', p: 15, d: 'Saumon, avocat, mangue, maïs choclo grillé, oignons rouges, citron vert, coriandre', s: ['leche de tigre'], sig: true },
      { id: 'ceviche-thon', n: 'Ceviche thon', p: 16, d: 'Thon, avocat, edamame, maïs choclo grillé, oignons rouges, citron vert, coriandre, graines et huile de sésame', s: ['leche de tigre'], sig: true },
      { id: 'ceviche-daurade', n: 'Ceviche daurade', p: 17, d: 'Daurade, avocat, pamplemousse, maïs choclo grillé, fruit de la passion, oignons rouges, piment rouge, citron vert, coriandre', s: ['maracuja'], sig: true },
    ],
  },
  {
    id: 'poke', nom: 'Poke bowls',
    items: [
      { id: 'poke-saumon', n: 'Poke saumon', p: 15, d: 'Saumon, riz vinaigré, avocat, ananas, edamame, chou rouge mariné, noisettes torréfiées, oignons frits, oignons nouveaux, coriandre', s: ['ponzu'] },
      { id: 'poke-poulet', n: 'Poke poulet', p: 13.5, d: 'Poulet, riz vinaigré, avocat, ananas, edamame, concombre, grenade, citron vert, oignons frits', s: ['poké'] },
      { id: 'poke-veggie', n: 'Poke veggie', p: 13, d: 'Guacamole, riz vinaigré, avocat, ananas, chou rouge mariné, carottes, graines de sésame wasabi, épices japonaises', s: ['ponzu'], vg: true },
      { id: 'poke-thon-truffe', n: 'Poke thon truffe', p: 18.5, d: 'Thon, riz vinaigré, edamame, avocat, ananas, chou rouge mariné, carottes, carpaccio de truffe d’été, graines de sésame', s: ['poké'] },
      { id: 'poke-tataki-saumon', n: 'Poke tataki saumon teriyaki', p: 15.5, d: 'Saumon mi-cuit, riz vinaigré, avocat, wakamé, edamame, mangue, grenade, oignon nouveau, oignons frits', s: ['poké'] },
      { id: 'poke-daurade', n: 'Poke daurade', p: 16, d: 'Daurade marinée, riz vinaigré, avocat, edamame, mangue, carottes, ciboulette, graines de sésame', s: ['maracuja'] },
      { id: 'poke-crevette', n: 'Poke crevette', p: 15, d: 'Crevette marinée, riz vinaigré, avocat, chou rouge, carottes, pamplemousse, pomme granny', s: ['soja aigre-douce'] },
      { id: 'poke-leche-de-tigre', n: 'Poke leche de tigre', p: 15.5, d: 'Saumon, riz vinaigré, avocat, edamame, grenade, concombre, oignons nouveaux, oignons rouges, coriandre, citron vert', s: ['leche de tigre'], sig: true },
    ],
  },
  {
    id: 'sashimi', nom: 'Sashimi',
    items: [
      { id: 'sashimi-assortiment', n: 'Assortiment sashimi', p: 17, q: '15 pièces', d: 'Saumon, thon, daurade', photo: 'assortiment-sashimi' },
      { id: 'sashimi-saumon', n: 'Sashimi saumon', p: 7, q: '5 pièces' },
      { id: 'sashimi-thon', n: 'Sashimi thon', p: 8, q: '5 pièces' },
      { id: 'sashimi-daurade', n: 'Sashimi daurade', p: 8, q: '5 pièces' },
    ],
  },
  {
    id: 'tataki-chirashi', nom: 'Tataki & chirashi',
    items: [
      { id: 'tataki-saumon', n: 'Tataki saumon', p: 15, q: '8 pièces', d: 'Saumon, oignons frits, oignons nouveaux, radis, piment rouge, graines de sésame, pousses de moutarde', s: ['mangue miso'] },
      { id: 'tataki-thon', n: 'Tataki thon', p: 16, q: '8 pièces', d: 'Thon, oignons frits, oignons nouveaux, radis, piment rouge, graines de sésame, pousses de moutarde', s: ['mangue miso'] },
      { id: 'chirashi-tartare', n: 'Chirashi tartare de saumon', p: 15, d: 'Tartare de saumon, avocat, concombre, oignons frits, oignons nouveaux, graines de sésame, pousses de moutarde', s: ['tartare', 'soja yuzu'] },
      { id: 'chirashi-saumon', n: 'Chirashi saumon', p: 15.5, d: 'Tranches de saumon, oignons nouveaux, riz vinaigré, graines de sésame' },
      { id: 'chirashi-thon', n: 'Chirashi thon', p: 13, d: 'Tranches de thon, avocat, riz vinaigré, oignons nouveaux, graines de sésame' },
      { id: 'chirashi-mix', n: 'Chirashi mix', p: 17, d: 'Tranches de saumon et de thon, avocat, riz vinaigré, oignons nouveaux, graines de sésame' },
    ],
  },
  {
    id: 'donburi-nouilles', nom: 'Donburi & nouilles', intro: 'Les plats chauds.',
    items: [
      { id: 'donburi-chicken-balls', n: 'Donburi chicken balls', p: 14, d: 'Boulettes de poulet, riz, pickles de carotte, poivrons rouges, oignons rouges, graines de sésame, oignons nouveaux', s: ['donburi'] },
      { id: 'donburi-chicken-grilled', n: 'Donburi chicken grilled', p: 15, d: 'Poulet grillé, riz, pickles de carotte, poivrons rouges, oignons rouges, graines de sésame, oignons nouveaux', s: ['donburi'] },
      { id: 'donburi-salmon', n: 'Donburi salmon', p: 18, d: 'Saumon, riz, pickles de carotte, poivrons rouges, oignons rouges, graines de sésame, oignons nouveaux', s: ['donburi'] },
      { id: 'yakisoba-poulet', n: 'Yakisoba poulet', p: 15, d: 'Nouilles sautées, légumes croquants, poulet, sauce yakisoba' },
      { id: 'yakisoba-saumon', n: 'Yakisoba saumon', p: 18, d: 'Nouilles sautées, légumes croquants, saumon, sauce yakisoba' },
    ],
  },
  {
    id: 'maki-rolls', nom: 'Maki & rolls', intro: 'Maki : 6 pièces. California et spring rolls : 8 pièces.',
    items: [
      { id: 'maki-avocat-cheese', n: 'Maki avocat cheese', p: 4.5, q: '6 pièces', d: 'Avocat, cream cheese', vg: true },
      { id: 'maki-saumon', n: 'Maki saumon', p: 5, q: '6 pièces', d: 'Saumon' },
      { id: 'maki-thon-spicy', n: 'Maki thon spicy', p: 5.5, q: '6 pièces', d: 'Thon, ciboulette, spicy mayo' },
      { id: 'cheesy-fondant', n: 'Cheesy fondant', p: 8, q: '6 pièces', d: 'Saumon, fromage, riz vinaigré' },
      { id: 'tataki-cheesy-fondant', n: 'Tataki cheesy fondant & teriyaki', p: 9, q: '6 pièces', d: 'Saumon snacké, fromage, riz vinaigré', s: ['teriyaki'] },
      { id: 'california-saumon-avocat', n: 'California saumon avocat', p: 6.5, q: '8 pièces', d: 'Saumon, avocat, graines de sésame' },
      { id: 'california-veggie', n: 'California veggie', p: 6, q: '8 pièces', d: 'Concombre, carottes, radis japonais mariné, chou rouge mariné, guacamole, pousses de moutarde, sésame wasabi et sésame noir', s: ['spicy mayo'], photo: 'california-veggie-eglise-madeleine', vg: true },
      { id: 'california-thon-cuit', n: 'California thon cuit', p: 6.5, q: '8 pièces', d: 'Thon cuit sauce teriyaki, mayonnaise, avocat, ciboulette, graines de sésame' },
      { id: 'california-chicken', n: 'California chicken', p: 6, q: '8 pièces', d: 'Crispy chicken, avocat, concombre, ciboulette, sésame' },
      { id: 'california-crevette', n: 'California crevette', p: 6.5, q: '8 pièces', d: 'Crevette, avocat, sésame noir', s: ['soja aigre-douce'] },
      { id: 'spring-saumon-avocat', n: 'Spring rolls saumon avocat', p: 7, q: '8 pièces', d: 'Saumon, avocat, coriandre, menthe, laitue' },
      { id: 'spring-veggie', n: 'Spring rolls veggie', p: 6.5, q: '8 pièces', d: 'Avocat, concombre, coriandre, menthe, laitue, cream cheese, wasabi', vg: true },
    ],
  },
  {
    id: 'entrees', nom: 'Entrées & accompagnements',
    items: [
      { id: 'guacamole', n: 'Guacamole', p: 5, d: 'Avocat, citron vert, coriandre, piment jalapeño, oignons rouges, fleur de sel, chips de maïs', vg: true },
      { id: 'gyoza-poulet', n: 'Gyoza poulet légumes', p: 5 },
      { id: 'gyoza-veggie', n: 'Gyoza veggie', p: 4.5, vg: true },
      { id: 'chicken-barbecue', n: 'Chicken barbecue', p: 6.5, d: 'Brochette de poulet sauce teriyaki, salade nikkie' },
      { id: 'chicken-balls', n: 'Chicken balls', p: 6, d: 'Brochette de boulettes de poulet sauce teriyaki, salade nikkie' },
      { id: 'edamame', n: 'Edamame', p: 3.5, choix: ['Nature', 'Spicy'], vg: true },
      { id: 'soupe-miso', n: 'Soupe miso', p: 3.5, d: 'Tofu, algues, ciboulette', vg: true },
      { id: 'soupe-miso-saumon', n: 'Soupe miso saumon', p: 4.5, d: 'Tofu, algues, ciboulette, saumon' },
      { id: 'salade-chou', n: 'Salade de chou', p: 2.5, d: 'Chou japonais, vinaigrette, sésame', vg: true },
      { id: 'salade-chou-crevettes', n: 'Salade de chou crevettes', p: 4.5, d: 'Chou japonais, vinaigrette, sésame, crevettes' },
      { id: 'salade-wakame', n: 'Salade wakamé', p: 4.5, d: 'Algues, huile de sésame', vg: true },
      { id: 'riz-nature', n: 'Riz nature', p: 2.5, vg: true },
      { id: 'riz-vinaigre', n: 'Riz vinaigré', p: 3, vg: true },
    ],
  },
  {
    id: 'desserts', nom: 'Desserts',
    items: [
      { id: 'mochi-mangue', n: 'Mochi glacé mangue', p: 5, q: '2 pièces' },
      { id: 'mochi-vanille', n: 'Mochi glacé vanille', p: 5, q: '2 pièces' },
      { id: 'mochi-matcha', n: 'Mochi cream thé matcha', p: 5, q: '2 pièces' },
      { id: 'cheesecake', n: 'Cheesecake', p: 5 },
      { id: 'coupe-fruits-exotiques', n: 'Coupe de fruits exotiques', p: 5.5, d: 'Mangue, ananas, pamplemousse, fruit de la passion, citron vert, menthe, grenade' },
      { id: 'coupe-mangue', n: 'Coupe de mangue', p: 5 },
      { id: 'coupe-ananas', n: 'Coupe d’ananas', p: 4.5 },
    ],
  },
  {
    id: 'boissons', nom: 'Boissons',
    items: [
      { id: 'jus-passion', n: 'Jus passion, ananas ou mangue', p: 5, q: '31 cl', choix: ['Passion', 'Ananas', 'Mangue'] },
      { id: 'jus-litchi', n: 'Jus de litchi', p: 5, q: '31 cl' },
      { id: 'jus-coco', n: 'Jus de coco', p: 5, q: '31 cl' },
      { id: 'coca', n: 'Coca-Cola', p: 3, q: '33 cl', choix: ['Classique', 'Zéro'] },
      { id: 'ice-tea', n: 'Ice Tea', p: 3, q: '33 cl' },
      { id: 'orangina', n: 'Orangina', p: 2.5, q: '33 cl' },
      { id: 'san-pellegrino', n: 'San Pellegrino', p: 2, q: '50 cl' },
      { id: 'biere-asahi', n: 'Bière Asahi', p: 4.5, q: '33 cl · 5 % vol.', alcool: true },
      { id: 'biere-kirin', n: 'Bière Kirin', p: 4.5, q: '33 cl · 5 % vol.', alcool: true },
      { id: 'vin-verre', n: 'Verre de vin', p: 4.5, choix: ['Rouge cabernet', 'Rosé pinot noir', 'Blanc chardonnay'], alcool: true },
      { id: 'the-vert', n: 'Thé vert', p: 3 },
      { id: 'cafe-expresso', n: 'Café expresso', p: 2 },
      { id: 'cafe-allonge', n: 'Café allongé', p: 2.1 },
    ],
  },
];

// Les « incontournables » de l'accueil : les plats qu'ils mettent eux-memes
// en avant sur Instagram, et dont on a la photo.
export const VEDETTES = ['nikkie-truffe', 'samba-tuna-peruano', 'nikkie-pink', 'sushi-saumon-nikkei', 'sashimi-assortiment', 'nikki-box'];
