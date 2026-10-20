/* ===================================================================
   Nikkie Sushi — l'espace pro (LocWeb, 2026-10-17)
   Meme schema technique que la tablette Cuisine d'Nikkie Sushi, recopie a
   part (fonctions ns-*, jamais deux clients relies). UN seul espace : le
   cuisinier est aussi le gerant. Commandes en direct (sonnerie, ticket
   imprime tout seul), remises et livraisons du jour, pause, plats
   epuises, ventes et remboursements, fermetures, reglages, aide.
   =================================================================== */
(function () {
  'use strict';
  var CFG = window.LOCWEB_CONFIG || {};
  var FN = CFG.supabaseUrl + '/functions/v1/ns-espace';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var euros = function (c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; };
  var hm = function (d) { d = new Date(d); return d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0'); };
  var lire = function (k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  var session = lire('ns-espace', null);         // {jeton, snack}
  // Impression des tickets COUPEE (Nicolas, 20/10) : pas de bouton, pas de ticket
  // automatique, pas de reglage d'imprimante. Tout le code reste en dessous :
  // passer IMPRESSION a true pour la rebrancher chez un client qui la veut.
  var IMPRESSION = false;
  var APPLI = IMPRESSION && !!(window.LocWebImprimante && window.LocWebImprimante.version);
  // Par defaut : l'appli si on est dedans, sinon rien (on regarde seulement).
  var reglage = lire('ns-espace-reglage', { impression: APPLI ? 'a-choisir' : 'aucune', son: true, ip: '', port: 9100 });
  if (reglage.impression === 'rawbt') reglage.impression = APPLI ? 'appli' : 'aucune';
  if (!IMPRESSION) reglage.impression = 'aucune';
  var donnees = { commandes: [], snack: null, carte: [] };
  var imprimees = {};                               // deja envoyees cette session (evite les doublons)
  var canal = null, client = null, minuteur = null, horsLigne = false;

  function appel(action, extra) {
    var corps = Object.assign({ action: action, jeton: session && session.jeton }, extra || {});
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401 && action !== 'connexion') { deconnecter(); throw new Error(j.refus || 'Reconnecte-toi.'); }
          if (!r.ok) throw new Error(j.refus || j.error || 'Erreur serveur');
          return j;
        });
      });
  }

  /* ---------------- connexion ---------------- */
  function ecranCode(msg) {
    document.body.className = 'cuisine-code';
    $('#app').innerHTML = '<form class="code" data-code><div class="code-logo">' + document.querySelector('[data-logo]').innerHTML + '</div>' +
      '<h1>Espace pro</h1><p>Tape ton code à 8 chiffres.</p>' +
      '<input inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="••••••••" data-code-champ aria-label="Code">' +
      '<button class="bouton bouton-feu" type="submit">Entrer</button><p class="code-err" data-code-err>' + esc(msg || '') + '</p></form>';
    var f = $('[data-code]'), c = $('[data-code-champ]');
    c.focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = c.value.replace(/\D/g, '');
      if (v.length !== 8) { $('[data-code-err]').textContent = 'Le code fait 8 chiffres.'; return; }
      $('[data-code-err]').textContent = 'Vérification…';
      appel('connexion', { code: v }).then(function (j) {
        session = { jeton: j.jeton, snack: { nom: j.nom || 'Nikkie Sushi' } }; ecrire('ns-espace', session); demarrer();
      }).catch(function (e) { $('[data-code-err]').textContent = e.message; c.select(); });
    });
  }
  function deconnecter() { session = null; try { localStorage.removeItem('ns-espace'); } catch (e) {} if (canal) { client.removeChannel(canal); canal = null; } clearTimeout(minuteur); ecranCode(); }

  /* ---------------- l'ecran ---------------- */
  function demarrer() {
    document.body.className = 'cuisine';
    $('#app').innerHTML =
      '<aside class="cu-menu">' +
        '<div class="cu-marque"><div class="cu-logo">' + document.querySelector('[data-logo]').innerHTML + '</div>' +
          '<div><small>Espace pro</small><h1>' + esc(session.snack.nom) + '</h1><span class="cu-etat" data-etat>Connexion…</span></div></div>' +
        '<nav class="cu-cartes" aria-label="Menu de la cuisine">' +
          carteMenu('data-vue="commandes"', 'commandes', 'Commandes') +
          carteMenu('data-vue="remises"', 'remises', 'Remises et livraisons') +
          carteMenu('data-pause', 'pause', 'Pause') +
          carteMenu('data-epuises', 'epuises', 'Plats épuisés') +
          carteMenu('data-vue="ventes"', 'ventes', 'Ventes') +
          carteMenu('data-fermetures', 'fermetures', 'Fermetures') +
          carteMenu('data-reglages', 'reglages', 'Réglages') +
          carteMenu('data-aide', 'aide', 'Aide') +
          (APPLI || !IMPRESSION ? '' : carteMenu('data-installer', 'installer', 'Installer l’appli')) +
          carteMenu('data-appliquer hidden', 'maj', 'Mise à jour prête') +
        '</nav></aside>' +
      '<main class="cu-zone">' +
        '<p class="cu-alerte" data-alerte hidden></p>' +
        '<div class="cu-colonnes" data-ecran="commandes">' +
          '<section><h2>À préparer <span data-n-recue></span></h2><div data-col="recue"></div></section>' +
          '<section><h2>Prêtes <span data-n-prete></span></h2><div data-col="prete"></div></section></div>' +
        '<section class="cu-remises" data-ecran="remises" hidden><h2>Remises et livrées aujourd’hui <span data-n-remise></span></h2><div data-col="remise"></div></section>' +
        '<section class="ns-ventes" data-ecran="ventes" hidden>' +
          '<div class="ge-tete"><h2>Ventes</h2><div class="ge-periode" role="group" aria-label="Période">' + [['jour', 'Aujourd’hui'], ['hier', 'Hier'], ['7', '7 jours'], ['mois', 'Ce mois']].map(function (p) { return '<button type="button" class="cu-bouton cu-discret" data-per="' + p[0] + '">' + p[1] + '</button>'; }).join('') +
          '<button type="button" class="cu-bouton" data-export>Export Excel</button></div></div>' +
          '<p class="ge-test" data-mode-test hidden><b>Mode test</b> : les paiements sont simulés, aucun argent réel n’est encaissé.</p>' +
          '<div class="ge-kpi" data-kpi></div><div class="ge-table-zone"><table class="ge-table" data-cmds></table></div></section>' +
      '</main>' +
      '<div class="cu-voile" data-voile hidden></div><div class="cu-panneau" data-panneau hidden></div>';
    montrer(vue);
    rafraichir();
    boucle(); // signe de vie + filet de securite
    clearInterval(minuteurVersion); minuteurVersion = setInterval(verifierPage, 30 * 60000);
    if (reglage.impression === 'a-choisir') setTimeout(panneauRole, 600);
    else if (APPLI && principale() && window.LocWebImprimante.chercher && !reglage.ip) setTimeout(function () { panneauRecherche(); }, 800);
    ecouter();
    garderEcranAllume();
  }

  // Le menu de gauche : des petites cartes (icone, nom, et ce qu'il y a dedans).
  var ICONES = {
    commandes: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    ventes: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    fermetures: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m10 14 4 4M14 14l-4 4"/>',
    remises: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/><path d="m9.5 14 2 2 3.5-3.5"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    epuises: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    reglages: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    aide: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><path d="M12 17.5v.01"/>',
    installer: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    maj: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'
  };
  function carteMenu(attr, cle, nom) {
    return '<button type="button" class="cu-carte" ' + attr + ' data-carte="' + cle + '">' +
      '<span class="cu-ico" aria-hidden="true"><svg viewBox="0 0 24 24">' + ICONES[cle] + '</svg></span>' +
      '<span class="cu-carte-txt"><b data-c-nom>' + nom + '</b><small data-c-sous></small></span></button>';
  }
  function sousCarte(cle, t, nom) {
    var c = $('[data-carte="' + cle + '"]'); if (!c) return null;
    c.querySelector('[data-c-sous]').textContent = t;
    if (nom) c.querySelector('[data-c-nom]').textContent = nom;
    return c;
  }
  function majMenu() {
    var n = { recue: 0, prete: 0, remise: 0 };
    donnees.commandes.forEach(function (c) { if (n[c.statut] != null) n[c.statut]++; });
    sousCarte('commandes', n.recue + ' à préparer · ' + n.prete + ' prête' + (n.prete > 1 ? 's' : ''));
    sousCarte('remises', n.remise ? n.remise + ' aujourd’hui' : 'Aucune pour l’instant');
    var pause = donnees.snack && donnees.snack.pause;
    var cp = sousCarte('pause', pause ? 'Touche pour reprendre' : 'Commandes ouvertes', pause ? 'En pause' : 'Pause');
    if (cp) cp.classList.toggle('cu-carte-alerte', !!pause);
    var ep = ((donnees.snack || {}).epuises || []).length;
    sousCarte('epuises', ep ? ep + ' plat' + (ep > 1 ? 's' : '') + ' retiré' + (ep > 1 ? 's' : '') : 'Tout est disponible');
    if (!IMPRESSION) sousCarte('reglages', 'Sonnerie : ' + (reglage.son ? 'activée' : 'coupée'));
    else sousCarte('reglages', reglage.impression === 'appli' ? (reglage.ip ? 'Imprime sur ' + reglage.ip : 'Imprimante à choisir')
      : reglage.impression === 'navigateur' ? 'Imprime depuis ce PC' : reglage.impression === 'a-choisir' ? 'À régler' : 'Regarde seulement');
    sousCarte('aide', 'Que faire si…');
    var nf = ((donnees.snack || {}).fermetures || []).filter(function (f) { return Date.parse(f.au) > Date.now(); }).length;
    sousCarte('fermetures', nf ? nf + ' prévue' + (nf > 1 ? 's' : '') : 'Aucune prévue');
    if (!ventes) sousCarte('ventes', 'Chiffre d’affaires, remboursements');
    sousCarte('installer', 'Pour la tablette Android');
    sousCarte('maj', 'Touche pour l’appliquer');
  }
  // Deux ecrans : les commandes en cours, et les remises du jour (sur demande).
  var vue = 'commandes';
  function montrer(v) {
    vue = v;
    document.querySelectorAll('[data-ecran]').forEach(function (e) { e.hidden = e.getAttribute('data-ecran') !== v; });
    document.querySelectorAll('[data-vue]').forEach(function (b) { b.classList.toggle('cu-carte-on', b.getAttribute('data-vue') === v); });
  }

  // Le direct : un message sur le canal du restaurant = « va voir, il y a du nouveau ».
  function ecouter() {
    if (!window.supabase || !donnees.snack) return;
    if (!client) client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: false } });
    if (canal) client.removeChannel(canal);
    canal = client.channel('ns-espace-' + donnees.snack.canal)
      .on('broadcast', { event: 'commande' }, function () { rafraichir(); })
      .subscribe(function (st) { canalOk = st === 'SUBSCRIBED'; horsLigne = !canalOk; majEtat(); if (canalOk) rafraichir(); boucle(); });
  }

  // Quota Supabase (il doit tenir 100 clients) : le direct (Realtime) apporte les
  // commandes et ne compte pas dans les appels. L'appel regulier n'est qu'un
  // signe de vie, et SEULE la tablette principale (celle qui imprime) le fait :
  // 5 min quand le direct marche, 1 min sinon. Un telephone ou un ordi qui
  // regarde ne fait aucun appel regulier ; une page cachee non plus.
  var canalOk = false, minuteurVersion = null;
  function principale() { return reglage.impression === 'appli' || reglage.impression === 'navigateur'; }
  function boucle() {
    clearTimeout(minuteur);
    var delai = (principale() || !IMPRESSION) ? (canalOk && !horsLigne ? 5 * 60000 : 60000) : (canalOk ? 0 : 2 * 60000);
    if (!delai) return;
    minuteur = setTimeout(function () {
      if (document.hidden && !principale()) { boucle(); return; }
      rafraichir().then(boucle, boucle);
    }, delai);
  }
  // On rouvre la page (telephone sorti de la poche) : une mise a jour, une seule.
  document.addEventListener('visibilitychange', function () { if (!document.hidden && session && donnees.snack) rafraichir(); });
  function rafraichir() {
    return appel('commandes', { principal: principale() || !IMPRESSION }).then(function (j) {
      var avant = {}; donnees.commandes.forEach(function (c) { avant[c.id] = 1; });
      var premiere = !donnees.snack;
      donnees = j; horsLigne = false;
      if (premiere) { ecouter(); setTimeout(majAuLancement, 3000); }
      var nouvelles = j.commandes.filter(function (c) { return !avant[c.id] && c.statut === 'recue'; });
      if (nouvelles.length && !premiere) { sonner(); if (vue !== 'commandes') montrer('commandes'); }
      afficher();
      imprimerEnAttente();
    }).catch(function (e) { horsLigne = true; majEtat(e.message); });
  }

  function majEtat(msg) {
    var e = $('[data-etat]'); if (!e) return;
    var pause = donnees.snack && donnees.snack.pause;
    e.textContent = horsLigne ? 'Hors ligne' : pause ? 'En pause' : 'En ligne';
    e.className = 'cu-etat ' + (horsLigne ? 'cu-rouge' : pause ? 'cu-jaune' : 'cu-vert');
    majMenu();
    var a = $('[data-alerte]');
    var nonImp = IMPRESSION ? donnees.commandes.filter(function (c) { return !c.imprimee_le && c.statut === 'recue'; }).length : 0;
    var t = horsLigne ? 'Connexion perdue : les commandes arrivent quand même, elles s’afficheront au retour du réseau.' + (msg ? ' (' + msg + ')' : '')
      : nonImp ? (alerteImp || nonImp + ' ticket' + (nonImp > 1 ? 's' : '') + ' non imprimé' + (nonImp > 1 ? 's' : '') + ' : vérifie l’imprimante (papier, câble), puis « Réimprimer ».') : '';
    a.hidden = !t; a.textContent = t;
  }

  function afficher() {
    var cols = { recue: [], prete: [], remise: [] };
    donnees.commandes.forEach(function (c) { if (cols[c.statut]) cols[c.statut].push(c); });
    Object.keys(cols).forEach(function (k) {
      var l = cols[k];
      if (k === 'remise') l = l.slice().reverse().slice(0, 30);
      $('[data-col="' + k + '"]').innerHTML = l.map(carte).join('') || '<p class="cu-vide">Rien pour l’instant.</p>';
      $('[data-n-' + k + ']').textContent = l.length ? '(' + l.length + ')' : '';
    });
    majEtat();
  }
  function carte(c) {
    var rb = c.paiement === 'sur_place' ? '<span class="cu-badge cu-a-payer">Sur place · ' + euros(c.total_cents) + '</span>' : c.paiement === 'remboursee' ? '<span class="cu-badge cu-rouge">Remboursée</span>' : c.paiement === 'remboursee_partiel' ? '<span class="cu-badge cu-jaune">Remb. ' + euros(c.rembourse_cents) + '</span>' : '<span class="cu-badge cu-vert">Payée</span>';
    return '<article class="cu-cmd' + (c.imprimee_le || !IMPRESSION ? '' : ' cu-non-imp') + '" data-id="' + c.id + '">' +
      '<div class="cu-cmd-tete"><b class="cu-num">N° ' + c.numero + '</b><span class="cu-heure">' + (c.creneau ? 'Programmée · ' : '') + (c.mode === 'livraison' ? 'À livrer à <b>' : 'À remettre à <b>') + hm(c.heure_prevue) + '</b></span>' + rb + '</div>' +
      '<p class="cu-client">' + esc(c.nom) + ' · <a href="tel:' + esc(c.telephone) + '">' + esc(c.telephone) + '</a></p>' +
      (c.mode === 'livraison' ? '<p class="cu-mode cu-livraison"><b>Livraison</b> · ' + esc(c.adresse || '') + '</p>' : '<p class="cu-mode"><b>À emporter</b></p>') +
      '<ul class="cu-lignes">' + c.lignes.map(function (l) { return '<li><b>' + l.qte + ' × ' + esc(l.n) + '</b>' + (l.resume ? '<span>' + esc(l.resume) + '</span>' : '') + '</li>'; }).join('') + '</ul>' +
      (c.note ? '<p class="cu-note">« ' + esc(c.note) + ' »</p>' : '') +
      '<div class="cu-actions">' +
        (c.statut === 'recue' ? '<button type="button" class="cu-bouton cu-feu" data-statut="prete">Prête</button>' : '') +
        (c.statut === 'prete' ? '<button type="button" class="cu-bouton cu-feu" data-statut="remise">' + (c.mode === 'livraison' ? 'Partie en livraison' : 'Remise au client') + '</button><button type="button" class="cu-bouton cu-discret" data-statut="recue">Pas prête</button>' : '') +
        (c.statut === 'remise' ? '<button type="button" class="cu-bouton cu-discret" data-statut="prete">Pas encore remise</button>' : '') +
        (c.paiement === 'sur_place' && c.statut !== 'remise' ? '<button type="button" class="cu-bouton cu-discret" data-statut="annulee">Pas venu</button>' : '') +
        (IMPRESSION ? '<button type="button" class="cu-bouton cu-discret" data-reimprimer>' + (c.imprimee_le ? 'Réimprimer' : 'Imprimer') + '</button>' : '') +
        '<span class="cu-total">' + euros(c.total_cents) + '</span></div></article>';
  }

  /* ---------------- l'impression ---------------- */
  function imprimerEnAttente() {
    if (!IMPRESSION || !principale()) return;
    donnees.commandes.filter(function (c) { return c.statut === 'recue' && !c.imprimee_le && !imprimees[c.id] && c.paiement !== 'remboursee'; })
      .forEach(function (c, n) { setTimeout(function () { imprimer(c); }, n * 1500); });
  }
  // Automatique : la tablette « prend » d'abord la commande au serveur ; si un autre
  // appareil l'a deja prise, elle n'imprime pas (jamais de ticket en double).
  // Reimprimer (force) : imprime tout de suite, sans prendre.
  function imprimer(c, force) {
    if (!principale() && !force) return;
    imprimees[c.id] = true;
    (force ? Promise.resolve({ pris: true }) : appel('prendre', { id: c.id })).then(function (r) {
      if (!r.pris) { c.imprimee_le = c.imprimee_le || new Date().toISOString(); afficher(); return; }
      var fait = reglage.impression === 'appli' ? viaAppli(c) : viaNavigateur(c);
      if (fait === true) {
        c.imprimee_le = new Date().toISOString();
        if (force) appel('imprimee', { id: c.id }).catch(function () {});
        if (!donnees.commandes.some(function (x) { return x.statut === 'recue' && !x.imprimee_le; })) alerteImp = '';
        afficher(); return;
      }
      imprimees[c.id] = false; c.imprimee_le = null;
      if (!force) appel('liberer', { id: c.id }).catch(function () {});
      afficher();
    }).catch(function () { imprimees[c.id] = false; });
  }

  // Le ticket en texte (80 mm = 48 caracteres), avec quelques commandes ESC/POS.
  function ticketTexte(c) {
    var ESC = '\x1b', GS = '\x1d', L = 48;
    var sans = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[×]/g, 'x').replace(/[«»]/g, '"').replace(/[^\x20-\x7e]/g, ''); };
    var couper = function (s, larg) { var out = [], m = sans(s).split(' '), l = ''; m.forEach(function (w) { if ((l + ' ' + w).trim().length > larg) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); }); if (l) out.push(l); return out; };
    var t = ESC + '@' + ESC + 'a1' + GS + '!' + '\x11' + 'N ' + c.numero + '\n' + GS + '!' + '\x00';
    t += ESC + 'E1' + (c.mode === 'livraison' ? 'A LIVRER A ' : 'A REMETTRE A ') + sans(hm(c.heure_prevue)) + '\n' + ESC + 'E0';
    t += (c.creneau ? 'Commande programmee\n' : '') + (c.mode === 'livraison' ? 'LIVRAISON\n' + couper(c.adresse || '', L).join('\n') : 'A EMPORTER') + '\n' + ESC + 'a0' + '-'.repeat(L) + '\n';
    c.lignes.forEach(function (l) {
      t += ESC + 'E1' + couper(l.qte + ' x ' + l.n, L).join('\n') + '\n' + ESC + 'E0';
      if (l.resume) t += couper(l.resume, L - 3).map(function (x) { return '   ' + x; }).join('\n') + '\n';
    });
    t += '-'.repeat(L) + '\n';
    if (c.note) t += ESC + 'E1' + 'NOTE : ' + ESC + 'E0' + couper(c.note, L - 7).join('\n') + '\n';
    t += sans(c.nom) + ' - ' + sans(c.telephone) + '\n' + (c.paiement === 'sur_place' ? ESC + 'a1' + GS + '!' + '\x11' + 'A PAYER SUR PLACE : ' + sans(euros(c.total_cents)) + '\n' + GS + '!' + '\x00' + ESC + 'a0' : 'PAYE EN LIGNE : ' + sans(euros(c.total_cents))) + '\n\n\n\n' + GS + 'V' + '\x42' + '\x00';
    return t;
  }
  // L'appli Android LocWeb envoie les octets ESC/POS a l'imprimante, port 9100, sans fenetre.
  function viaAppli(c) {
    if (!APPLI) return false;
    if (!reglage.ip) { majEtat(); alerteImpression('Indique l’adresse de l’imprimante dans Réglages.'); return false; }
    var r = window.LocWebImprimante.imprimer(reglage.ip, +reglage.port || 9100, btoa(ticketTexte(c)));
    if (r === 'ok') return true;
    if (r === 'papier') alerteImpression('Plus de papier dans l’imprimante : change la bobine, puis touche « Réimprimer » sur les commandes en rouge.');
    else if (r === 'papier-fin') alerteImpression('La bobine s’est terminée pendant le ticket N° ' + c.numero + ' : change-la, puis touche « Réimprimer ».');
    else if (r === 'capot') alerteImpression('Le capot de l’imprimante est ouvert : referme-le, puis touche « Réimprimer ».');
    else { alerteImpression('L’imprimante ne répond pas (éteinte, câble, ou nouvelle adresse).'); retrouverImprimante(); }
    return false;
  }
  // L'imprimante ne repond plus (la box a pu lui donner une nouvelle adresse) :
  // on relance la recherche, avec la preuve du ticket numerote. Au plus une fois
  // toutes les 10 minutes, et jamais par-dessus une autre fenetre.
  var dernierScan = 0;
  function retrouverImprimante() {
    if (!window.LocWebImprimante.chercher || Date.now() - dernierScan < 10 * 60000 || !$('[data-panneau]').hidden) return;
    dernierScan = Date.now();
    panneauRecherche();
  }
  /* Trouver la bonne imprimante (appli Android) :
     1. l'appli scanne le reseau et ne garde que les imprimantes a tickets
        (celles qui repondent a la demande d'etat ESC/POS ; les imprimantes
        de bureau sont ecartees sans rien leur envoyer) ;
     2. la preuve physique : chaque candidate imprime un ticket avec un gros
        numero, et la cuisine dit lequel est sorti CHEZ ELLE. */
  var CANDIDATES = [];
  function octetsNumero(n) {
    var ESC = '\x1b', GS = '\x1d';
    return ESC + '@' + ESC + 'a1' + GS + '!' + '\x11' + 'IMPRIMANTE\n' + GS + '!' + '\x77' + n + '\n' + GS + '!' + '\x00' +
      '\nSi ce ticket sort en CUISINE,\ntouche le numero ' + n + ' sur la tablette.\n\n\n\n' + GS + 'V' + '\x42' + '\x00';
  }
  function envoyerBrut(ip, octets) { return window.LocWebImprimante.imprimer(ip, 9100, btoa(octets)); }
  function panneauRecherche() {
    panneau('<h2>Trouver l’imprimante</h2><p>On cherche l’imprimante à tickets sur le réseau du restaurant… (quelques secondes)</p>' +
      '<span class="cu-attente" aria-hidden="true"></span><div class="cu-actions"><button type="button" class="cu-bouton cu-discret" data-fermer>Plus tard</button></div>');
    window.__agImprimantes = function (liste) {
      var tickets = liste.filter(function (x) { return x.ticket; });
      var muettes = liste.filter(function (x) { return !x.ticket && !x.bureau; });
      var bureau = liste.filter(function (x) { return x.bureau; });
      CANDIDATES = tickets.length ? tickets : muettes;   // si aucune ne repond, on essaie celles qui se taisent
      if (!CANDIDATES.length) {
        panneau('<h2>Aucune imprimante à tickets trouvée</h2><p>Vérifie que l’imprimante est <b>allumée</b> et reliée à la <b>box par un câble réseau</b>, et que la tablette est sur le <b>même Wi-Fi</b> que la box.</p>' +
          (bureau.length ? '<p>' + bureau.length + ' imprimante(s) de bureau trouvée(s), écartée(s).</p>' : '') +
          '<div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-chercher>Chercher encore</button><button type="button" class="cu-bouton cu-discret" data-fermer>Plus tard</button></div>');
        return;
      }
      CANDIDATES.forEach(function (c, i) { setTimeout(function () { envoyerBrut(c.ip, octetsNumero(i + 1)); }, i * 1200); });
      panneau('<h2>Quel ticket est sorti en cuisine ?</h2><p>' + (CANDIDATES.length > 1
          ? 'On a trouvé ' + CANDIDATES.length + ' imprimantes. Chacune vient d’imprimer un ticket avec un gros numéro. Touche le numéro du ticket sorti <b>dans la cuisine</b>.'
          : 'L’imprimante trouvée vient d’imprimer un ticket avec le numéro 1. Est-il sorti <b>dans la cuisine</b> ?') + '</p>' +
        '<div class="cu-plats">' + CANDIDATES.map(function (c, i) {
          return '<button type="button" class="cu-plat cu-numero" data-choisir-ip="' + c.ip + '"><b>' + (i + 1) + '</b><small>' + (c.nom ? c.nom + ' · ' : '') + c.ip + '</small></button>';
        }).join('') + '</div>' +
        '<div class="cu-actions"><button type="button" class="cu-bouton" data-chercher>Aucun n’est sorti en cuisine : chercher encore</button><button type="button" class="cu-bouton cu-discret" data-fermer>Plus tard</button></div>');
    };
    try { window.LocWebImprimante.chercher('__agImprimantes'); } catch (e) { panneau('<h2>Recherche impossible</h2><p>' + esc(e.message) + '</p><div class="cu-actions"><button type="button" class="cu-bouton" data-fermer>Fermer</button></div>'); }
  }
  /* La mise a jour de l'appli : elle regarde s'il existe une nouvelle version
     (releases GitHub du depot des applis), et l'installe elle-meme apres un
     toucher. Android demande seulement de confirmer « Mettre a jour ». */
  var MAJ = APPLI && !!window.LocWebImprimante.verifierMiseAJour, DERNIERE = null;
  function verifierMaj(manuel) {
    window.__agMaj = function (r) {
      DERNIERE = r;
      if (r.disponible) proposerMaj(manuel);
      else if (manuel) alert(r.erreur ? 'Vérification impossible : ' + r.erreur : 'L’appli est à jour (version ' + r.actuelle + ').');
    };
    window.LocWebImprimante.verifierMiseAJour('__agMaj');
  }
  // La page elle-meme : si LocWeb publie une nouvelle version, elle se recharge
  // toute seule HORS service ; pendant le service, un bouton discret la propose.
  function verifierPage() {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.v || j.v === window.NS_V) return;
      if (!enService()) { location.reload(); return; }
      var b = $('[data-appliquer]'); if (b) b.hidden = false;
    }).catch(function () {});
  }
  // Une seule verification par 24 h, au lancement de l'appli, et JAMAIS pendant le
  // service : relancee en plein rush (apres une coupure), la tablette ne propose rien.
  function enService() {
    var h = (donnees.snack || {}).horaires; if (!h) return false;
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    // Une demi-heure avant le service compte deja : on ne derange pas la mise en place.
    return (h[d.getDay()] || []).some(function (x) { return m >= x[0] - 30 && m < x[1]; });
  }
  function majAuLancement() {
    if (!MAJ || enService()) return;
    if (Date.now() - lire('ns-maj-derniere', 0) < 24 * 3600000) return;
    ecrire('ns-maj-derniere', Date.now());
    verifierMaj();
  }
  // La fenetre « Nouvelle version » ; si une autre fenetre est ouverte, elle attend son tour.
  function proposerMaj(manuel) {
    if (!manuel && enService()) return;   // le service a commence entre-temps : demain
    if (!$('[data-panneau]').hidden) { setTimeout(function () { proposerMaj(manuel); }, 30000); return; }
    panneau('<h2>Nouvelle version de l’appli</h2><p>Une mise à jour de l’appli de la cuisine est disponible. Elle s’installe en quelques secondes ; Android te demandera juste de confirmer.</p>' +
      '<div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-maj-go>Mettre à jour</button><button type="button" class="cu-bouton cu-discret" data-fermer>Plus tard</button></div>');
  }
  window.__agMajEtat = function (m) {
    panneau(m === 'ok'
      ? '<h2>Appli mise à jour ✓</h2><div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-fermer>OK</button></div>'
      : '<h2>La mise à jour n’a pas abouti</h2><p>' + esc(m) + '</p><div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-maj-go>Réessayer</button><button type="button" class="cu-bouton cu-discret" data-fermer>Plus tard</button></div>');
  };
  var alerteImp = '';
  function alerteImpression(t) { alerteImp = t; var a = $('[data-alerte]'); if (a) { a.hidden = false; a.textContent = t; } }
  function viaNavigateur(c) {
    var f = document.createElement('iframe'); f.className = 'cu-iframe'; document.body.appendChild(f);
    var d = f.contentDocument;
    d.open(); d.write('<!doctype html><meta charset="utf-8"><style>@page{size:80mm auto;margin:0}body{width:72mm;margin:0 4mm;font:13px/1.35 monospace;color:#000}h1{font-size:30px;margin:6px 0;text-align:center}h2{font-size:17px;margin:0 0 6px;text-align:center}hr{border:0;border-top:1px dashed #000}b{font-size:14px}.r{padding-left:10px}</style>' +
      '<h1>N° ' + c.numero + '</h1><h2>' + (c.mode === 'livraison' ? 'À LIVRER À ' : 'À REMETTRE À ') + hm(c.heure_prevue) + '</h2><div style="text-align:center">' + (c.creneau ? 'Commande programmée<br>' : '') + (c.mode === 'livraison' ? '<b>LIVRAISON</b><br>' + esc(c.adresse || '') : '<b>À EMPORTER</b>') + '</div><hr>' +
      c.lignes.map(function (l) { return '<div><b>' + l.qte + ' × ' + esc(l.n) + '</b>' + (l.resume ? '<div class="r">' + esc(l.resume) + '</div>' : '') + '</div>'; }).join('') + '<hr>' +
      (c.note ? '<div><b>NOTE :</b> ' + esc(c.note) + '</div>' : '') + '<div>' + esc(c.nom) + ' · ' + esc(c.telephone) + '</div>' + (c.paiement === 'sur_place' ? '<h2>À PAYER : ' + euros(c.total_cents) + '</h2>' : '<div>PAYÉ EN LIGNE : ' + euros(c.total_cents) + '</div>'));
    d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 5000); }, 250);
    return true;
  }

  /* ---------------- son et ecran ---------------- */
  var audio = null;
  function sonner() {
    if (!reglage.son) return;
    if (APPLI && window.LocWebImprimante.volumeMax) window.LocWebImprimante.volumeMax();
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, .28, .56].forEach(function (t) {
        var o = audio.createOscillator(), g = audio.createGain(); o.type = 'square'; o.frequency.value = 880;
        g.gain.setValueAtTime(.0001, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.35, audio.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + t + .22);
        o.connect(g).connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .25);
      });
    } catch (e) {}
  }
  function garderEcranAllume() {
    if (!('wakeLock' in navigator)) return;
    var prendre = function () { navigator.wakeLock.request('screen').catch(function () {}); };
    prendre(); document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') prendre(); });
  }

  /* ---------------- panneaux : epuises, reglages ---------------- */
  function panneau(html) { $('[data-panneau]').innerHTML = html; $('[data-panneau]').hidden = false; $('[data-voile]').hidden = false; }
  function fermerPanneau() { $('[data-panneau]').hidden = true; $('[data-voile]').hidden = true; if (session && donnees.snack) majMenu(); }
  function panneauEpuises() {
    var ep = donnees.snack.epuises || [];
    panneau('<h2>Plats épuisés aujourd’hui</h2><p>Touche un plat pour le retirer du site (ou le remettre).</p><div class="cu-plats">' +
      donnees.carte.map(function (p) { return '<button type="button" class="cu-plat' + (ep.indexOf(p.id) >= 0 ? ' cu-ep' : '') + '" data-plat="' + p.id + '">' + esc(p.n) + '</button>'; }).join('') +
      '</div><button type="button" class="cu-bouton" data-fermer>Fermer</button>');
  }
  /* La fiche « Que faire si… » : les situations du service, dans les mots
     de la cuisine. Elle s'imprime aussi, pour l'afficher au mur. */
  var AIDE = [
    ['Une commande arrive', 'Ça sonne et elle s’affiche dans <b>À préparer</b>. Prépare-la pour l’heure écrite en gros (« À remettre à … »). Quand elle est prête, touche <b>Prête</b>. Quand le client la récupère, vérifie son <b>numéro</b>, puis touche <b>Remise au client</b>.'],
    IMPRESSION && ['Le ticket ne sort pas', 'La commande devient rouge et un bandeau te prévient. Vérifie le <b>papier</b>, que l’imprimante est <b>allumée</b> et que son <b>câble réseau</b> est branché. Puis touche <b>Réimprimer</b> sur la commande. Pour tester : <b>Réglages → Ticket de test</b>. En attendant, prépare la commande en lisant l’écran : tout y est.'],
    ['Trop de monde, on ne suit plus', 'Touche <b>Pause</b> en haut. Le site n’accepte plus de nouvelles commandes ; celles déjà payées restent à préparer. Quand ça se calme, touche <b>Reprendre les commandes</b>.'],
    ['Il n’y a plus d’un produit', 'Touche <b>Plats épuisés</b>, puis le plat : il disparaît du site tout de suite. <b>Pense à le remettre</b> quand il revient (même bouton), sinon il reste caché.'],
    ['Un plat déjà payé manque', 'Appelle le client (son numéro est sur la commande) et propose-lui autre chose. S’il préfère être remboursé, préviens le <b>gérant</b> : il rembourse le plat depuis sa page, le client est recrédité sur sa carte.'],
    ['Le client ne vient pas', 'Appelle-le : son numéro est sur la commande. Si elle est <b>payée en ligne</b>, garde-la et ne la marque <b>Remise</b> que quand il l’a vraiment récupérée. Si elle est <b>à payer sur place</b> et qu’il ne viendra pas, touche <b>Pas venu</b>.'],
    ['« Hors ligne » en rouge', 'Internet est coupé ou faible. <b>Aucune commande n’est perdue</b> : elles s’afficheront au retour du réseau. Vérifie le Wi-Fi de la tablette. Si ça dure, préviens le gérant.'],
    ['La tablette s’est éteinte', 'Rebranche-la sur son chargeur, rallume-la et ouvre la page <b>Cuisine</b> (l’icône Nikkie Sushi sur l’écran d’accueil). Pas besoin de retaper le code. Les commandes arrivées entre-temps s’affichent toutes seules.'],
    ['Le code est demandé', 'C’est le code à 8 chiffres <b>du restaurant</b>, donné par le gérant. Il ne se tape qu’une fois sur cette tablette.'],
    ['Fermeture du soir', 'Rien à faire : en dehors des services, le site ne prend que des commandes pour le service suivant. Pour une fermeture exceptionnelle (congés, imprévu), ouvre <b>Fermetures</b>.'],
  ].filter(Boolean);
  function panneauAide() {
    panneau('<h2>Que faire si…</h2><div class="cu-aide-liste">' +
      AIDE.map(function (a) { return '<details class="cu-aide-item"><summary>' + a[0] + '</summary><p>' + a[1] + '</p></details>'; }).join('') +
      '</div><p class="cu-aide-pied">Un problème que la fiche ne règle pas : appelle le gérant.</p>' +
      '<div class="cu-actions">' + (IMPRESSION ? '<button type="button" class="cu-bouton" data-aide-imprimer>Imprimer la fiche</button>' : '') + '<button type="button" class="cu-bouton cu-feu" data-fermer>Fermer</button></div>');
  }
  function imprimerAide() {
    var f = document.createElement('iframe'); f.className = 'cu-iframe'; document.body.appendChild(f);
    var d = f.contentDocument;
    d.open(); d.write('<!doctype html><meta charset="utf-8"><title>Nikkie Sushi — Que faire si…</title><style>@page{size:A4;margin:14mm}body{font:12.5pt/1.45 Arial,sans-serif;color:#000}h1{font-size:22pt;margin:0 0 4pt}p.s{margin:0 0 12pt;color:#444}h2{font-size:13.5pt;margin:12pt 0 2pt}p{margin:0}</style>' +
      '<h1>Nikkie Sushi — Que faire si…</h1><p class="s">Fiche de la tablette Cuisine' + (session && session.snack ? ' · ' + esc(session.snack.nom) : '') + '</p>' +
      AIDE.map(function (a) { return '<h2>' + a[0] + '</h2><p>' + a[1] + '</p>'; }).join('') + '<h2>Autre problème</h2><p>Appelle le gérant.</p>');
    d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { f.remove(); }, 5000); }, 250);
  }

  // L'appli de la tablette : toujours la derniere version publiee (GitHub, depot anasgrillprint).
  var APK = 'https://github.com/Shigyn/anasgrillprint/releases/latest/download/nikkiesushi-cuisine.apk';
  function panneauInstaller() {
    var android = /android/i.test(navigator.userAgent);
    panneau('<h2>Installer l’appli de la cuisine</h2>' +
      '<p>Avec l’appli, les tickets sortent <b>tout seuls</b> sur l’imprimante de la cuisine. À faire une seule fois, sur la <b>tablette Android</b> de la cuisine.</p>' +
      (android ? '' : '<p class="cu-note">Tu n’es pas sur une tablette Android : ouvre cette page sur la tablette de la cuisine pour installer l’appli. (iPhone et iPad ne sont pas compatibles.)</p>') +
      '<h3 class="cu-h3">Avant de commencer</h3><ul class="cu-tuto">' +
        '<li>L’imprimante à tickets est <b>allumée</b> et branchée à la <b>box internet</b> par un câble réseau.</li>' +
        '<li>La tablette est connectée au <b>Wi-Fi du restaurant</b> (pas le Wi-Fi « invités »).</li></ul>' +
      '<h3 class="cu-h3">Installation (2 minutes)</h3><ol class="cu-tuto">' +
        '<li>Touche <b>Télécharger l’appli</b> ci-dessous.</li>' +
        '<li>Ouvre le fichier téléchargé (<b>nikkiesushi-cuisine.apk</b>), depuis la notification ou le dossier Téléchargements.</li>' +
        '<li>Android demande d’<b>autoriser l’installation</b> depuis le navigateur : touche <b>Paramètres</b>, active l’autorisation, puis reviens et touche <b>Installer</b>. C’est normal pour une appli qui ne vient pas du Play Store.</li>' +
        '<li>Ouvre l’appli <b>Nikkie Sushi</b> et tape le <b>code à 8 chiffres</b> du restaurant.</li>' +
        '<li>L’appli <b>cherche l’imprimante toute seule</b> et imprime un ticket numéroté : touche le numéro du ticket sorti <b>en cuisine</b>. C’est réglé.</li></ol>' +
      '<h3 class="cu-h3">Pour que ça tienne toute la journée</h3><ul class="cu-tuto">' +
        '<li>Laisse la tablette <b>branchée sur son chargeur</b>.</li>' +
        '<li>Paramètres Android → Applis → Nikkie Sushi → Batterie : choisis <b>Sans restriction</b>.</li></ul>' +
      '<div class="cu-actions">' + (android ? '<a class="cu-bouton cu-feu cu-lien" href="' + APK + '">Télécharger l’appli</a>' : '<button type="button" class="cu-bouton" data-copier-lien>Copier le lien de l’appli</button>') +
      '<button type="button" class="cu-bouton cu-discret" data-fermer>Fermer</button></div>');
  }

  // Le telephone du patron ne doit pas se prendre pour la tablette de la cuisine.
  function panneauRole() {
    panneau('<h2>Cet appareil, c’est…</h2><div class="cu-plats cu-roles">' +
      '<button type="button" class="cu-plat cu-role" data-role="appli"><b>La tablette de la cuisine</b><small>Elle imprime les tickets. Une seule pour le restaurant.</small></button>' +
      '<button type="button" class="cu-plat cu-role" data-role="aucune"><b>Un autre appareil</b><small>Le téléphone du patron, un ordi… Il regarde seulement, il n’imprime rien.</small></button>' +
      '</div><p>Tu pourras changer plus tard dans Réglages.</p>');
  }

  function panneauReglages() {
    if (!IMPRESSION) {
      panneau('<h2>Réglages</h2><label class="cu-choix"><span>Sonnerie à chaque commande</span><input type="checkbox" data-son' + (reglage.son ? ' checked' : '') + '></label>' +
        '<div class="cu-actions"><button type="button" class="cu-bouton" data-test-son>Tester le son</button></div>' +
        '<div class="cu-actions"><button type="button" class="cu-bouton cu-discret" data-deco>Se déconnecter</button><button type="button" class="cu-bouton" data-fermer>Fermer</button></div>');
      return;
    }
    panneau('<h2>Réglages de la tablette</h2><label class="cu-choix"><span>Impression</span><select data-imp>' +
      (APPLI ? [['appli', 'Cet appareil imprime (tablette principale)']] : []).concat([['navigateur', 'Navigateur (PC)'], ['aucune', 'Aucune : cet appareil regarde seulement']]).map(function (o) { return '<option value="' + o[0] + '"' + (reglage.impression === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select></label>' +
      (APPLI ? '<label class="cu-choix"><span>Adresse de l’imprimante</span><input data-ip inputmode="decimal" placeholder="192.168.1.87" value="' + esc(reglage.ip) + '"></label>' +
        (window.LocWebImprimante.chercher ? '<div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-chercher>Chercher l’imprimante</button></div>' : '') : '') +
      '<label class="cu-choix"><span>Sonnerie</span><input type="checkbox" data-son' + (reglage.son ? ' checked' : '') + '></label>' +
      (MAJ ? '<div class="cu-choix"><span>Version de l’appli : ' + window.LocWebImprimante.versionAppli() + '</span><button type="button" class="cu-bouton" data-maj-verifier>Vérifier les mises à jour</button></div>' : '') +
      '<div class="cu-actions"><button type="button" class="cu-bouton" data-test-imp>Ticket de test</button><button type="button" class="cu-bouton" data-test-son>Tester le son</button></div>' +
      '<div class="cu-actions"><button type="button" class="cu-bouton cu-discret" data-deco>Se déconnecter</button><button type="button" class="cu-bouton" data-fermer>Fermer</button></div>');
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-voile]') || t.closest('[data-fermer]')) { fermerPanneau(); return; }
    var vu = t.closest('[data-vue]'); if (vu) { montrer(vu.getAttribute('data-vue')); if (vu.getAttribute('data-vue') === 'ventes') choisirPeriode(periode ? periode.nom : 'jour'); return; }
    if (t.closest('[data-epuises]')) { panneauEpuises(); return; }
    if (t.closest('[data-reglages]')) { panneauReglages(); return; }
    if (t.closest('[data-aide]')) { panneauAide(); return; }
    if (t.closest('[data-installer]')) { panneauInstaller(); return; }
    var ro = t.closest('[data-role]');
    if (ro) {
      reglage.impression = ro.getAttribute('data-role'); ecrire('ns-espace-reglage', reglage);
      fermerPanneau(); boucle();
      if (principale() && window.LocWebImprimante && window.LocWebImprimante.chercher && !reglage.ip) panneauRecherche();
      else if (principale()) imprimerEnAttente();
      return;
    }
    if (t.closest('[data-appliquer]')) { location.reload(); return; }
    if (t.closest('[data-maj-go]')) {
      if (!DERNIERE || !DERNIERE.url) { verifierMaj(true); return; }
      panneau('<h2>Mise à jour en cours…</h2><span class="cu-attente" aria-hidden="true"></span><p>Téléchargement de la nouvelle version. Android va te demander de confirmer : touche <b>Mettre à jour</b>.</p>');
      window.LocWebImprimante.mettreAJour(DERNIERE.url);
      return;
    }
    if (t.closest('[data-maj-verifier]')) { fermerPanneau(); verifierMaj(true); return; }
    var cp = t.closest('[data-copier-lien]');
    if (cp) { try { navigator.clipboard.writeText(APK); cp.textContent = 'Lien copié ✓'; } catch (x) { prompt('Lien de l’appli :', APK); } return; }
    if (t.closest('[data-chercher]')) { panneauRecherche(); return; }
    var ch = t.closest('[data-choisir-ip]');
    if (ch) {
      reglage.ip = ch.getAttribute('data-choisir-ip'); reglage.port = 9100; reglage.impression = 'appli'; ecrire('ns-espace-reglage', reglage);
      panneau('<h2>Imprimante réglée ✓</h2><p>Les tickets sortiront sur l’imprimante <b>' + esc(reglage.ip) + '</b>. Tu peux la retrouver à tout moment dans <b>Réglages → Chercher l’imprimante</b>.</p><div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-fermer>Terminé</button></div>');
      imprimerEnAttente();
      return;
    }
    if (t.closest('[data-aide-imprimer]')) { imprimerAide(); return; }
    if (t.closest('[data-deco]')) { if (confirm('Se déconnecter de cette tablette ? Il faudra retaper le code.')) deconnecter(); return; }
    if (t.closest('[data-test-son]')) { var s0 = reglage.son; reglage.son = true; sonner(); reglage.son = s0; return; }
    if (t.closest('[data-test-imp]')) { imprimerTest(); return; }
    var pl = t.closest('[data-plat]');
    if (pl) {
      var v = !pl.classList.contains('cu-ep');
      appel('epuise', { plat: pl.getAttribute('data-plat'), valeur: v }).then(function (j) { donnees.snack.epuises = j.epuises; pl.classList.toggle('cu-ep', v); }).catch(function (x) { alert(x.message); });
      return;
    }
    if (t.closest('[data-pause]')) {
      var p = !donnees.snack.pause;
      if (p && !confirm('Mettre les commandes en ligne en pause ? Les commandes déjà payées restent à préparer.')) return;
      appel('pause', { valeur: p }).then(function () { donnees.snack.pause = p; majEtat(); });
      return;
    }
    var art = t.closest('[data-id]'); if (!art) return;
    var c = donnees.commandes.filter(function (x) { return x.id === art.getAttribute('data-id'); })[0];
    var st = t.closest('[data-statut]');
    if (st && st.getAttribute('data-statut') === 'annulee' && !confirm('Le client n’est pas venu chercher la commande N° ' + c.numero + ' ? Elle sera annulée.')) return;
    if (st) { var nv = st.getAttribute('data-statut'); appel('statut', { id: c.id, statut: nv }).then(function () { c.statut = nv; afficher(); }); return; }
    if (t.closest('[data-reimprimer]')) { imprimees[c.id] = false; imprimer(c, true); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-imp]')) { reglage.impression = e.target.value; ecrire('ns-espace-reglage', reglage); }
    if (e.target.matches('[data-son]')) { reglage.son = e.target.checked; ecrire('ns-espace-reglage', reglage); }
    if (e.target.matches('[data-ip]')) { reglage.ip = e.target.value.trim(); ecrire('ns-espace-reglage', reglage); }
  });
  function imprimerTest() {
    var c = { id: 'test', numero: 0, heure_prevue: new Date(Date.now() + 900000).toISOString(), creneau: null, nom: 'Test', telephone: '06 00 00 00 00', note: 'Ticket de test : si tu le lis, l’impression marche.', total_cents: 1000,
      lignes: [{ qte: 1, n: 'Le Classique', resume: 'Sandwich : Curry, sauce mayo ×2 · Burger : Steak, sans cornichon' }] };
    var r = reglage.impression === 'appli' ? viaAppli(c) : viaNavigateur(c);
    if (r && reglage.impression === 'appli') alerteImpression('Ticket de test envoyé à ' + reglage.ip + '.');
  }

  if (session && session.jeton) demarrer(); else ecranCode();

  /* ===================== la gestion (le cuisinier est aussi le gerant) ===================== */
  // Ventes : chiffres de la periode, commandes, remboursements, export Excel.
  var ventes = null, periode = null;
  var jourIso = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  function choisirPeriode(p) {
    var d = new Date(), du = new Date(d);
    if (p === 'hier') { du.setDate(d.getDate() - 1); d = new Date(du); }
    if (p === '7') du.setDate(d.getDate() - 6);
    if (p === 'mois') du.setDate(1);
    periode = { du: jourIso(du), au: jourIso(d), nom: p };
    document.querySelectorAll('[data-per]').forEach(function (b) { b.classList.toggle('cu-actif', b.getAttribute('data-per') === p); });
    return appel('ventes', { du: periode.du, au: periode.au }).then(function (j) { ventes = j; afficherVentes(); }).catch(function (e) { alert(e.message); });
  }
  function etatDe(c) {
    if (c.paiement === 'sur_place' && c.statut === 'annulee') return 'Pas venu';
    return { recue: 'À préparer', prete: 'Prête', remise: c.mode === 'livraison' ? 'Livrée' : 'Remise', annulee: 'Annulée' }[c.statut] || c.statut;
  }
  function afficherVentes() {
    var tout = ventes.commandes, l = tout.filter(function (c) { return !(c.paiement === 'sur_place' && c.statut === 'annulee'); });
    var net = function (c) { return c.total_cents - c.rembourse_cents; };
    var ca = l.reduce(function (t, c) { return t + net(c); }, 0);
    var liv = l.filter(function (c) { return c.mode === 'livraison'; }).length;
    $('[data-mode-test]').hidden = !ventes.test;
    $('[data-kpi]').innerHTML = [['Chiffre d’affaires', euros(ca)], ['Commandes', l.length], ['Panier moyen', l.length ? euros(Math.round(ca / l.length)) : '—'],
      ['Livraisons', liv + ' / ' + l.length],
      ['Payé sur place', euros(l.filter(function (c) { return c.paiement === 'sur_place'; }).reduce(function (t, c) { return t + c.total_cents; }, 0))], ['Remboursé', euros(l.reduce(function (t, c) { return t + c.rembourse_cents; }, 0))]]
      .map(function (k) { return '<div><small>' + k[0] + '</small><b>' + k[1] + '</b></div>'; }).join('');
    $('[data-cmds]').innerHTML = '<thead><tr><th>Jour</th><th>N°</th><th>Client</th><th>Mode</th><th>Contenu</th><th>Payé</th><th>État</th><th></th></tr></thead><tbody>' +
      (tout.map(function (c) {
        var reste = c.total_cents - c.rembourse_cents;
        return '<tr><td>' + c.jour.slice(8, 10) + '/' + c.jour.slice(5, 7) + ' ' + hm(c.payee_le || c.cree_le) + '</td><td>' + c.numero + '</td><td>' + esc(c.nom) + '<br><small>' + esc(c.telephone) + '</small></td>' +
          '<td>' + (c.mode === 'livraison' ? 'Livraison' : 'À emporter') + '</td>' +
          '<td><small>' + c.lignes.map(function (x) { return x.qte + ' × ' + esc(x.n) + (x.resume ? ' (' + esc(x.resume) + ')' : ''); }).join(', ') + '</small></td>' +
          '<td>' + euros(c.total_cents) + (c.paiement === 'sur_place' ? '<br><small>sur place</small>' : '') + (c.rembourse_cents ? '<br><small>remb. ' + euros(c.rembourse_cents) + '</small>' : '') + '</td><td>' + esc(etatDe(c)) + '</td>' +
          '<td>' + (reste > 0 && c.paiement !== 'sur_place' ? '<button type="button" class="cu-bouton cu-discret" data-rembourser="' + c.id + '" data-reste="' + reste + '">Rembourser</button>' : '') + '</td></tr>';
      }).join('') || '<tr><td colspan="8">Aucune commande sur cette période.</td></tr>') + '</tbody>';
    if (periode && periode.nom === 'jour') sousCarte('ventes', euros(ca) + ' aujourd’hui');
  }
  // L'export : on choisit les colonnes, puis on telecharge (jamais les frais de paiement en ligne).
  var COLONNES = [
    ['Jour', function (c) { return c.jour; }], ['Heure', function (c) { return hm(c.payee_le || c.cree_le); }], ['N°', function (c) { return c.numero; }],
    ['Client', function (c) { return c.nom; }], ['Téléphone', function (c) { return c.telephone; }],
    ['Mode', function (c) { return c.mode === 'livraison' ? 'Livraison' : 'À emporter'; }],
    ['Paiement', function (c) { return c.paiement === 'sur_place' ? 'Sur place' : 'En ligne'; }], ['Adresse', function (c) { return c.adresse || ''; }],
    ['Contenu', function (c) { return c.lignes.map(function (x) { return x.qte + ' x ' + x.n + (x.resume ? ' (' + x.resume + ')' : ''); }).join(' | '); }],
    ['Total TTC', function (c) { return (c.total_cents / 100).toFixed(2).replace('.', ','); }], ['Remboursé', function (c) { return (c.rembourse_cents / 100).toFixed(2).replace('.', ','); }],
    ['Net', function (c) { return ((c.total_cents - c.rembourse_cents) / 100).toFixed(2).replace('.', ','); }], ['État', etatDe]
  ];
  function panneauExport() {
    var gardees = lire('ns-export-colonnes', null);
    panneau('<h2>Export Excel</h2><p>Période choisie dans Ventes. Coche ce que tu veux dans le fichier :</p><div class="cu-plats" data-ex-cols>' +
      COLONNES.map(function (k) { var on = !gardees || gardees.indexOf(k[0]) >= 0; return '<button type="button" class="cu-plat' + (on ? '' : ' cu-ep') + '" data-ex-col="' + esc(k[0]) + '">' + esc(k[0]) + '</button>'; }).join('') +
      '</div><div class="cu-actions"><button type="button" class="cu-bouton cu-feu" data-ex-go>Télécharger</button><button type="button" class="cu-bouton cu-discret" data-fermer>Annuler</button></div>');
  }
  function exporter(cols) {
    var choisies = COLONNES.filter(function (k) { return cols.indexOf(k[0]) >= 0; });
    var lignes = [choisies.map(function (k) { return k[0]; })].concat(ventes.commandes.map(function (c) { return choisies.map(function (k) { return k[1](c); }); }));
    var csv = String.fromCharCode(0xFEFF) + lignes.map(function (r) { return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(';'); }).join(String.fromCharCode(13, 10));
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'nikkie-sushi-' + periode.du + '_' + periode.au + '.csv'; a.click();
  }
  // Fermetures exceptionnelles : le site ne prend plus de commande pendant ce temps.
  function panneauFermetures() {
    var l = (donnees.snack.fermetures || []);
    panneau('<h2>Fermetures exceptionnelles</h2><p>Pendant une fermeture, le site n’accepte plus de commande pour ces heures-là.</p>' +
      '<form class="ns-ferm" data-ferm><label>Du <input type="datetime-local" data-ferm-du required></label><label>Au <input type="datetime-local" data-ferm-au required></label>' +
      '<label>Motif <input data-ferm-motif maxlength="80" placeholder="Congés, imprévu…"></label><button class="cu-bouton cu-feu">Ajouter</button></form>' +
      '<ul class="ns-ferm-liste">' + (l.map(function (f, i) { return '<li><span>Du ' + new Date(f.du).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + ' au ' + new Date(f.au).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + (f.motif ? ' · ' + esc(f.motif) : '') + '</span><button type="button" class="cu-bouton cu-discret" data-ferm-suppr="' + i + '">Supprimer</button></li>'; }).join('') || '<li>Aucune fermeture prévue.</li>') + '</ul>' +
      '<div class="cu-actions"><button type="button" class="cu-bouton" data-fermer>Fermer</button></div>');
  }
  function enregistrerFermetures(l) {
    return appel('fermetures', { fermetures: l }).then(function () { donnees.snack.fermetures = l; panneauFermetures(); majMenu(); }).catch(function (e) { alert(e.message); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    var per = t.closest('[data-per]'); if (per) { choisirPeriode(per.getAttribute('data-per')); return; }
    if (t.closest('[data-export]')) { if (ventes) panneauExport(); return; }
    var col = t.closest('[data-ex-col]'); if (col) { col.classList.toggle('cu-ep'); return; }
    if (t.closest('[data-ex-go]')) {
      var cols = [].map.call(document.querySelectorAll('[data-ex-col]:not(.cu-ep)'), function (x) { return x.getAttribute('data-ex-col'); });
      if (!cols.length) { alert('Coche au moins une colonne.'); return; }
      ecrire('ns-export-colonnes', cols); exporter(cols); fermerPanneau(); return;
    }
    if (t.closest('[data-fermetures]')) { panneauFermetures(); return; }
    var fs = t.closest('[data-ferm-suppr]');
    if (fs) { var l = (donnees.snack.fermetures || []).slice(); l.splice(+fs.getAttribute('data-ferm-suppr'), 1); enregistrerFermetures(l); return; }
    var rb = t.closest('[data-rembourser]');
    if (rb) {
      var reste = +rb.getAttribute('data-reste');
      var v = prompt('Montant à rembourser (maximum ' + (reste / 100).toFixed(2).replace('.', ',') + ' €). Laisse tel quel pour tout rembourser.', (reste / 100).toFixed(2).replace('.', ','));
      if (v == null) return;
      var cents = Math.round(parseFloat(v.replace(',', '.')) * 100);
      if (!(cents > 0)) { alert('Montant invalide.'); return; }
      if (!confirm('Rembourser ' + euros(cents) + ' au client ? Le remboursement part tout de suite sur sa carte.')) return;
      appel('rembourser', { id: rb.getAttribute('data-rembourser'), montant_cents: cents }).then(function () { alert('Remboursement envoyé : le client le voit sur son compte sous 5 à 10 jours.'); choisirPeriode(periode.nom || 'jour'); }).catch(function (x) { alert(x.message); });
    }
  });
  document.addEventListener('submit', function (e) {
    if (!e.target.matches('[data-ferm]')) return;
    e.preventDefault();
    var du = $('[data-ferm-du]').value, au = $('[data-ferm-au]').value;
    if (!du || !au || du >= au) { alert('Indique un début et une fin.'); return; }
    enregistrerFermetures((donnees.snack.fermetures || []).concat([{ du: new Date(du).toISOString(), au: new Date(au).toISOString(), motif: $('[data-ferm-motif]').value.trim() }]));
  });
})();
