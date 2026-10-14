/* ===================================================================
   Nikkie Sushi — le script commun (LocWeb, 2026-10-14)
   En-tete, menu telephone, apparitions, onglets de la carte, et l'etat
   « ouvert / ferme » calcule sur les horaires. Sans JavaScript, le site
   reste entierement lisible.
   =================================================================== */
(function () {
  'use strict';
  var CFG = window.NIKKIE || {};
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var hm = function (m) { var h = Math.floor(m / 60), mn = m % 60; return h + 'h' + (mn ? String(mn).padStart(2, '0') : ''); };

  /* --- Les horaires : sert aussi a commande.js ------------------------ */
  // Renvoie les prochains services a partir de `d` : [{jour: Date a minuit,
  // debut, fin (minutes), enCours}], dans l'ordre, sur 8 jours.
  function services(d, combien) {
    var res = [], base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var maintenant = d.getHours() * 60 + d.getMinutes();
    for (var j = 0; j < 8 && res.length < combien; j++) {
      var jour = new Date(base); jour.setDate(base.getDate() + j);
      (CFG.horaires[jour.getDay()] || []).forEach(function (s) {
        if (res.length >= combien) return;
        if (j === 0 && s[1] <= maintenant) return;
        res.push({ jour: jour, debut: s[0], fin: s[1], enCours: j === 0 && s[0] <= maintenant });
      });
    }
    return res;
  }
  function quand(s, d) {
    var ecart = Math.round((s.jour - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    return ecart === 0 ? 'aujourd’hui' : ecart === 1 ? 'demain' : JOURS[s.jour.getDay()];
  }
  window.NikkieHoraires = { services: services, quand: quand, hm: hm };

  function majEtat() {
    var d = new Date(), s = services(d, 1)[0];
    var html, ouvert = !!(s && s.enCours);
    if (!s) html = 'Horaires : nous appeler';
    else if (ouvert) html = '<b>Ouvert</b> · jusqu’à ' + hm(s.fin);
    else html = '<b>Fermé</b> · ouvre ' + quand(s, d) + ' à ' + hm(s.debut);
    document.querySelectorAll('[data-etat-ouverture]').forEach(function (e) {
      e.classList.toggle('ouvert', ouvert); e.classList.toggle('ferme', !ouvert);
      e.querySelector('span').innerHTML = html;
    });
    var auj = String(d.getDay());
    document.querySelectorAll('[data-horaires] tr').forEach(function (tr) { tr.classList.toggle('aujourdhui', tr.getAttribute('data-jour') === auj); });
  }
  majEtat();
  setInterval(majEtat, 60000);

  /* --- L'en-tete se pose des qu'on quitte le haut ---------------------- */
  var entete = document.querySelector('[data-entete]');
  var poser = function () { entete.classList.toggle('pose', window.scrollY > 8); };
  window.addEventListener('scroll', poser, { passive: true }); poser();

  /* --- Le menu telephone ----------------------------------------------- */
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu-mobile');
  if (burger && menu) {
    var fermer = function () { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu'); };
    burger.addEventListener('click', function () {
      var ouvrir = menu.hidden; menu.hidden = !ouvrir;
      burger.setAttribute('aria-expanded', String(ouvrir));
      burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
  }

  /* --- Les apparitions ------------------------------------------------- */
  var aReveler = document.querySelectorAll('.reveler');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    aReveler.forEach(function (e) { e.classList.add('vu'); });
  } else {
    var oeil = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); oeil.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: '0px 0px -6% 0px' });
    aReveler.forEach(function (e) { oeil.observe(e); });
  }

  /* --- La carte : l'onglet de la categorie en cours s'allume ------------ */
  var onglets = document.querySelector('[data-onglets]');
  if (onglets && 'IntersectionObserver' in window) {
    var liens = {};
    onglets.querySelectorAll('a').forEach(function (a) { liens[a.getAttribute('href').slice(1)] = a; });
    var actif = null;
    var suivi = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = liens[e.target.id];
        if (!a || a === actif) return;
        if (actif) actif.classList.remove('actif');
        actif = a; a.classList.add('actif');
        var b = onglets.querySelector('.onglets-in');
        b.scrollTo({ left: a.offsetLeft - b.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.categorie').forEach(function (s) { suivi.observe(s); });
  }
})();
