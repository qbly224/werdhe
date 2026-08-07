const db = require('../database');

// ─── CRITÈRES ET POINTS ──────────────────────────────────────────
var CRITERES = {
  inscription:          { points: 10, label: 'Inscription complète'           },
  telephone_verifie:    { points: 15, label: 'Téléphone vérifié'              },
  premiere_candidature: { points: 10, label: 'Première candidature envoyée'   },
  premiere_location:    { points: 20, label: 'Première location confirmée'    },
  paiement_temps:       { points: 15, label: 'Loyers payés à temps'           },
  bonne_note:           { points: 15, label: 'Note > 4/5 reçue'               },
  profil_complet:       { points: 10, label: 'Profil complet (nom + tel)'     },
  dossier_soumis:       { points: 5,  label: 'Dossier complet soumis'         },
};

// ─── CALCULER LE SCORE D'UN LOCATAIRE ─────────────────────────────
async function calculerScore(userId) {
  try {
    var [user, candidatures, locations, paiements, notations] = await Promise.all([
      db.query('SELECT * FROM users WHERE id = $1', [userId]),
      db.query('SELECT COUNT(*) as nb FROM reservations WHERE locataire_id = $1', [userId]),
      db.query(`SELECT COUNT(*) as nb FROM reservations WHERE locataire_id = $1 AND statut = 'confirmee'`, [userId]),
      db.query(`SELECT COUNT(*) as nb, COUNT(*) FILTER (WHERE statut = 'complete') as ok FROM paiements p JOIN reservations r ON p.reservation_id = r.id WHERE r.locataire_id = $1`, [userId]),
      db.query('SELECT AVG(note) as moyenne FROM notations WHERE cible_id = $1', [userId]),
    ]);

    var u           = user.rows[0];
    if (!u) return 0;

    var score       = 0;
    var details     = {};

    // Inscription (toujours)
    score += CRITERES.inscription.points;
    details.inscription = true;

    // Profil complet
    if (u.nom && u.prenom && u.telephone) {
      score += CRITERES.profil_complet.points;
      details.profil_complet = true;
    }

    // Téléphone vérifié (a utilisé OTP téléphone)
    if (u.telephone) {
      score += CRITERES.telephone_verifie.points;
      details.telephone_verifie = true;
    }

    // Première candidature
    if (Number(candidatures.rows[0].nb) > 0) {
      score += CRITERES.premiere_candidature.points;
      details.premiere_candidature = true;
    }

    // Première location confirmée
    if (Number(locations.rows[0].nb) > 0) {
      score += CRITERES.premiere_location.points;
      details.premiere_location = true;
    }

    // Paiements à temps (au moins 80% payés à temps)
    var nbPaiements = Number(paiements.rows[0].nb);
    var nbOk        = Number(paiements.rows[0].ok);
    if (nbPaiements > 0 && (nbOk / nbPaiements) >= 0.8) {
      score += CRITERES.paiement_temps.points;
      details.paiement_temps = true;
    }

    // Bonne note
    var moyenne = Number(notations.rows[0].moyenne) || 0;
    if (moyenne >= 4) {
      score += CRITERES.bonne_note.points;
      details.bonne_note = true;
    }

    // Dossier soumis (au moins une réservation avec doc_cni_url)
    var dossier = await db.query(
      'SELECT COUNT(*) as nb FROM reservations WHERE locataire_id = $1 AND doc_cni_url IS NOT NULL',
      [userId]
    );
    if (Number(dossier.rows[0].nb) > 0) {
      score += CRITERES.dossier_soumis.points;
      details.dossier_soumis = true;
    }

    // Limiter à 100
    score = Math.min(100, score);

    // Sauvegarder en base
    await db.query(
      'UPDATE users SET score_confiance = $1, score_details = $2 WHERE id = $3',
      [score, JSON.stringify(details), userId]
    );

    return score;

  } catch (err) {
    console.error('[Score] Erreur:', err.message);
    return 0;
  }
}

// ─── LABEL DU SCORE ───────────────────────────────────────────────
function labelScore(score) {
  if (score >= 80) return { label: 'Excellent',    couleur: '#1B6B3A', bg: '#E8F5E9', emoji: '⭐' };
  if (score >= 60) return { label: 'Bon',          couleur: '#1565C0', bg: '#E3F2FD', emoji: '👍' };
  if (score >= 40) return { label: 'Correct',      couleur: '#E65100', bg: '#FFF3E0', emoji: '✅' };
  if (score >= 20) return { label: 'À améliorer',  couleur: '#7B4F00', bg: '#FFF8E1', emoji: '📈' };
  return             { label: 'Nouveau',            couleur: '#888',    bg: '#F5F5F5', emoji: '🆕' };
}

module.exports = { calculerScore, labelScore, CRITERES };