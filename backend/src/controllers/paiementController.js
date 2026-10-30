const db = require('../database');
const { genererDocument } = require('../services/documentService');
var { envoyerPush } = require('../routes/push');
const djomyService = require('../services/djomyService');
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

    if (resa.locataire_id !== req.user.id && resa.proprietaire_id !== req.user.id) {
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
        // Si c'est le proprio qui enregistre le paiement espèces → complete directement
    var estProprio = req.user.id === resa.proprietaire_id;
    const statut = (mode_paiement === 'especes' && estProprio) ? 'complete' : 
                   mode_paiement === 'especes' ? 'en_attente' : 'complete';

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
      await genererDocumentsPourReservation(resa, paiement.rows[0].id, resa.montant_total, mode_paiement);
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

    const p = result.rows[0];
    envoyerPush(
      p.locataire_id,
      '💰 Paiement confirmé',
      'Votre loyer de ' + new Intl.NumberFormat('fr-FR').format(p.montant) + ' GNF a été enregistré.',
      '/dashboard/paiements'
    ).catch(console.warn);

    res.json({
      message: '✅ Paiement en espèces confirmé !',
      paiement: p
    });

  } catch (err) {
    console.error('Erreur confirmation paiement:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// Construit les données de facture/quittance à partir d'une réservation
// déjà jointe (resa) et génère les deux documents en parallèle.
// ================================
async function genererDocumentsPourReservation(resa, paiement_id, montant, mode_paiement) {
  const docData = {
    reservation_id: resa.id,
    paiement_id,
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
    montant,
    mode_paiement,
    duree_mois: resa.duree_mois,
    type_location: resa.type_location,
    envoyer_email: true
  };

  await Promise.all([
    genererDocument({ ...docData, type: 'facture' }),
    genererDocument({ ...docData, type: 'quittance' })
  ]);
}

// ================================
// Récupère une réservation avec toutes les jointures nécessaires à la
// génération de facture/quittance (même structure que effectuerPaiement).
// ================================
async function recupererReservationJointe(reservation_id) {
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
  return reservation.rows[0] || null;
}

function mapperStatutDjomy(statutDjomy) {
  if (statutDjomy === 'SUCCESS') return 'complete';
  if (statutDjomy === 'FAILED' || statutDjomy === 'CANCELLED') return 'echoue';
  return 'en_attente';
}

// ================================
// INITIER UN PAIEMENT DE LOYER VIA DJOMY (redirection)
// ================================
const initierPaiementDjomy = async (req, res) => {
  try {
    const { reservation_id, telephone } = req.body;
    if (!reservation_id || !telephone) {
      return res.status(400).json({ erreur: 'reservation_id et telephone requis' });
    }

    const resa = await recupererReservationJointe(reservation_id);
    if (!resa) {
      return res.status(404).json({ erreur: 'Réservation non trouvée' });
    }

    if (resa.locataire_id !== req.user.id) {
      return res.status(403).json({ erreur: 'Vous n\'êtes pas autorisé à payer cette réservation' });
    }

    if (resa.statut !== 'confirmee') {
      return res.status(400).json({ erreur: 'La réservation doit être confirmée avant le paiement' });
    }

    const dejaPaye = await db.query(
      `SELECT id FROM paiements WHERE reservation_id = $1 AND statut = 'complete'`,
      [reservation_id]
    );
    if (dejaPaye.rows.length > 0) {
      return res.status(400).json({ erreur: 'Cette réservation a déjà été payée' });
    }

    const enAttente = await db.query(
      `SELECT id FROM paiements WHERE reservation_id = $1 AND statut = 'en_attente'`,
      [reservation_id]
    );
    if (enAttente.rows.length > 0) {
      return res.status(400).json({ erreur: 'Un paiement est déjà en cours pour cette réservation. Vérifiez son statut avant de réessayer.' });
    }

    const reference = 'WRD-RESA-' + reservation_id + '-' + Date.now();

    const paiement = await db.query(
      `INSERT INTO paiements (reservation_id, locataire_id, proprietaire_id, montant, mode_paiement, statut)
       VALUES ($1, $2, $3, $4, 'djomy', 'en_attente') RETURNING *`,
      [reservation_id, resa.locataire_id, resa.proprietaire_id, resa.montant_total]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://werdhe.com';
    const returnUrl = frontendUrl + '/dashboard?paiement_loyer=' + paiement.rows[0].id;

    let gateway;
    try {
      gateway = await djomyService.initierPaiementGateway({
        montant: resa.montant_total,
        telephone,
        description: 'Loyer - ' + resa.logement_titre,
        reference,
        returnUrl,
        metadata: { paiement_id: paiement.rows[0].id, type: 'loyer' }
      });
    } catch (erreurDjomy) {
      await db.query(`DELETE FROM paiements WHERE id = $1`, [paiement.rows[0].id]);
      throw erreurDjomy;
    }

    await db.query(`UPDATE paiements SET reference_externe = $1 WHERE id = $2`, [gateway.transactionId, paiement.rows[0].id]);

    res.status(201).json({
      message: 'Redirection vers le paiement...',
      redirectUrl: gateway.redirectUrl,
      transactionId: gateway.transactionId,
      paiement_id: paiement.rows[0].id
    });
  } catch (err) {
    console.error('Erreur initiation paiement Djomy:', err.message);
    res.status(err.validation ? 400 : 500).json({ erreur: err.validation ? err.message : 'Erreur serveur : ' + err.message });
  }
};

// ================================
// VÉRIFIER LE STATUT D'UN PAIEMENT DJOMY (appelé par le front après retour)
// ================================
const verifierStatutDjomy = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM paiements WHERE id = $1 AND (locataire_id = $2 OR proprietaire_id = $2)`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Paiement non trouvé' });
    }

    let p = result.rows[0];
    if (p.statut === 'complete' || !p.reference_externe) {
      return res.json({ statut: p.statut, paiement: p });
    }

    const statutDjomy = await djomyService.recupererStatutPaiement(p.reference_externe);
    const paiementConfirme = await confirmerPaiementDjomy(p.reference_externe, statutDjomy.status);
    if (paiementConfirme) p = paiementConfirme;

    res.json({ statut: p.statut, paiement: p });
  } catch (err) {
    console.error('Erreur vérification statut Djomy:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// Marque un paiement loyer Djomy comme complété/échoué d'après le statut
// renvoyé par Djomy (webhook ou vérification manuelle). Idempotent :
// ne modifie rien si le paiement est déjà 'complete'.
// ================================
async function confirmerPaiementDjomy(transactionId, statutDjomyBrut) {
  const nouveauStatut = mapperStatutDjomy(statutDjomyBrut);

  const maj = await db.query(
    `UPDATE paiements
     SET statut = $1, date_paiement = CASE WHEN $1 = 'complete' THEN NOW() ELSE date_paiement END
     WHERE reference_externe = $2 AND statut != 'complete'
     RETURNING *`,
    [nouveauStatut, transactionId]
  );

  if (maj.rows.length === 0) return null;
  const p = maj.rows[0];

  if (nouveauStatut === 'complete') {
    const resa = await recupererReservationJointe(p.reservation_id);
    if (resa) {
      await genererDocumentsPourReservation(resa, p.id, p.montant, 'djomy');
    }
    envoyerPush(
      p.locataire_id,
      '💰 Paiement confirmé',
      'Votre loyer de ' + new Intl.NumberFormat('fr-FR').format(p.montant) + ' GNF a été enregistré.',
      '/dashboard/paiements'
    ).catch(console.warn);
  }

  return p;
}

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
      [req.proprietaireEffectifId || req.user.id]
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
  getFacture,
  initierPaiementDjomy,
  verifierStatutDjomy,
  confirmerPaiementDjomy
};