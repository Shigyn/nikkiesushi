/* ===================================================================
   Nikkie Sushi — la page Inscription (LocWeb, 2026-10-28)
   Le restaurant ouvre ici le compte Stripe qui recevra l'argent des
   commandes payees en ligne. Le lien vient de l'espace pro (Paiement en
   ligne) et n'expire jamais : chaque clic redemande a Stripe un lien neuf.
   Stripe ramene ici a la fin. Meme page que chez Anas Grill, recopiee.
   =================================================================== */
(function () {
  'use strict';
  var CFG = window.LOCWEB_CONFIG || {};
  var FN = CFG.supabaseUrl + '/functions/v1/ns-inscription';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cle = new URLSearchParams(location.search).get('k') || '';
  document.body.className = 'cuisine-code';

  function appel(action) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action, cle: cle }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.refus || 'Le serveur ne répond pas. Réessayez dans un instant.'); return j; }); });
  }
  function ecran(titre, corps) {
    $('#app').innerHTML = '<main class="insc">' + $('[data-logo]').innerHTML + '<h1>' + titre + '</h1>' + corps + '</main>';
  }

  var TEXTES = {
    a_ouvrir: ['Recevoir les paiements en ligne', '<p>Vous ouvrez le compte du restaurant chez Stripe, le service qui encaisse les cartes. L’argent des commandes payées en ligne arrive ensuite directement sur votre compte bancaire.</p><ul><li>le SIREN de la société</li><li>son RIB</li><li>la pièce d’identité du président</li></ul><p>Comptez 10 minutes. Vous pouvez vous arrêter et reprendre plus tard avec ce même lien.</p>', 'Ouvrir mon compte de paiement'],
    a_completer: ['Il manque des informations', '<p>Le compte est ouvert, mais Stripe attend encore quelques éléments avant de pouvoir encaisser.</p>', 'Compléter mon compte'],
    verification: ['Merci, c’est envoyé', '<p>Stripe vérifie les informations : en général quelques minutes, parfois jusqu’à 2 jours. Vous n’avez rien d’autre à faire. L’espace pro affiche « ✓ Actif » dès que c’est validé.</p>', 'Revoir mes informations'],
    actif: ['C’est actif ✓', '<p>Le restaurant encaisse les paiements en ligne : les clients peuvent payer par carte sur le site.</p><p>Virements, factures et remboursements se suivent dans votre espace Stripe : <b>dashboard.stripe.com</b></p>', '']
  };

  function afficher() {
    appel('etat').then(function (j) {
      var t = TEXTES[j.etat] || TEXTES.a_ouvrir;
      ecran(esc(t[0]), '<p><b>' + esc(j.nom) + '</b></p>' + t[1] +
        (t[2] ? '<button type="button" class="cu-bouton cu-feu" data-go>' + t[2] + '</button><p class="insc-err" data-err></p>' : ''));
      var b = $('[data-go]');
      if (b) b.addEventListener('click', function () {
        b.disabled = true; b.textContent = 'Ouverture de Stripe…';
        appel('lien').then(function (r) { location.href = r.lien; })
          .catch(function (x) { b.disabled = false; b.textContent = t[2]; $('[data-err]').textContent = x.message; });
      });
    }).catch(function (x) { ecran('Lien non valable', '<p class="insc-err">' + esc(x.message) + '</p>'); });
  }
  if (!cle) ecran('Lien incomplet', '<p class="insc-err">Demandez le lien à Nicolas (LocWeb).</p>'); else afficher();
})();
