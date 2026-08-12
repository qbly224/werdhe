const db = require('../database');
const { genererDocument } = require('../services/documentService');
var { envoyerPush } = require('../routes/push');
// ================================
// GÉNÉRER UN NUMÉRO DE FACTURE UNIQUE
// ================================
const genererNumeroFacture = async () => {
  const annee = new Date().getFullYear();
  const result = await db.query('SELECT COUNT(*) FROM paiements');
  const numero = parseInt(result.rows[0].count) + 1;
  const numeroFormate = String(numero).padStart(5, '0');
  return `WRD-${annee}-${numeroFormate}`;
};

// ================================
// EFFECTUER UN PAIEMENT
// ================================
const effectuerPaiement = async (req, res) => {
  try {
    const { reservation_id, mode_paiement } = req.body;

    if (!['en_ligne', 'especes'].includes(mode_paiement)) {
      return res.status(400).json({
        erreur: 'Mode de paiement invalide. Utilisez en_ligne ou especes'
      });
    }

    // Récupérer la réservation avec tous les détails
    const reservation = await db.query(
      `SELECT
        r.*,
        l.id as logement_db_id,
        l.proprietaire_id,
        l.titre as logement_titre,
        l.adresse as logement_adresse,
        l.ville as logement_ville,
        l.superficie, l.nb_chambres, l.nb_salles_bain,
        u_loc.id as loc_id,
        u_loc.nom as locataire_nom,
        u_loc.prenom as locataire_prenom,
        u_loc.email as locataire_email,
        u_loc.telephone as locataire_telephone,
        u_prop.id as prop_id,
        u_prop.nom as proprietaire_nom,
        u_prop.prenom as proprietaire_prenom,
        u_prop.email as proprietaire_email,
        u_prop.telephone as proprietaire_telephone
       FROM reservations r
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE r.id = $1`,
      [reservation_id]
    );

    if (reservation.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    const resa = reservation.rows[0];

    if (resa.statut !== 'confirmee') {
      return res.status(400).json({
        erreur: 'La réservation doit être confirmée avant le paiement'
      });
    }

    if (resa.locataire_id !== req.user.id) {
      return res.status(403).json({
        erreur: 'Vous n\'êtes pas autorisé à effectuer ce paiement'
      });
    }

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

    const numero_facture = await genererNumeroFacture();
    const statut = mode_paiement === 'especes' ? 'en_attente' : 'complete';

    // Créer le paiement
    const paiement = await db.query(
      `INSERT INTO paiements
        (reservation_id, locataire_id, proprietaire_id,
         montant, mode_paiement, statut, numero_facture)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        reservation_id, resa.locataire_id, resa.proprietaire_id,
        resa.montant_total, mode_paiement, statut, numero_facture
      ]
    );

    // Générer automatiquement facture + quittance si paiement complet
    if (statut === 'complete') {
      const docData = {
        reservation_id,
        paiement_id: paiement.rows[0].id,
        logement: {
          id: resa.logement_db_id,
          titre: resa.logement_titre,
          adresse: resa.logement_adresse,
          ville: resa.logement_ville,
          superficie: resa.superficie,
          nb_chambres: resa.nb_chambres,
          nb_salles_bain: resa.nb_salles_bain
        },
        proprietaire: {
          id: resa.prop_id,
          nom: resa.proprietaire_nom,
          prenom: resa.proprietaire_prenom,
          email: resa.proprietaire_email,
          telephone: resa.proprietaire_telephone
        },
        locataire: {
          id: resa.loc_id,
          nom: resa.locataire_nom,
          prenom: resa.locataire_prenom,
          email: resa.locataire_email,
          telephone: resa.locataire_telephone
        },
        periode: { debut: resa.date_debut, fin: resa.date_fin },
        montant: resa.montant_total,
        mode_paiement,
        duree_mois: resa.duree_mois,
        type_location: resa.type_location,
        envoyer_email: true
      };

      // Générer facture et quittance en parallèle
      await Promise.all([
        genererDocument({ ...docData, type: 'facture' }),
        genererDocument({ ...docData, type: 'quittance' })
      ]);
    }

    // Construire la facture pour la réponse
    const facture = {
      numero: numero_facture,
      date: new Date().toLocaleDateString('fr-FR'),
      statut,
      mode_paiement,
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
      periode: { debut: resa.date_debut, fin: resa.date_fin },
      montant: resa.montant_total,
      devise: 'GNF'
    };

    res.status(201).json({
      message: mode_paiement === 'especes'
        ? '✅ Paiement en espèces enregistré ! En attente de confirmation.'
        : '✅ Paiement effectué ! Facture et quittance envoyées par email.',
      facture,
      paiement: paiement.rows[0]
    });

  } catch (err) {
    console.error('Erreur paiement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
};

// ================================
// CONFIRMER UN PAIEMENT EN ESPÈCES
// ================================
const confirmerPaiementEspeces = async (req, res) => {
  try {
    const { id } = req.params;

    const paiement = await db.query(
      'SELECT * FROM paiements WHERE id = $1 AND proprietaire_id = $2',
      [id, req.user.id]
    );

    if (paiement.rows.length === 0) {
      return res.status(404).json({ erreur: 'Paiement non trouvé ou non autorisé' });
    }

    if (paiement.rows[0].mode_paiement !== 'especes') {
      return res.status(400).json({
        erreur: 'Seuls les paiements en espèces nécessitent une confirmation'
      });
    }

    const result = await db.query(
      `UPDATE paiements
       SET statut = 'complete', date_paiement = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      message: '✅ Paiement en espèces confirmé !',
      paiement: result.rows[0]
    });

  } catch (err) {
    console.error('Erreur confirmation paiement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
  envoyerPush(
  locataireId,
  '💰 Paiement confirmé',
  'Votre loyer de ' + new Intl.NumberFormat('fr-FR').format(montant) + ' GNF a été enregistré.',
  '/dashboard/paiements'
).catch(console.warn);
};

// ================================
// VOIR MES PAIEMENTS (locataire)
// ================================
const getMesPaiements = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
        l.titre as logement_titre,
        l.ville as logement_ville,
        r.date_debut, r.date_fin
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
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// VOIR LES PAIEMENTS REÇUS (propriétaire)
// ================================
const getPaiementsProprietaire = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
        l.titre as logement_titre,
        l.ville as logement_ville,
        u.nom as locataire_nom,
        u.prenom as locataire_prenom,
        u.telephone as locataire_telephone,
        r.date_debut, r.date_fin
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
      `SELECT p.*,
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
        r.date_debut, r.date_fin
       FROM paiements p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON p.locataire_id = u_loc.id
       JOIN users u_prop ON p.proprietaire_id = u_prop.id
       WHERE p.numero_facture = $1`,
      [numero]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Facture non trouvée' });
    }

    const p = result.rows[0];

    if (p.locataire_id !== req.user.id && p.proprietaire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Accès refusé à cette facture' });
    }

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