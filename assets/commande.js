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
  function majBandeau() {
    var d = new Date(), s = H.services(d, 1)[0];
    if (s && s.enCours) { bandeau.hidden = true; return; }
    bandeau.hidden = false;
    bandeau.innerHTML = s ? '<b>Fermé en ce moment.</b> Nous ouvrons ' + H.quand(s, d) + ' à ' + H.hm(s.debut) + ' : vous pouvez déjà commander pour ce service.' : '<b>Fermé.</b> Appelez-nous pour commander.';
  }

  function rendre() {
    majBandeau();
    retour.hidden = ecran === 'panier';
    if (!etat.panier.length) ecran = 'panier';
    if (ecran === 'panier') rendrePanier();
    else if (ecran === 'infos') rendreInfos();
    else if (ecran === 'recap') rendreRecap();
    else if (ecran === 'apercu') rendreApercu();
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
  function creneaux(mode) {
    var d = new Date(), now = d.getHours() * 60 + d.getMinutes();
    var delai = (mode === 'livraison' ? CFG.livraison.delaiMin : CFG.retrait.delaiMin), pas = CFG.pas || 15;
    return H.services(d, 3).map(function (s) {
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
      return '<optgroup label="' + esc(g.nom) + '">' + (g.asap && gi === 0 ? '<option value="' + gi + '|asap">Dès que possible (≈ ' + (i.mode === 'livraison' ? CFG.livraison.delaiMin : CFG.retrait.delaiMin) + ' min)</option>' : '') +
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
    if (!groupes.length) { sel.outerHTML = '<p class="alerte">Pas de créneau disponible en ligne pour le moment : appelez-nous.</p>'; }
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
      if (g && g.s.debut >= 900) err.push('Les formules du midi ne sont servies qu’au service du midi : choisissez une heure le midi, ou retirez-les.');
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
  function payer(bouton) {
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
    var b = e.target.closest('[data-payer]');
    if (b) payer(b);
  });
  corps.addEventListener('input', function (e) { if (e.target.closest('[data-form]')) lireForm(); });
  corps.addEventListener('change', function (e) { if (e.target.name === 'creneau') lireForm(); });
})();
