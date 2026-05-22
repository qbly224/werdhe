const db = require('../database');

// ================================
// CRÉER UN LOCATAIRE MANUELLEMENT
// ================================
const creerLocataire = async (req, res) => {
  try {
    const {
      nom, prenom, telephone, email, cni, profession,
      logement_id, date_entree, date_sortie,
      loyer_mensuel, caution, notes
    } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        erreur: 'Nom et prénom obligatoires'
      });
    }

    // Vérifier que le logement appartient au propriétaire
    if (logement_id) {
      const logement = await db.query(
        'SELECT id FROM logements WHERE id = $1 AND proprietaire_id = $2',
        [logement_id, req.user.id]
      );
      if (logement.rows.length === 0) {
        return res.status(403).json({
          erreur: 'Ce logement ne vous appartient pas'
        });
      }

      // Mettre le logement en statut "loué"
      await db.query(
        'UPDATE logements SET statut = $1 WHERE id = $2',
        ['loue', logement_id]
      );
    }

    const result = await db.query(
      `INSERT INTO locataires_manuels
        (proprietaire_id, logement_id, nom, prenom, telephone,
         email, cni, profession, date_entree, date_sortie,
         loyer_mensuel, caution, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user.id, logement_id || null,
        nom, prenom, telephone || null, email || null,
        cni || null, profession || null,
        date_entree || null, date_sortie || null,
        loyer_mensuel || null, caution || null,
        notes || null
      ]
    );

    res.status(201).json({
      message: '✅ Locataire ajouté avec succès !',
      locataire: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur création locataire:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR MES LOCATAIRES MANUELS
// ================================
const getMesLocataires = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lm.*,
        l.titre as logement_titre,
        l.ville as logement_ville,
        l.adresse as logement_adresse
       FROM locataires_manuels lm
       LEFT JOIN logements l ON lm.logement_id = l.id
       WHERE lm.proprietaire_id = $1
       ORDER BY lm.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: `✅ ${result.rows.length} locataire(s)`,
      locataires: result.rows
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// MODIFIER UN LOCATAIRE
// ================================
const modifierLocataire = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom, prenom, telephone, email, cni, profession,
      logement_id, date_entree, date_sortie,
      loyer_mensuel, caution, statut, notes
    } = req.body;

    const result = await db.query(
      `UPDATE locataires_manuels SET
        nom = COALESCE($1, nom),
        prenom = COALESCE($2, prenom),
        telephone = COALESCE($3, telephone),
        email = COALESCE($4, email),
        cni = COALESCE($5, cni),
        profession = COALESCE($6, profession),
        logement_id = COALESCE($7, logement_id),
        date_entree = COALESCE($8, date_entree),
        date_sortie = COALESCE($9, date_sortie),
        loyer_mensuel = COALESCE($10, loyer_mensuel),
        caution = COALESCE($11, caution),
        statut = COALESCE($12, statut),
        notes = COALESCE($13, notes)
       WHERE id = $14 AND proprietaire_id = $15
       RETURNING *`,
      [
        nom, prenom, telephone, email, cni, profession,
        logement_id, date_entree, date_sortie,
        loyer_mensuel, caution, statut, notes,
        id, req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Locataire non trouvé' });
    }

    res.json({
      message: '✅ Locataire modifié !',
      locataire: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// SUPPRIMER UN LOCATAIRE
// ================================
const supprimerLocataire = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le logement_id avant suppression
    const locataire = await db.query(
      'SELECT logement_id FROM locataires_manuels WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (locataire.rows.length === 0) {
      return res.status(404).json({ erreur: 'Locataire non trouvé' });
    }

    // Remettre le logement en disponible
    if (locataire.rows[0].logement_id) {
      await db.query(
        'UPDATE logements SET statut = $1 WHERE id = $2',
        ['disponible', locataire.rows[0].logement_id]
      );
    }

    await db.query(
      'DELETE FROM locataires_manuels WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    res.json({ message: '✅ Locataire supprimé !' });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// ATTRIBUER UN LOGEMENT
// ================================
const attribuerLogement = async (req, res) => {
  try {
    const { id } = req.params;
    const { logement_id } = req.body;

    // Vérifier que le logement appartient au proprio
    const logement = await db.query(
      'SELECT id FROM logements WHERE id = $1 AND proprietaire_id = $2',
      [logement_id, req.user.id]
    );

    if (logement.rows.length === 0) {
      return res.status(403).json({
        erreur: 'Ce logement ne vous appartient pas'
      });
    }

    // Mettre à jour le locataire
    await db.query(
      'UPDATE locataires_manuels SET logement_id = $1 WHERE id = $2 AND proprietaire_id = $3',
      [logement_id, id, req.user.id]
    );

    // Mettre le logement en statut loué
    await db.query(
      'UPDATE logements SET statut = $1 WHERE id = $2',
      ['loue', logement_id]
    );

    res.json({ message: '✅ Logement attribué au locataire !' });

  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  creerLocataire,
  getMesLocataires,
  modifierLocataire,
  supprimerLocataire,
  attribuerLogement
};