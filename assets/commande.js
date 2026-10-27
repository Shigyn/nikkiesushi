/* ===================================================================
   Nikkie Sushi — la commande en ligne (LocWeb, 2026-10-14)
   Sur le modele de KSM (clients/Ksm/carte.js) : panier toujours
   consultable, Modifier/Retirer, message « ferme » calcule sur les
   horaires. En plus : livraison ou retrait, creneau, et le paiement.

   NIKKIE.paiement :
     'apercu'    rien ne part ; le dernier ecran explique la suite.
     'sur_place' create-commande-livraison / create-commande-retrait.
     'stripe'    create-checkout-session, puis page Stripe.
   Au branchement : les `id` de carte.json deviennent les `produit_id`
   (colonne slug dans `produits`, ou table de correspondance), et les
   fonctions recoivent mode, creneau et commentaire (voir PLAN.md, 7).
   =================================================================== */
(function () {
  'use strict';
  var CFG = window.NIKKIE || {};
  var LW = window.LOCWEB_CONFIG || {};
  var H = window.NikkieHoraires;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var euros = function (n) { return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ICO = {
    scooter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h3l2.6 7.2A4 4 0 1 1 15 15H9.9A4 4 0 1 1 6 11h6.4l-1.2-3H8V6h4.6l1.2 3H15l-1-3h-1V4zM6 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>',
    sac: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 14H5L4 7zm2 0h6V6a3 3 0 0 0-6 0z"/></svg>',
    cadenas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>',
  };

  /* --- Etat, garde dans le navigateur (panier et coordonnees) --------- */
  var CLE = 'nikkie-commande';
  var etat = { panier: [], infos: { mode: 'livraison' } };
  try { var lu = JSON.parse(localStorage.getItem(CLE) || 'null'); if (lu && Array.isArray(lu.panier)) etat = lu; } catch (e) {}
  etat.infos = etat.infos || { mode: 'livraison' };
  var garder = function () { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };

  var CARTE = null;
  var chargement = fetch(CFG.racine + 'assets/carte.json').then(function (r) { return r.json(); }).then(function (c) {
    CARTE = c;
    etat.panier = etat.panier.filter(function (l) { return CARTE[l.id]; });
    majBarre();
  }).catch(function () {});

  var sousTotal = function () { return etat.panier.reduce(function (t, l) { return t + CARTE[l.id].p * l.qte; }, 0); };
  var nbArticles = function () { return etat.panier.reduce(function (t, l) { return t + l.qte; }, 0); };
  var frais = function () { return etat.infos.mode === 'livraison' ? (CFG.livraison.frais || 0) : 0; };

  /* --- Ajouter ---------------------------------------------------------- */
  function ajouter(id, choix, bouton) {
    var p = CARTE[id]; if (!p) return;
    var cle = id + (choix ? '|' + choix : '');
    var l = etat.panier.filter(function (x) { return x.k === cle; })[0];
    if (l) l.qte++; else etat.panier.push({ k: cle, id: id, choix: choix || null, qte: 1 });
    garder(); majBarre(true);
    toast(p.n + (choix ? ' (' + choix + ')' : '') + ' ajouté');
    if (bouton) { bouton.classList.add('ajoute'); setTimeout(function () { bouton.classList.remove('ajoute'); }, 700); }
    if (panier.classList.contains('ouvert')) rendre();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ajouter]');
    if (b) {
      e.preventDefault();
      chargement.then(function () {
        var p = CARTE && CARTE[b.getAttribute('data-ajouter')];
        if (!p) return;
        if (p.choix) demanderChoix(b.getAttribute('data-ajouter'), b); else ajouter(b.getAttribute('data-ajouter'), null, b);
      });
      return;
    }
    if (e.target.closest('[data-ouvrir-panier]')) { ouvrir('panier'); return; }
    if (e.target.closest('[data-fermer-panier]') || e.target.closest('[data-panier-voile]')) fermer();
  });

  /* --- La feuille de choix (edamame nature ou spicy, coca ou zero...) -- */
  var voileChoix = $('[data-choix]');
  function demanderChoix(id, bouton) {
    var p = CARTE[id];
    var f = document.createElement('div');
    f.className = 'choix-feuille'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', p.n);
    f.innerHTML = '<h3>' + esc(p.n) + '</h3><p>Faites votre choix</p><div class="choix-options">' +
      p.choix.map(function (c) { return '<button type="button" data-c="' + esc(c) + '"><span>' + esc(c) + '</span><span class="prix">' + euros(p.p) + '</span></button>'; }).join('') + '</div>';
    document.body.appendChild(f);
    voileChoix.hidden = false;
    requestAnimationFrame(function () { voileChoix.classList.add('visible'); f.classList.add('visible'); });
    var finir = function () { f.classList.remove('visible'); voileChoix.classList.remove('visible'); setTimeout(function () { f.remove(); voileChoix.hidden = true; }, 300); };
    f.addEventListener('click', function (e) { var o = e.target.closest('[data-c]'); if (o) { ajouter(id, o.getAttribute('data-c'), bouton); finir(); } });
    voileChoix.onclick = finir;
    f.querySelector('button').focus();
  }

  /* --- La barre « Voir ma commande » ------------------------------------ */
  var barre = $('[data-ouvrir-panier]'), barreMobile = $('[data-barre]');
  function majBarre(saut) {
    if (!CARTE) return;
    var n = nbArticles();
    barre.hidden = n === 0 || panier.classList.contains('ouvert');
    if (barreMobile) barreMobile.classList.toggle('cachee', n > 0);
    $('[data-panier-n]').textContent = n;
    $('[data-panier-total]').textContent = euros(sousTotal());
    if (saut && n) { barre.classList.remove('saute'); void barre.offsetWidth; barre.classList.add('saute'); }
  }

  var toastEl = $('[data-toast]'), toastT;
  function toast(t) { toastEl.textContent = t; toastEl.classList.add('visible'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('visible'); }, 1800); }

  /* --- Le panneau --------------------------------------------------------- */
  var panier = $('[data-panier]'), voile = $('[data-panier-voile]');
  var corps = $('[data-panier-corps]'), pied = $('[data-panier-pied]'), titre = $('[data-panier-titre]');
  var retour = $('[data-panier-retour]'), bandeau = $('[data-panier-etat]');
  var ecran = 'panier', dernierFocus = null;

  function ouvrir(quel) {
    chargement.then(function () {
      ecran = quel || 'panier';
      dernierFocus = document.activeElement;
      voile.hidden = false; panier.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () { voile.classList.add('visible'); panier.classList.add('ouvert'); });
      document.documentElement.style.overflow = 'hidden';
      rendre(); majBarre();
      setTimeout(function () { $('[data-fermer-panier]').focus(); }, 50);
    });
  }
  function fermer() {
    panier.classList.remove('ouvert'); voile.classList.remove('visible'); panier.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    setTimeout(function () { voile.hidden = true; majBarre(); }, 300);
    if (dernierFocus) dernierFocus.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panier.classList.contains('ouvert')) fermer(); });
  retour.addEventListener('click', function () { ecran = ecran === 'recap' ? 'infos' : 'panier'; rendre(); });

  /* Ferme ? On le dit tout de suite, et on propose de commander pour le
     prochain service — comme chez KSM, mais sans bloquer. */
  // Les commandes en ligne ouvrent a 10 h, pour la journee (Rokib, 22/10) : des
  // 10 h on peut commander pour ce midi comme pour ce soir, le site n'est pas « ferme ».
  function majBandeau() {
    var d = new Date(), s = H.services(d, 1)[0], now = d.getHours() * 60 + d.getMinutes();
    var ouvre = CFG.ouvertureCommandes || 0, hOuvre = H.hm(ouvre).replace(':00', '');
    if (s && s.enCours) { bandeau.hidden = true; return; }
    bandeau.hidden = false;
    var auj = s && H.quand(s, d) === 'aujourd’hui';
    if (auj && now >= ouvre) bandeau.innerHTML = '<b>Commandes ouvertes.</b> Choisissez votre heure pour aujourd’hui : service à partir de ' + H.hm(s.debut) + '.';
    else if (auj) bandeau.innerHTML = '<b>Fermé pour l’instant.</b> Les commandes en ligne ouvrent à ' + hOuvre + ', pour la journée.';
    else if (s) bandeau.innerHTML = '<b>Fermé pour aujourd’hui.</b> Nous rouvrons ' + H.quand(s, d) + ' : commandes en ligne dès ' + hOuvre + ' ce jour-là.';
    else bandeau.innerHTML = '<b>Fermé.</b> Appelez-nous pour commander.';
  }

  function rendre() {
    majBandeau();
    retour.hidden = ecran === 'panier';
    if (!etat.panier.length) ecran = 'panier';
    if (ecran === 'panier') rendrePanier();
    else if (ecran === 'infos') rendreInfos();
    else if (ecran === 'recap') rendreRecap();
    else if (ecran === 'apercu') rendreApercu();
    else if (ecran === 'fini') { ecran = 'panier'; rendrePanier(); }
    corps.scrollTop = 0;
  }

  /* 1. Le panier : on voit tout, on modifie, on retire. */
  function rendrePanier() {
    titre.textContent = 'Votre commande';
    if (!etat.panier.length) {
      corps.innerHTML = '<div class="panier-vide"><b>Votre panier est vide</b>Ajoutez des plats depuis la carte avec le bouton +.</div>';
      pied.innerHTML = '<a class="bouton bouton-or" href="' + CFG.racine + 'carte/">Voir la carte</a>';
      return;
    }
    corps.innerHTML = '<ul class="lignes">' + etat.panier.map(function (l, i) {
      var p = CARTE[l.id];
      return '<li class="ligne"><div class="ligne-texte"><b>' + esc(p.n) + '</b><small>' + esc([l.choix, p.q, p.midi ? 'le midi' : ''].filter(Boolean).join(' · ')) + '</small></div>' +
        '<div class="qte"><button type="button" data-moins="' + i + '" aria-label="Retirer un ' + esc(p.n) + '">−</button><span>' + l.qte + '</span><button type="button" data-plus="' + i + '" aria-label="Ajouter un ' + esc(p.n) + '">+</button></div>' +
        '<span class="prix">' + euros(p.p * l.qte) + '</span></li>';
    }).join('') + '</ul>';
    pied.innerHTML = totaux() + '<button type="button" class="bouton bouton-or" data-suite>Continuer · ' + euros(sousTotal() + frais()) + '</button>';
  }
  corps.addEventListener('click', function (e) {
    var m = e.target.closest('[data-moins]'), p = e.target.closest('[data-plus]');
    if (!m && !p) return;
    var l = etat.panier[+(m || p).getAttribute(m ? 'data-moins' : 'data-plus')];
    l.qte += m ? -1 : 1;
    if (l.qte <= 0) etat.panier.splice(etat.panier.indexOf(l), 1);
    garder(); majBarre(); rendre();
  });

  function totaux() {
    var st = sousTotal(), f = frais();
    return '<div class="totaux"><div><span>Sous-total</span><span>' + euros(st) + '</span></div>' +
      (f ? '<div><span>Livraison</span><span>' + euros(f) + '</span></div>' : '') +
      '<div class="total"><span>Total</span><span>' + euros(st + f) + '</span></div></div>';
  }

  /* 2. Livraison ou a emporter, l'heure, les coordonnees. */
  // Le delai : 45 min, 1 h si le panier contient la Nikki Box (champ `attente`).
  function delaiPanier(mode) {
    var base = mode === 'livraison' ? CFG.livraison.delaiMin : CFG.retrait.delaiMin;
    return etat.panier.reduce(function (m, l) { var p = CARTE && CARTE[l.id]; return Math.max(m, (p && p.attente) || 0); }, base);
  }
  function lundiSansLivraison(mode) { return mode === 'livraison' && (CFG.livraison.joursSans || []).indexOf(new Date().getDay()) >= 0; }
  // Pas de livraison sur certains services (le dimanche midi, Rokib 25/10).
  function serviceSansLivraison(s, mode) {
    if (mode !== 'livraison') return false;
    var j = s.jour.getDay(), midi = s.debut < 900;
    return (CFG.livraison.joursSans || []).indexOf(j) >= 0 || (CFG.livraison.servicesSans || []).some(function (x) { return x[0] === j && (x[1] === 'midi') === midi; });
  }
  // Une formule du midi dans le panier : seulement les heures du midi (Rokib 25/10).
  function panierMidi() { return etat.panier.some(function (l) { var p = CARTE && CARTE[l.id]; return p && p.midi; }); }
  function creneaux(mode) {
    var g = creneauxDuJour(mode);
    // Apercu : on laisse tester a toute heure (le serveur de demo ignore les horaires).
    var apresMidi = new Date().getHours() * 60 + new Date().getMinutes() >= 900;
    if (!g.length && CFG.apercuToujoursOuvert && !lundiSansLivraison(mode) && !(panierMidi() && apresMidi)) g = [{ s: null, nom: 'Aperçu', liste: [], asap: true }];
    return g;
  }
  function creneauxDuJour(mode) {
    var d = new Date(), now = d.getHours() * 60 + d.getMinutes();
    var delai = delaiPanier(mode), pas = CFG.pas || 15;
    if (lundiSansLivraison(mode) || now < (CFG.ouvertureCommandes || 0)) return [];
    var midiSeul = panierMidi();
    return H.services(d, 3).filter(function (s) { return H.quand(s, d) === 'aujourd’hui' && !serviceSansLivraison(s, mode) && (!midiSeul || s.debut < 900); }).map(function (s) {
      var depart = s.enCours ? now + delai : s.debut + delai;
      var t = Math.ceil(depart / pas) * pas, liste = [];
      for (; t <= s.fin; t += pas) liste.push(t);
      var nom = (H.quand(s, d) === 'aujourd’hui' ? (s.debut < 900 ? 'Ce midi' : 'Ce soir') : H.quand(s, d).replace(/^./, function (c) { return c.toUpperCase(); }) + (s.debut < 900 ? ' midi' : ' soir'));
      return { s: s, nom: nom, liste: liste, asap: s.enCours && liste.length > 0 };
    }).filter(function (g) { return g.liste.length; });
  }
  function rendreInfos() {
    titre.textContent = 'Livraison ou à emporter';
    var i = etat.infos, groupes = creneaux(i.mode);
    var options = groupes.map(function (g, gi) {
      return '<optgroup label="' + esc(g.nom) + '">' + (g.asap && gi === 0 ? '<option value="' + gi + '|asap">Dès que possible (≈ ' + delaiPanier(i.mode) + ' min)</option>' : '') +
        g.liste.map(function (t) { return '<option value="' + gi + '|' + t + '">' + esc(g.nom) + ' · ' + H.hm(t) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    corps.innerHTML = '<form class="form" data-form novalidate>' +
      '<div class="segment" role="radiogroup" aria-label="Mode">' +
      '<label><input type="radio" name="mode" value="livraison"' + (i.mode === 'livraison' ? ' checked' : '') + '><span>' + ICO.scooter + 'Livraison</span></label>' +
      '<label><input type="radio" name="mode" value="retrait"' + (i.mode === 'retrait' ? ' checked' : '') + '><span>' + ICO.sac + 'À emporter</span></label></div>' +
      '<label class="champ"><span>Pour quand ?</span><select name="creneau" required>' + options + '</select></label>' +
      (i.mode === 'livraison' ? '<label class="champ"><span>Adresse de livraison</span><input name="adresse" autocomplete="street-address" placeholder="N° et rue, bâtiment, étage" value="' + esc(i.adresse) + '" required></label>' +
        '<div class="deux"><label class="champ"><span>Code postal</span><input name="cp" inputmode="numeric" autocomplete="postal-code" maxlength="5" value="' + esc(i.cp || CFG.livraison.codesPostaux[0]) + '" required></label>' +
        '<label class="champ"><span>Ville</span><input name="ville" autocomplete="address-level2" value="' + esc(i.ville || 'Béziers') + '"></label></div>' : '') +
      '<label class="champ"><span>Nom</span><input name="nom" autocomplete="name" value="' + esc(i.nom) + '" required></label>' +
      '<label class="champ"><span>Téléphone</span><input name="tel" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(i.tel) + '" required></label>' +
      '<label class="champ"><span>Commentaire <small>(facultatif : allergie, digicode…)</small></span><textarea name="commentaire" rows="2">' + esc(i.commentaire) + '</textarea></label>' +
      '<p class="alerte" data-alerte hidden></p></form>';
    var sel = corps.querySelector('[name=creneau]');
    if (i.creneau && sel.querySelector('option[value="' + i.creneau + '"]')) sel.value = i.creneau;
    pied.innerHTML = totaux() + '<button type="button" class="bouton bouton-or" data-suite>Vérifier ma commande</button>';
    corps.querySelectorAll('[name=mode]').forEach(function (r) { r.addEventListener('change', function () { lireForm(); etat.infos.mode = r.value; garder(); rendre(); }); });
    if (!groupes.length) {
      var nowM = new Date().getHours() * 60 + new Date().getMinutes();
      var dim = i.mode === 'livraison' && new Date().getDay() === 0 && nowM < 900;
      sel.outerHTML = '<p class="alerte">' + (lundiSansLivraison(i.mode) ? 'Pas de livraison le lundi : choisissez « À emporter ».'
        : panierMidi() && nowM >= (CFG.ouvertureCommandes || 0) ? 'Les formules du midi se commandent seulement pour le service du midi. Pour ce soir, retirez-les de votre panier.'
        : dim ? 'Pas de livraison le dimanche midi : choisissez « À emporter », ou une livraison ce soir.'
        : nowM < (CFG.ouvertureCommandes || 0) ? 'Les commandes en ligne ouvrent à ' + H.hm(CFG.ouvertureCommandes).replace(':00', '') + ', pour la journée.'
        : 'Plus de créneau aujourd’hui : les commandes en ligne rouvrent demain dès ' + H.hm(CFG.ouvertureCommandes || 0).replace(':00', '') + '. Vous pouvez aussi nous appeler.') + '</p>';
    }
    if (delaiPanier(i.mode) > (i.mode === 'livraison' ? CFG.livraison.delaiMin : CFG.retrait.delaiMin) && groupes.length)
      corps.querySelector('.champ').insertAdjacentHTML('afterend', '<p class="note-delai">La Nikki Box demande 1 h de préparation : les heures proposées en tiennent compte.</p>');
  }
  function lireForm() {
    var f = $('[data-form]'); if (!f) return;
    ['adresse', 'cp', 'ville', 'nom', 'tel', 'commentaire', 'creneau'].forEach(function (n) { if (f[n]) etat.infos[n] = f[n].value.trim(); });
    garder();
  }
  function verifier() {
    var f = $('[data-form]'), i = etat.infos, err = [];
    f.querySelectorAll('.champ').forEach(function (c) { c.classList.remove('erreur'); });
    var marque = function (n, msg) { var c = f[n] && f[n].closest('.champ'); if (c) c.classList.add('erreur'); err.push(msg); };
    if (!i.creneau) err.push('Choisissez une heure.');
    if (i.mode === 'livraison') {
      if (i.adresse.length < 5) marque('adresse', 'Indiquez l’adresse de livraison.');
      if (CFG.livraison.codesPostaux.indexOf(i.cp) < 0) marque('cp', 'Nous livrons à Béziers (' + CFG.livraison.codesPostaux.join(', ') + '). Pour une autre adresse, appelez-nous.');
      if (sousTotal() < CFG.livraison.minimum) err.push('La livraison commence à ' + euros(CFG.livraison.minimum) + ' de commande (il manque ' + euros(CFG.livraison.minimum - sousTotal()) + ').');
    }
    if (i.nom.length < 2) marque('nom', 'Indiquez votre nom.');
    if (i.tel.replace(/\D/g, '').length < 10) marque('tel', 'Indiquez un numéro de téléphone valide.');
    var midi = etat.panier.some(function (l) { return CARTE[l.id].midi; });
    if (midi && i.creneau) {
      var g = creneaux(i.mode)[+i.creneau.split('|')[0]];
      if (g && g.s && g.s.debut >= 900) err.push('Les formules du midi ne sont servies qu’au service du midi : choisissez une heure le midi, ou retirez-les.');
    }
    var a = $('[data-alerte]');
    a.hidden = !err.length; a.textContent = err[0] || '';
    return !err.length;
  }

  /* 3. Le recapitulatif, puis le paiement. */
  function libelleCreneau() {
    var c = etat.infos.creneau || '', g = creneaux(etat.infos.mode)[+c.split('|')[0]];
    if (!g) return '';
    return c.split('|')[1] === 'asap' ? 'Dès que possible' : g.nom + ' à ' + H.hm(+c.split('|')[1]);
  }
  function rendreRecap() {
    var i = etat.infos, total = sousTotal() + frais();
    titre.textContent = 'Votre commande';
    corps.innerHTML =
      '<div class="recap"><small>' + (i.mode === 'livraison' ? 'Livraison' : 'À emporter') + '</small><b>' + esc(libelleCreneau()) + '</b>' +
      (i.mode === 'livraison' ? '<span>' + esc(i.adresse) + ', ' + esc(i.cp) + ' ' + esc(i.ville) + '</span>' : '<span>1 bis rue Porte Olivier, place de la Madeleine</span>') + '</div>' +
      '<div class="recap"><small>Vos coordonnées</small><span>' + esc(i.nom) + ' · ' + esc(i.tel) + '</span>' + (i.commentaire ? '<span>« ' + esc(i.commentaire) + ' »</span>' : '') + '</div>' +
      '<div class="recap"><small>' + nbArticles() + ' article' + (nbArticles() > 1 ? 's' : '') + '</small><div class="recap-lignes">' +
      etat.panier.map(function (l) { var p = CARTE[l.id]; return '<div><span>' + l.qte + ' × ' + esc(p.n) + (l.choix ? ' (' + esc(l.choix) + ')' : '') + '</span><span>' + euros(p.p * l.qte) + '</span></div>'; }).join('') + '</div></div>';
    if (CFG.paiement === 'stripe') {
      var especes = i.reglement === 'especes';
      corps.insertAdjacentHTML('beforeend', '<div class="reglements" role="radiogroup" aria-label="Paiement">' +
        '<button type="button" class="reglement' + (especes ? '' : ' actif') + '" data-reglement="ligne" role="radio" aria-checked="' + !especes + '"><b>Payer en ligne</b><small>Carte, Apple Pay, Google Pay</small></button>' +
        '<button type="button" class="reglement' + (especes ? ' actif' : '') + '" data-reglement="especes" role="radio" aria-checked="' + especes + '"><b>Payer sur place</b><small>' + (i.mode === 'livraison' ? 'À la livraison' : 'Au comptoir, en récupérant la commande') + '</small></button></div>');
      if (especes) {
        // En especes ou par carte, au comptoir ou au livreur (Rokib, 27/10) : la cuisine le voit sur la commande.
        corps.insertAdjacentHTML('beforeend', '<div class="especes-note"><b>Vous réglez ' + euros(total) + ' sur place</b>' +
          '<div class="segment" role="radiogroup" aria-label="Comment réglez-vous ?">' +
          '<label><input type="radio" name="moyen" value="especes"' + (i.moyen === 'especes' ? ' checked' : '') + '><span>En espèces</span></label>' +
          '<label><input type="radio" name="moyen" value="carte"' + (i.moyen === 'carte' ? ' checked' : '') + '><span>Par carte bancaire</span></label></div>' +
          '<p>' + (i.mode === 'livraison' ? 'Au livreur, à la livraison.' : 'Au comptoir, quand vous récupérez votre commande.') + ' La commande part en cuisine dès que vous la validez.</p></div><p class="alerte" data-alerte-paiement hidden></p>');
        pied.innerHTML = totaux() + '<button type="button" class="bouton bouton-or" data-especes>' + ICO.sac + ' Valider ma commande</button>';
        return;
      }
      corps.insertAdjacentHTML('beforeend', '<div class="paiement-stripe" data-ps><p class="ps-attente">Préparation du paiement sécurisé…</p></div><p class="alerte" data-alerte-paiement hidden></p>');
      pied.innerHTML = totaux() + '<button type="button" class="bouton bouton-or" data-payer disabled>' + ICO.cadenas + ' Payer ' + euros(total) + '</button>' +
        '<p class="securite">' + ICO.cadenas + ' Paiement sécurisé par Stripe · CB, Visa, Mastercard, Apple Pay, Google Pay</p>';
      preparerPaiement();
      return;
    }
    var libelle = CFG.paiement === 'sur_place' ? 'Envoyer ma commande · ' + euros(total) : 'Payer ' + euros(total) + ' par carte';
    pied.innerHTML = totaux() + '<button type="button" class="bouton bouton-or" data-payer>' + (CFG.paiement === 'sur_place' ? ICO.sac : ICO.cadenas) + ' ' + libelle + '</button>' +
      (CFG.paiement === 'sur_place' ? '<p class="securite">Réglé à la livraison ou au retrait.</p>' : '<p class="securite">' + ICO.cadenas + ' Paiement sécurisé par Stripe · Visa, Mastercard, CB, Apple Pay</p>');
  }

  /* L'apercu : rien ne part. On montre ce qui se passera. */
  function rendreApercu() {
    titre.textContent = 'Aperçu';
    corps.innerHTML = '<div class="apercu-note"><b>Ici s’ouvre le paiement sécurisé</b>' +
      '<p>Ce site est un aperçu : aucune commande n’est envoyée et rien n’est débité. Une fois le site en ligne, ce bouton fera ceci :</p>' +
      '<ol><li>le client paie ' + euros(sousTotal() + frais()) + ' par carte sur la page sécurisée Stripe ;</li>' +
      '<li>l’argent arrive directement sur le compte du restaurant ;</li>' +
      '<li>la commande payée s’affiche sur la tablette en cuisine, avec une notification ;</li>' +
      '<li>le client suit sa commande en direct : acceptée, en préparation, en route.</li></ol></div>';
    pied.innerHTML = '<button type="button" class="bouton bouton-ligne" data-fermer-panier>Fermer l’aperçu</button>';
  }

  function payload() {
    var i = etat.infos;
    return {
      client_id: LW.clientId,
      panier: etat.panier.map(function (l) { return { produit_id: l.id, quantite: l.qte, choix: l.choix }; }),
      mode: i.mode,
      creneau: libelleCreneau(),
      nom_client: i.nom,
      telephone_client: i.tel,
      adresse_livraison: i.mode === 'livraison' ? i.adresse + ', ' + i.cp + ' ' + i.ville : null,
      commentaire: i.commentaire || '',
    };
  }
  function appeler(fonction, corpsJson) {
    return fetch(LW.supabaseUrl + '/functions/v1/' + fonction, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: LW.supabaseAnonKey, Authorization: 'Bearer ' + LW.supabaseAnonKey },
      body: JSON.stringify(corpsJson),
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Erreur'); return j; }); });
  }
  var PAIEMENT = null, stripeJs = null;
  function chargerStripe() {
    if (window.Stripe) return Promise.resolve();
    if (!stripeJs) stripeJs = new Promise(function (ok, ko) {
      var sc = document.createElement('script'); sc.src = 'https://js.stripe.com/v3/'; sc.onload = ok;
      sc.onerror = function () { stripeJs = null; ko(new Error('Le module de paiement n’a pas pu se charger. Vérifiez votre connexion.')); };
      document.head.appendChild(sc);
    });
    return stripeJs;
  }
  function alertePaiement(t) { var a = $('[data-alerte-paiement]'); if (a) { a.hidden = !t; a.textContent = t || ''; } }
  function appareil() {
    var a; try { a = localStorage.getItem('nikkie-appareil'); } catch (x) {}
    if (!a) { a = 'a' + Math.random().toString(36).slice(2) + Date.now().toString(36); try { localStorage.setItem('nikkie-appareil', a); } catch (x) {} }
    return a;
  }
  // L'heure choisie, en vraie date (null = des que possible).
  function creneauIso() {
    var c = etat.infos.creneau || '', g = creneaux(etat.infos.mode)[+c.split('|')[0]];
    if (!g || c.split('|')[1] === 'asap') return null;
    var d = new Date(g.s.jour); d.setMinutes(+c.split('|')[1]); return d.toISOString();
  }
  function demande() {
    var i = etat.infos;
    return { action: 'payer', appareil: appareil(), mode: i.mode, adresse: i.adresse || '', cp: i.cp || '', ville: i.ville || '',
      nom: i.nom, telephone: i.tel, note: i.commentaire || '', creneau: creneauIso(),
      lignes: etat.panier.map(function (l) { return { id: l.id, choix: l.choix, qte: l.qte }; }) };
  }
  function appelNs(corpsJson) {
    return fetch(LW.supabaseUrl + '/functions/v1/ns-commande', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpsJson) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.refus || j.error || 'Le serveur ne répond pas. Réessayez dans un instant.'); return j; }); });
  }
  function preparerPaiement() {
    var d = demande(), cle = JSON.stringify(d);
    var suite = PAIEMENT && PAIEMENT.cle === cle ? Promise.resolve(PAIEMENT.rep) : appelNs(d).then(function (rep) { PAIEMENT = { cle: cle, rep: rep }; return rep; });
    suite.then(function (rep) { return chargerStripe().then(function () { monter(rep); }); })
      .catch(function (e) { var z = $('[data-ps]'); if (z) z.innerHTML = ''; alertePaiement(e.message); });
  }
  function monter(rep) {
    var zone = $('[data-ps]'); if (!zone) return;
    var st = window.Stripe(CFG.stripePk, rep.stripe_account ? { stripeAccount: rep.stripe_account } : {});
    var el = st.elements({
      clientSecret: rep.client_secret, locale: 'fr',
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600&display=swap' }],
      appearance: { theme: 'night', variables: { colorPrimary: '#d6b264', colorBackground: '#1c1814', colorText: '#f1e9db', colorDanger: '#e0584f', fontFamily: 'Albert Sans, sans-serif', borderRadius: '12px', spacingUnit: '4px' } },
    });
    var pe = el.create('payment', { layout: { type: 'tabs' }, wallets: { applePay: 'auto', googlePay: 'auto' } });
    zone.innerHTML = ''; pe.mount(zone);
    PAIEMENT.stripe = st; PAIEMENT.elements = el;
    pe.on('ready', function () { var b = $('[data-payer]'); if (b) b.disabled = false; });
  }
  function payerStripe(b) {
    var rep = PAIEMENT && PAIEMENT.rep; if (!rep || !PAIEMENT.stripe) return;
    var libelle = b.innerHTML; b.disabled = true; b.textContent = 'Paiement en cours…'; alertePaiement('');
    try { sessionStorage.setItem('nikkie-paiement', JSON.stringify({ compte: rep.stripe_account, secret: rep.client_secret, commande: rep.commande })); } catch (x) {}
    PAIEMENT.stripe.confirmPayment({ elements: PAIEMENT.elements, redirect: 'if_required', confirmParams: { return_url: location.origin + location.pathname + '?paiement=retour' } })
      .then(function (r) {
        if (r.error) { b.disabled = false; b.innerHTML = libelle; alertePaiement(r.error.message || 'Le paiement n’est pas passé.'); return; }
        if (['succeeded', 'processing', 'requires_capture'].indexOf(r.paymentIntent.status) >= 0) { PAIEMENT = null; confirmation(rep.commande); }
        else { b.disabled = false; b.innerHTML = libelle; alertePaiement('Le paiement n’est pas terminé. Réessayez.'); }
      });
  }
  function validerEspeces(b) {
    var moyen = etat.infos.moyen;
    if (moyen !== 'especes' && moyen !== 'carte') { alertePaiement('Dites-nous comment vous réglez sur place : en espèces ou par carte bancaire.'); return; }
    b.disabled = true; b.textContent = 'Envoi au restaurant…'; alertePaiement('');
    appelNs(Object.assign(demande(), { mode_paiement: 'especes', moyen_sur_place: moyen }))
      .then(function (rep) { PAIEMENT = null; confirmation(rep.commande, true); })
      .catch(function (e) { b.disabled = false; b.innerHTML = ICO.sac + ' Valider ma commande'; alertePaiement(e.message); });
  }
  // La commande est payee (ou a regler en especes) : elle part en cuisine ; le client voit le recapitulatif.
  function confirmation(c, especes) {
    var h = new Date(c.heure_prevue), hmn = h.getHours() + 'h' + String(h.getMinutes()).padStart(2, '0');
    etat.panier = []; garder(); majBarre();
    ecran = 'fini'; titre.textContent = especes ? 'Commande envoyée' : 'Commande payée'; retour.hidden = true; bandeau.hidden = true;
    corps.innerHTML = '<div class="confirme"><div class="confirme-ok" aria-hidden="true">✓</div><p class="confirme-num">Commande n° ' + c.numero + '</p>' +
      '<h3>' + (c.mode === 'livraison' ? 'Livrée vers ' : 'Prête à ') + hmn + '</h3>' +
      '<p>' + (c.mode === 'livraison' ? 'Le livreur vous appelle en arrivant.' + (especes ? '' : ' Rien à régler à la porte : c’est déjà payé.') : 'À récupérer au 1 bis rue Porte Olivier, place de la Madeleine. Donnez votre numéro au comptoir.') + '</p>' +
      '<p class="confirme-total">' + (especes ? 'À régler sur place' + (c.moyen_sur_place === 'carte' ? ' par carte bancaire' : c.moyen_sur_place === 'especes' ? ' en espèces' : '') + ' : ' : 'Payé : ') + euros(c.total_cents / 100) + '</p></div>';
    pied.innerHTML = '<button type="button" class="bouton bouton-ligne" data-fermer-panier>Fermer</button>';
  }
  // Retour d'une banque (3D Secure avec redirection).
  (function retourBanque() {
    if (!/[?&]paiement=retour/.test(location.search) || CFG.paiement !== 'stripe') return;
    var s0; try { s0 = JSON.parse(sessionStorage.getItem('nikkie-paiement') || 'null'); } catch (x) {}
    var q = new URLSearchParams(location.search);
    history.replaceState(null, '', location.pathname);
    if (!s0) return;
    chargerStripe().then(function () {
      return window.Stripe(CFG.stripePk, s0.compte ? { stripeAccount: s0.compte } : {}).retrievePaymentIntent(q.get('payment_intent_client_secret') || s0.secret);
    }).then(function (r) {
      if (r.paymentIntent && ['succeeded', 'processing'].indexOf(r.paymentIntent.status) >= 0) { ouvrir('panier'); setTimeout(function () { confirmation(s0.commande); }, 120); }
      else toast('Le paiement n’est pas passé : votre panier vous attend.');
    }).catch(function () {});
  })();

  function payer(bouton) {
    if (CFG.paiement === 'stripe') { payerStripe(bouton); return; }
    if (CFG.paiement === 'apercu') { ecran = 'apercu'; rendre(); return; }
    bouton.disabled = true;
    var p = payload(), ici = location.href.split('#')[0];
    var envoi = CFG.paiement === 'stripe'
      ? appeler('create-checkout-session', Object.assign(p, { success_url: CFG.racine ? new URL(CFG.racine + 'suivi/', ici).href : ici, cancel_url: ici }))
        .then(function (j) { location.href = j.url; })
      : appeler(p.mode === 'livraison' ? 'create-commande-livraison' : 'create-commande-retrait', p).then(function () {
        etat.panier = []; garder(); majBarre();
        corps.innerHTML = '<div class="panier-vide"><b>Commande envoyée</b>Merci ! Le restaurant vous rappelle si besoin au ' + esc(p.telephone_client) + '.</div>';
        pied.innerHTML = '<button type="button" class="bouton bouton-ligne" data-fermer-panier>Fermer</button>';
      });
    envoi.catch(function (e) { bouton.disabled = false; toast(e.message === 'Erreur' ? 'Envoi impossible, appelez le 07 50 65 01 24.' : e.message); });
  }

  pied.addEventListener('click', function (e) {
    if (e.target.closest('[data-suite]')) {
      if (ecran === 'panier') { ecran = 'infos'; rendre(); return; }
      if (ecran === 'infos') { lireForm(); if (verifier()) { ecran = 'recap'; rendre(); } return; }
    }
    var es = e.target.closest('[data-especes]');
    if (es && !es.disabled) { validerEspeces(es); return; }
    var b = e.target.closest('[data-payer]');
    if (b && !b.disabled) payer(b);
  });
  corps.addEventListener('input', function (e) { if (e.target.closest('[data-form]')) lireForm(); });
  corps.addEventListener('click', function (e) {
    var r = e.target.closest('[data-reglement]'); if (!r) return;
    etat.infos.reglement = r.getAttribute('data-reglement'); garder(); rendre();
  });
  corps.addEventListener('change', function (e) {
    if (e.target.name === 'creneau') lireForm();
    if (e.target.name === 'moyen') { etat.infos.moyen = e.target.value; garder(); alertePaiement(''); }
  });
})();
