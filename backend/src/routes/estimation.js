const express = require('express');
const router  = express.Router();
const db      = require('../database');

// Prix de base indicatif (GNF / m² / mois) par zone, à défaut de
// comparables suffisants sur la plateforme. Volontairement approximatif :
// sert uniquement de filet de sécurité statistique, pas une valeur d'expert.
var PRIX_BASE_M2 = {
  kaloum:  12000,
  dixinn:   9000,
  ratoma:   7000,
  matam:    7500,
  matoto:   5000,
  conakry:  7000, // ville "Conakry" générique sans commune précisée
  defaut:   4000, // autres villes de Guinée
};

var MULTIPLICATEUR_CATEGORIE = {
  studio:      0.9,
  appartement: 1.0,
  villa:       1.3,
  duplex:      1.2,
  bureau:      1.1,
};

function normaliser(texte) {
  return String(texte || '').toLowerCase().trim();
}

function estimationBaseline(ville, categorie, nb_chambres, superficie) {
  var villeNorm = normaliser(ville);
  var prixM2 = PRIX_BASE_M2[villeNorm] || (villeNorm.indexOf('conakry') !== -1 ? PRIX_BASE_M2.conakry : PRIX_BASE_M2.defaut);
  var multiCat = MULTIPLICATEUR_CATEGORIE[normaliser(categorie)] || 1.0;
  var surf = Number(superficie) > 0 ? Number(superficie) : 50;

  var base = prixM2 * surf * multiCat;

  var chambres = Number(nb_chambres) || 0;
  if (chambres > 2) base *= 1 + (chambres - 2) * 0.05;

  return {
    estimation_basse:  Math.round(base * 0.85 / 10000) * 10000,
    estimation_haute:  Math.round(base * 1.15 / 10000) * 10000,
    estimation_moyenne: Math.round(base / 10000) * 10000,
    methode: 'statistique',
    nb_comparables: 0,
    confiance: 'estimation',
  };
}

// ─── ESTIMER UN LOYER ─────────────────────────────────────────────
router.post('/loyer', async (req, res) => {
  try {
    var { ville, categorie, nb_chambres, superficie } = req.body;
    if (!ville) {
      return res.status(400).json({ erreur: 'La ville est requise' });
    }

    var chambres = Number(nb_chambres) || null;
    var surf     = Number(superficie)  || null;

    // Chercher des logements comparables déjà publiés sur la plateforme
    var conditions = [`LOWER(ville) = LOWER($1)`, `statut != 'archive'`];
    var params = [ville];
    var idx = 2;

    if (categorie) {
      conditions.push('categorie = $' + idx);
      params.push(categorie); idx++;
    }
    if (chambres) {
      conditions.push('nb_chambres BETWEEN $' + idx + ' AND $' + (idx + 1));
      params.push(Math.max(chambres - 1, 0), chambres + 1); idx += 2;
    }

    var comparables = await db.query(
      `SELECT prix_mensuel, superficie
       FROM logements
       WHERE ${conditions.join(' AND ')}
         AND prix_mensuel > 0
       LIMIT 200`,
      params
    );

    var rows = comparables.rows.filter(function(r) { return r.prix_mensuel > 0; });

    if (rows.length >= 3) {
      // Prix moyen au m² parmi les comparables ayant une superficie renseignée
      var avecSuperficie = rows.filter(function(r) { return r.superficie > 0; });
      var prixMoyen;
      var methode;

      if (avecSuperficie.length >= 3 && surf) {
        var prixM2Moyen = avecSuperficie.reduce(function(s, r) { return s + (r.prix_mensuel / r.superficie); }, 0) / avecSuperficie.length;
        prixMoyen = prixM2Moyen * surf;
        methode = 'comparables_m2';
      } else {
        prixMoyen = rows.reduce(function(s, r) { return s + r.prix_mensuel; }, 0) / rows.length;
        methode = 'comparables_moyenne';
      }

      var prixTries = rows.map(function(r) { return r.prix_mensuel; }).sort(function(a, b) { return a - b; });
      var basse = prixTries[0];
      var haute = prixTries[prixTries.length - 1];

      return res.json({
        estimation_basse:   Math.round(Math.min(basse, prixMoyen * 0.85) / 10000) * 10000,
        estimation_haute:   Math.round(Math.max(haute, prixMoyen * 1.15) / 10000) * 10000,
        estimation_moyenne: Math.round(prixMoyen / 10000) * 10000,
        methode:        methode,
        nb_comparables: rows.length,
        confiance:      rows.length >= 8 ? 'haute' : 'moyenne',
      });
    }

    // Pas assez de données réelles → estimation statistique de secours
    res.json(estimationBaseline(ville, categorie, chambres, surf));
  } catch (err) {
    console.error('[POST /estimation/loyer]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
