const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// ─── NOTER APRÈS UNE LOCATION ────────────────────────────────────
router.post('/', verifierToken, async (req, res) => {
  try {
    var { reservation_id, note, commentaire } = req.body;

    if (!reservation_id || !note) {
      return res.status(400).json({ erreur: 'reservation_id et note requis' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ erreur: 'La note doit être entre 1 et 5' });
    }

    // Récupérer la réservation
    var resa = await db.query(
      `SELECT r.*, l.proprietaire_id
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       WHERE r.id = $1 AND r.statut IN ('confirmee', 'terminee')`,
      [reservation_id]
    );

    if (resa.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée ou non terminée' });
    }

    var r = resa.rows[0];
    var estLocataire = req.user.id === r.locataire_id;
    var estProprio   = req.user.id === r.proprietaire_id;

    if (!estLocataire && !estProprio) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }

    var cibleId = estLocataire ? r.proprietaire_id : r.locataire_id;
    var type    = estLocataire ? 'locataire_note_proprio' : 'proprio_note_locataire';

    // Insérer la notation
    await db.query(
      `INSERT INTO notations (reservation_id, auteur_id, cible_id, note, commentaire, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (reservation_id, auteur_id) DO UPDATE
         SET note = $4, commentaire = $5`,
      [reservation_id, req.user.id, cibleId, note, commentaire || null, type]
    );

    // Mettre à jour la note moyenne de la cible
    await db.query(
      `UPDATE users SET
         note_moyenne = (SELECT AVG(note) FROM notations WHERE cible_id = $1),
         nb_notations = (SELECT COUNT(*) FROM notations WHERE cible_id = $1)
       WHERE id = $1`,
      [cibleId]
    );

    res.status(201).json({ message: 'Notation enregistrée !' });

  } catch (err) {
    console.error('[POST /notations]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── VOIR LES NOTATIONS D'UN USER ────────────────────────────────
router.get('/user/:id', async (req, res) => {
  try {
    var result = await db.query(
      `SELECT n.*,
         u.nom as auteur_nom, u.prenom as auteur_prenom,
         l.titre as logement_titre
       FROM notations n
       JOIN users u ON n.auteur_id = u.id
       JOIN reservations r ON n.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       WHERE n.cible_id = $1
       ORDER BY n.created_at DESC`,
      [req.params.id]
    );
    var moyenne = result.rows.length > 0
      ? result.rows.reduce(function(s, n) { return s + n.note; }, 0) / result.rows.length
      : 0;
    res.json({ notations: result.rows, moyenne: Math.round(moyenne * 10) / 10 });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── MA NOTE MOYENNE ──────────────────────────────────────────────
router.get('/ma-note', verifierToken, async (req, res) => {
  try {
    var result = await db.query(
      'SELECT note_moyenne, nb_notations FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || { note_moyenne: 0, nb_notations: 0 });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;