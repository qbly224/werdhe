const db = require('../database');

// ================================
// GÉNÉRER UN NUMÉRO DE FACTURE UNIQUE
// ================================
// Format : WRD-2024-00001
// Comme un numéro de série — chaque facture est unique et traçable
const genererNumeroFacture = async () => {
  const annee = new Date().getFullYear();

  // Compter le nombre de paiements existants pour incrémenter
  const result = await db.query(
    'SELECT COUNT(*) FROM paiements'
  );

  const numero = parseInt(result.rows[0].count) + 1;

  // Formater avec des zéros devant (00001, 00002, etc.)
  const numeroFormate = String(numero).padStart(5, '0');

  return `WRD-${annee}-${numeroFormate}`;
};

// ================================
// EFFECTUER UN PAIEMENT
// ================================
const effectuerPaiement = async (req, res) => {
  try {
    const { reservation_id, mode_paiement } = req.body;

    // 1. Vérifier le mode de paiement
    if (!['en_ligne', 'especes'].includes(mode_paiement)) {
      return res.status(400).json({
        erreur: 'Mode de paiement invalide. Utilisez en_ligne ou especes'
      });
    }

    // 2. Récupérer la réservation avec tous les détails
    const reservation = await db.query(
      `SELECT 
        r.*,
        l.proprietaire_id,
        l.titre as logement_titre,
        l.adresse as logement_adresse,
        l.ville as logement_ville,
        u_loc.nom as locataire_nom,
        u_loc.prenom as locataire_prenom,
        u_loc.email as locataire_email,
        u_prop.nom as proprietaire_nom,
        u_prop.prenom as proprietaire_prenom
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Réservation non trouvée'
      });
    }

    const resa = reservation.rows[0];

    // 3. Vérifier que la réservation est confirmée
    if (resa.statut !== 'confirmee') {
      return res.status(400).json({
        erreur: 'La réservation doit être confirmée avant le paiement'
      });
    }

    // 4. Vérifier que c'est bien le locataire qui paie
    if (resa.locataire_id !== req.user.id) {
      return res.status(403).json({
        erreur: 'Vous n\'êtes pas autorisé à effectuer ce paiement'
      });
    }

    // 5. Vérifier qu'il n'y a pas déjà un paiement completé
    const paiementExistant = await db.query(
      `SELECT id FROM paiements 
       WHERE reservation_id = $1 AND statut = 'complete'`,
      [reservation_id]
    );

    if (paiementExistant.rows.length > 0) {
      return res.status(400).json({
        erreur: 'Cette réservation a déjà été payée'
      });
    }

    // 6. Générer le numéro de facture unique
    const numero_facture = await genererNumeroFacture();

    // 7. Pour le paiement en espèces → statut "en_attente"
    //    Pour le paiement en ligne → statut "complete" (simulation)
    //    En production, le paiement en ligne passerait par une API externe
    const statut = mode_paiement === 'especes' ? 'en_attente' : 'complete';

    // 8. Créer le paiement en base de données
    const paiement = await db.query(
      `INSERT INTO paiements 
        (reservation_id, locataire_id, proprietaire_id, 
         montant, mode_paiement, statut, numero_facture)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        reservation_id,
        resa.locataire_id,
        resa.proprietaire_id,
        resa.montant_total,
        mode_paiement,
        statut,
        numero_facture
      ]
    );

    // 9. Construire la facture complète
    const facture = {
      numero: numero_facture,
      date: new Date().toLocaleDateString('fr-FR'),
      statut: statut,
      mode_paiement: mode_paiement,
      locataire: {
        nom: `${resa.locataire_prenom} ${resa.locataire_nom}`,
        email: resa.locataire_email
      },
      proprietaire: {
        nom: `${resa.proprietaire_prenom} ${resa.proprietaire_nom}`
      },
      logement: {
        titre: resa.logement_titre,
        adresse: resa.logement_adresse,
        ville: resa.logement_ville
      },
      periode: {
        debut: resa.date_debut,
        fin: resa.date_fin
      },
      montant: resa.montant_total,
      devise: 'GNF'
    };

    res.status(201).json({
      message: mode_paiement === 'especes'
        ? '✅ Paiement en espèces enregistré ! En attente de confirmation du propriétaire.'
        : '✅ Paiement en ligne effectué avec succès !',
      facture,
      paiement: paiement.rows[0]
    });

  } catch (err) {
    console.error('Erreur paiement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// CONFIRMER UN PAIEMENT EN ESPÈCES (propriétaire)
// ================================
// Quand le propriétaire reçoit le cash, il confirme dans l'app
const confirmerPaiementEspeces = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le paiement appartient bien au propriétaire
    const paiement = await db.query(
      `SELECT * FROM paiements WHERE id = $1 AND proprietaire_id = $2`,
      [id, req.user.id]
    );

    if (paiement.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Paiement non trouvé ou non autorisé'
      });
    }

    if (paiement.rows[0].mode_paiement !== 'especes') {
      return res.status(400).json({
        erreur: 'Seuls les paiements en espèces nécessitent une confirmation'
      });
    }

    // Mettre à jour le statut du paiement
    const result = await db.query(
      `UPDATE paiements 
       SET statut = 'complete', date_paiement = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: '✅ Paiement en espèces confirmé ! Facture générée.',
      paiement: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur confirmation paiement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR MES PAIEMENTS (locataire)
// ================================
const getMesPaiements = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        p.*,
        l.titre as logement_titre,
        l.ville as logement_ville,
        r.date_debut,
        r.date_fin
       FROM paiements p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       WHERE p.locataire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: `✅ ${result.rows.length} paiement(s)`,
      paiements: result.rows
    });

  } catch (err) {
    console.error('Erreur mes paiements:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR LES PAIEMENTS REÇUS (propriétaire)
// ================================
const getPaiementsProprietaire = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        p.*,
        l.titre as logement_titre,
        l.ville as logement_ville,
        u.nom as locataire_nom,
        u.prenom as locataire_prenom,
        u.telephone as locataire_telephone,
        r.date_debut,
        r.date_fin
       FROM paiements p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u ON p.locataire_id = u.id
       WHERE p.proprietaire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: `✅ ${result.rows.length} paiement(s) reçus`,
      paiements: result.rows
    });

  } catch (err) {
    console.error('Erreur paiements propriétaire:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR UNE FACTURE EN DÉTAIL
// ================================
const getFacture = async (req, res) => {
  try {
    const { numero } = req.params;

    const result = await db.query(
      `SELECT 
        p.*,
        u_loc.nom as locataire_nom,
        u_loc.prenom as locataire_prenom,
        u_loc.email as locataire_email,
        u_loc.telephone as locataire_telephone,
        u_prop.nom as proprietaire_nom,
        u_prop.prenom as proprietaire_prenom,
        u_prop.telephone as proprietaire_telephone,
        l.titre as logement_titre,
        l.adresse as logement_adresse,
        l.ville as logement_ville,
        r.date_debut,
        r.date_fin
       FROM paiements p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON p.locataire_id = u_loc.id
       JOIN users u_prop ON p.proprietaire_id = u_prop.id
       WHERE p.numero_facture = $1`,
      [numero]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erreur: 'Facture non trouvée'
      });
    }

    const p = result.rows[0];

    // Construire la facture formatée
    const facture = {
      numero: p.numero_facture,
      date_emission: new Date(p.created_at).toLocaleDateString('fr-FR'),
      date_paiement: p.date_paiement
        ? new Date(p.date_paiement).toLocaleDateString('fr-FR')
        : 'En attente',
      statut: p.statut,
      mode_paiement: p.mode_paiement,
      locataire: {
        nom: `${p.locataire_prenom} ${p.locataire_nom}`,
        email: p.locataire_email,
        telephone: p.locataire_telephone
      },
      proprietaire: {
        nom: `${p.proprietaire_prenom} ${p.proprietaire_nom}`,
        telephone: p.proprietaire_telephone
      },
      logement: {
        titre: p.logement_titre,
        adresse: p.logement_adresse,
        ville: p.logement_ville
      },
      periode: {
        debut: new Date(p.date_debut).toLocaleDateString('fr-FR'),
        fin: p.date_fin
          ? new Date(p.date_fin).toLocaleDateString('fr-FR')
          : 'Non définie'
      },
      montant: p.montant,
      devise: 'GNF'
    };

    res.json({ facture });

  } catch (err) {
    console.error('Erreur récupération facture:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  effectuerPaiement,
  confirmerPaiementEspeces,
  getMesPaiements,
  getPaiementsProprietaire,
  getFacture
};