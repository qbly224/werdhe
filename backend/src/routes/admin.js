const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

// Middleware admin uniquement
function verifierAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ erreur: 'Accès admin requis' });
}

// Statistiques globales
router.get('/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var [users, logements, reservations, paiements] = await Promise.all([
      db.query("SELECT COUNT(*) as total, COUNT(CASE WHEN role='proprietaire' THEN 1 END) as proprio, COUNT(CASE WHEN role='locataire' THEN 1 END) as locataire FROM users"),
      db.query("SELECT COUNT(*) as total, COUNT(CASE WHEN statut='loue' THEN 1 END) as loues FROM logements"),
      db.query("SELECT COUNT(*) as total, COUNT(CASE WHEN statut='confirmee' THEN 1 END) as confirmees FROM reservations"),
      db.query("SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE statut='complete'"),
    ]);
    res.json({
      total_users:           parseInt(users.rows[0].total),
      total_proprietaires:   parseInt(users.rows[0].proprio),
      total_locataires:      parseInt(users.rows[0].locataire),
      total_logements:       parseInt(logements.rows[0].total),
      logements_loues:       parseInt(logements.rows[0].loues),
      total_reservations:    parseInt(reservations.rows[0].total),
      total_confirmees:      parseInt(reservations.rows[0].confirmees),
      revenus_plateforme:    parseFloat(paiements.rows[0].total) * 0.05, // 5% commission
    });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Liste des utilisateurs
router.get('/users', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query('SELECT id, nom, prenom, email, telephone, role, suspendu, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Suspendre un utilisateur
router.patch('/users/:id/suspendre', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var current = await db.query('SELECT suspendu FROM users WHERE id = $1', [req.params.id]);
    var newVal  = !(current.rows[0] && current.rows[0].suspendu);
    await db.query('UPDATE users SET suspendu = $1 WHERE id = $2', [newVal, req.params.id]);
    res.json({ message: newVal ? 'Utilisateur suspendu' : 'Utilisateur réactivé' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Liste des logements (admin)
router.get('/logements', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT l.*, u.nom as prop_nom, u.prenom as prop_prenom
       FROM logements l JOIN users u ON l.proprietaire_id = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ logements: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Vérifier un logement
router.patch('/logements/:id/verifier', verifierToken, verifierAdmin, async (req, res) => {
  try {
    await db.query('UPDATE logements SET verifie = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Logement vérifié !' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Liste des réservations (admin)
router.get('/reservations', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT r.*, l.titre as logement_titre,
         u_loc.nom as locataire_nom, u_loc.prenom as locataire_prenom
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       ORDER BY r.created_at DESC LIMIT 100`
    );
    res.json({ reservations: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;