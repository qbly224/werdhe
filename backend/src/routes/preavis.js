const express  = require('express');
const router   = express.Router();
const db       = require('../database');
const verifierToken = require('../middleware/auth');
const { genererDocument, apercuDocument, enregistrerEvenement } = require('../services/documentService');
const { esc } = require('../services/documentTemplates');
const { delaiMinimumJours, delaiMaximumJours } = require('../config/preavis');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SQL_RESERVATION = `SELECT r.*,
    l.titre as logement_titre, l.adresse, l.ville, l.proprietaire_id,
    l.id as logement_id, l.superficie, l.nb_chambres, l.nb_salles_bain,
    u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
    u_loc.email as loc_email, u_loc.telephone as loc_tel,
    u_prop.nom as prop_nom, u_prop.prenom as prop_prenom,
    u_prop.email as prop_email, u_prop.telephone as prop_tel
  FROM reservations r
  JOIN logements l ON r.logement_id = l.id
  JOIN users u_loc ON r.locataire_id = u_loc.id
  JOIN users u_prop ON l.proprietaire_id = u_prop.id
  WHERE r.id = $1`;

function dateFr(d) {
  return new Date(d).toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry', day: '2-digit', month: 'long', year: 'numeric' });
}

// Valide la demande et prépare les données communes à l'aperçu et à l'envoi.
// Renvoie { erreur, statut } ou { r, auteur, dateDepart, jours, motif, note, min }.
async function preparer(req) {
  const { reservation_id, motif, note, date_depart, delai_mois } = req.body || {};

  if (!UUID.test(String(reservation_id || ''))) return { statut: 404, erreur: 'Réservation non trouvée' };
  const motifNet = String(motif || '').trim();
  if (motifNet.length < 3 || motifNet.length > 200) return { statut: 400, erreur: 'Indiquez le motif du préavis (200 caractères maximum)' };
  const noteNette = String(note || '').trim();
  if (noteNette.length > 300) return { statut: 400, erreur: 'Le message est limité à 300 caractères' };

  const resa = await db.query(SQL_RESERVATION, [reservation_id]);
  if (resa.rows.length === 0) return { statut: 404, erreur: 'Réservation non trouvée' };
  const r = resa.rows[0];

  // Seules les deux parties de la location peuvent donner un préavis ; le rôle
  // (locataire ou bailleur) vient de la location, jamais de la requête.
  const auteur = r.locataire_id === req.user.id ? 'locataire'
    : (r.proprietaire_id === req.user.id ? 'proprietaire' : null);
  if (!auteur) return { statut: 403, erreur: 'Non autorisé' };
  if (r.statut !== 'confirmee') return { statut: 409, erreur: 'Aucune location active pour ce préavis' };

  const existant = await db.query(
    `SELECT 1 FROM preavis WHERE reservation_id = $1 AND statut IN ('envoye', 'accuse') LIMIT 1`,
    [reservation_id]
  );
  if (existant.rows.length > 0) return { statut: 409, erreur: 'Un préavis est déjà en cours pour cette location' };

  const aujourdhui = new Date(); aujourdhui.setUTCHours(0, 0, 0, 0);
  let dateDepart;
  if (date_depart) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date_depart))) return { statut: 400, erreur: 'Date de départ invalide' };
    dateDepart = new Date(date_depart + 'T00:00:00Z');
    if (isNaN(dateDepart.getTime())) return { statut: 400, erreur: 'Date de départ invalide' };
  } else if (delai_mois) {
    // Anciens clients : un délai en mois (1 à 12) convertit en date.
    const n = parseInt(delai_mois, 10);
    if (!(n >= 1 && n <= 12)) return { statut: 400, erreur: 'Délai invalide' };
    dateDepart = new Date(aujourdhui.getTime() + n * 30 * 86400000);
  } else {
    return { statut: 400, erreur: 'Choisissez la date de départ' };
  }

  const jours = Math.round((dateDepart - aujourdhui) / 86400000);
  const min = delaiMinimumJours(auteur);
  if (jours < min) {
    const plusTot = new Date(aujourdhui.getTime() + min * 86400000);
    return { statut: 400, erreur: 'Le préavis doit être d\'au moins ' + min + ' jours : la date de départ ne peut pas être avant le ' + dateFr(plusTot) };
  }
  if (jours > delaiMaximumJours) return { statut: 400, erreur: 'La date de départ est trop éloignée (2 ans maximum)' };

  return { r, auteur, dateDepart, jours, motif: motifNet, note: noteNette, min };
}

function paramsDocument(p, extra) {
  const r = p.r;
  return Object.assign({
    type: 'preavis',
    reservation_id: r.id,
    logement: { id: r.logement_id, titre: r.logement_titre, adresse: r.adresse, ville: r.ville,
      superficie: r.superficie, nb_chambres: r.nb_chambres, nb_salles_bain: r.nb_salles_bain },
    proprietaire: { id: r.proprietaire_id, nom: r.prop_nom, prenom: r.prop_prenom, email: r.prop_email, telephone: r.prop_tel },
    locataire: { id: r.locataire_id, nom: r.loc_nom, prenom: r.loc_prenom, email: r.loc_email, telephone: r.loc_tel },
    date_depart: p.dateDepart, auteur: p.auteur, motif: p.motif, note: p.note || null,
    delai_minimum_jours: p.min, envoyer_email: false
  }, extra || {});
}

// ─── APERÇU AVANT ENVOI (rien n'est enregistré) ──────────────────
router.post('/apercu', verifierToken, async (req, res) => {
  try {
    const p = await preparer(req);
    if (p.erreur) return res.status(p.statut).json({ erreur: p.erreur });
    res.json({ html: apercuDocument(paramsDocument(p)), delai_minimum_jours: p.min, jours: p.jours });
  } catch (err) {
    console.error('[POST /preavis/apercu]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉLAI MINIMUM (pour le calendrier du formulaire) ────────────
router.get('/delai-minimum', verifierToken, (req, res) => {
  res.json({
    locataire: delaiMinimumJours('locataire'),
    proprietaire: delaiMinimumJours('proprietaire'),
    maximum: delaiMaximumJours
  });
});

// ─── CRÉER ET ENVOYER UN PRÉAVIS ─────────────────────────────────
// Crée le préavis ET son document, figé (verrouillé) à l'envoi : il ne se
// modifie plus, le destinataire peut en accuser réception.
router.post('/', verifierToken, async (req, res) => {
  let preavisId = null;
  try {
    const p = await preparer(req);
    if (p.erreur) return res.status(p.statut).json({ erreur: p.erreur });
    const r = p.r;
    const estLocataire = p.auteur === 'locataire';
    const expediteurNom = estLocataire ? r.loc_prenom + ' ' + r.loc_nom : r.prop_prenom + ' ' + r.prop_nom;
    const destEmail  = estLocataire ? r.prop_email  : r.loc_email;
    const destPrenom = estLocataire ? r.prop_prenom : r.loc_prenom;
    const destNom    = estLocataire ? r.prop_nom    : r.loc_nom;
    const dateSortie = dateFr(p.dateDepart);

    // ── 1. Préavis ─────────────────────────────────────────────
    let preavis;
    try {
      const ins = await db.query(
        `INSERT INTO preavis
           (reservation_id, auteur_id, type, motif, delai_mois, note, date_sortie_estimee, statut)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'envoye')
         RETURNING *`,
        [r.id, req.user.id, p.auteur, p.motif, Math.max(1, Math.ceil(p.jours / 30)), p.note || null, p.dateDepart]
      );
      preavis = ins.rows[0];
      preavisId = preavis.id;
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ erreur: 'Un préavis est déjà en cours pour cette location' });
      throw e;
    }

    // ── 2. Document verrouillé ─────────────────────────────────
    const gen = await genererDocument(paramsDocument(p, { auteur_id: req.user.id }));
    if (!gen.success) {
      await db.query('DELETE FROM preavis WHERE id = $1', [preavisId]);
      console.error('[POST /preavis] document non généré:', gen.erreur);
      return res.status(500).json({ erreur: 'Le document du préavis n\'a pas pu être généré, réessayez' });
    }
    await db.query('UPDATE preavis SET document_id = $1 WHERE id = $2', [gen.document.id, preavisId]);
    preavis.document_id = gen.document.id;

    // ── 3. E-mail avec le document en pièce jointe (non bloquant) ─
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        const resend     = new Resend(process.env.RESEND_API_KEY);
        const envoi = await resend.emails.send({
          from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
          to:      destEmail,
          subject: (estLocataire ? 'Préavis de départ pour ' : 'Préavis de résiliation pour ') + r.logement_titre,
          html: `
            <div style="font-family:sans-serif;max-width:540px;margin:0 auto">
              <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:34px;height:34px;"><img src="https://werdhe.com/logo192.png" width="34" height="34" alt="Werdhe" style="display:block;border-radius:9px;width:34px;height:34px;" /></td><td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:17px;color:#fff;">Werdhe</td></tr></table>
              </div>
              <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                <p>Bonjour <b>${esc(destPrenom)}</b>,</p>
                <p>${estLocataire
                  ? '<b>' + esc(expediteurNom) + '</b> vous a envoyé un préavis de départ pour <b>' + esc(r.logement_titre) + '</b>.'
                  : 'Votre bailleur <b>' + esc(expediteurNom) + '</b> vous a envoyé un préavis de fin de bail pour <b>' + esc(r.logement_titre) + '</b>.'
                }</p>
                <div style="background:#FFF8E1;border:1px solid #FFE082;border-radius:8px;padding:14px;margin:16px 0">
                  <div style="font-size:13px;margin-bottom:8px;font-weight:700;color:#7B4F00">Détails du préavis</div>
                  <table style="width:100%;font-size:12px">
                    <tr><td style="color:#888">Logement</td><td style="text-align:right;font-weight:600">${esc(r.logement_titre)}</td></tr>
                    <tr><td style="color:#888">Motif</td><td style="text-align:right;font-weight:600">${esc(p.motif)}</td></tr>
                    <tr><td style="color:#888">Date de départ</td><td style="text-align:right;font-weight:600">${esc(dateSortie)}</td></tr>
                    <tr><td style="color:#888">Document</td><td style="text-align:right;font-weight:600">${esc(gen.numero)}</td></tr>
                  </table>
                </div>
                ${p.note ? '<p style="font-style:italic;color:#555">"' + esc(p.note) + '"</p>' : ''}
                <p>Le préavis est joint à ce message. Accusez réception depuis votre tableau de bord dans les <b>48h</b>.</p>
                <a href="https://werdhe.com/dashboard"
                   style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
                  Accéder à mon espace →
                </a>
              </div>
            </div>
          `,
          attachments: [{ filename: gen.numero + '.html', content: Buffer.from(gen.document.contenu_html).toString('base64'), content_type: 'text/html' }]
        });
        if (envoi && envoi.error) throw new Error(envoi.error.message);
        await db.query('UPDATE documents SET email_envoye = TRUE, email_envoye_at = NOW() WHERE id = $1', [gen.document.id]);
        await enregistrerEvenement(gen.document.id, 'envoye_email', req.user.id, { destinataire: destEmail }, req.ip);
      } catch (emailErr) {
        console.warn('[Préavis] Email non envoyé (non bloquant):', emailErr.message);
      }
    }

    // ── 4. Notifications (propriétaire + destinataire) ─────────
    try {
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2, 'bail_bientot', $3, $4, 'haute')`,
        [
          r.proprietaire_id, r.logement_id,
          estLocataire ? 'Préavis reçu pour ' + r.logement_titre : 'Préavis envoyé à ' + r.loc_prenom + ' ' + r.loc_nom,
          'Date de départ : ' + dateSortie
        ]
      );
      const destinataireId = estLocataire ? r.proprietaire_id : r.locataire_id;
      if (destinataireId) {
        await db.query(
          `INSERT INTO alertes
             (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
           VALUES ($1, $2, $3, 'bail_bientot', $4, $5, 'haute')`,
          [
            r.proprietaire_id, destinataireId, r.logement_id,
            estLocataire ? 'Préavis reçu pour ' + r.logement_titre : 'Préavis de votre propriétaire pour ' + r.logement_titre,
            'Date de départ : ' + dateSortie + ' · Motif : ' + p.motif + ' · Accusez réception sous 48 h'
          ]
        );
      }
    } catch (alerteErr) {
      console.warn('[Préavis] Notification échouée (non bloquant):', alerteErr.message);
    }

    res.status(201).json({
      message:     'Préavis envoyé avec succès !',
      preavis:     preavis,
      document_id: gen.document.id,
      numero:      gen.numero,
      date_sortie: dateSortie,
      date_depart: p.dateDepart.toISOString().slice(0, 10),
      dest_prenom: destPrenom,
      dest_nom:    destNom
    });

  } catch (err) {
    console.error('[POST /preavis] ERREUR:', err.message);
    if (preavisId) await db.query('DELETE FROM preavis WHERE id = $1 AND document_id IS NULL', [preavisId]).catch(function() {});
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── LISTE MES PRÉAVIS ───────────────────────────────────────────
router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.auteur_id = $1
          OR r.locataire_id = $1
          OR l.proprietaire_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    console.error('[GET /preavis]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── RÉPONDRE À UN PRÉAVIS (accepter ou renouveler) ──────────────
router.patch('/:id/repondre', verifierToken, async (req, res) => {
  try {
    const { id }      = req.params;
    const { reponse, message } = req.body;
    // reponse = 'accepte' ou 'renouveler'

    const preavis = await db.query(
      `SELECT p.*,
         r.locataire_id,
         l.titre as logement_titre, l.proprietaire_id,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom, u_loc.email as loc_email,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom, u_prop.email as prop_email
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.id = $1`,
      [id]
    );

    if (preavis.rows.length === 0) {
      return res.status(404).json({ erreur: 'Préavis non trouvé' });
    }

    const p = preavis.rows[0];

    // Vérifier que l'utilisateur est bien le destinataire
    var estDestinataire = req.user.id === p.locataire_id || req.user.id === p.proprietaire_id;
    var estAuteur       = req.user.id === p.auteur_id;
    if (!estDestinataire || estAuteur) {
      return res.status(403).json({ erreur: 'Non autorisé' });
    }
    if (p.statut !== 'envoye') {
      return res.status(409).json({ erreur: 'Ce préavis a déjà reçu une réponse' });
    }

    if (reponse === 'accepte') {
      // Marquer le préavis comme accusé
      await db.query(
        `UPDATE preavis SET statut = 'accuse', accuse_at = NOW(), accuse_par = $2 WHERE id = $1`,
        [id, req.user.id]
      );
      if (p.document_id) await enregistrerEvenement(p.document_id, 'accuse_reception', req.user.id, { reponse: 'accuse' }, req.ip);

      // Notifier l'auteur
      var titreNotif = p.type === 'locataire'
        ? '✅ ' + p.prop_prenom + ' ' + p.prop_nom + ' a accusé réception de votre préavis'
        : '✅ ' + p.loc_prenom + ' ' + p.loc_nom + ' a accusé réception de votre préavis';

      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2,
           (SELECT logement_id FROM reservations WHERE id = $3),
           'bail_bientot', $4, $5, 'haute')`,
        [
          p.proprietaire_id,
          p.auteur_id,
          p.reservation_id,
          titreNotif,
          'Le départ est confirmé pour ' + new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR')
        ]
      );

      // Email à l'auteur
      if (process.env.RESEND_API_KEY) {
        try {
          const { Resend } = require('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          var destEmail = p.type === 'locataire' ? p.loc_email : p.prop_email;
          await resend.emails.send({
            from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
            to:      destEmail,
            subject: 'Accusé de réception de votre préavis pour ' + p.logement_titre,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <div style="background:#1B6B3A;padding:20px;border-radius:12px 12px 0 0">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:34px;height:34px;"><img src="https://werdhe.com/logo192.png" width="34" height="34" alt="Werdhe" style="display:block;border-radius:9px;width:34px;height:34px;" /></td><td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:17px;color:#fff;">Werdhe</td></tr></table>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0e0e0">
                  <p>Votre préavis pour <b>${esc(p.logement_titre)}</b> a fait l'objet d'un <b style="color:#1B6B3A">accusé de réception</b>.</p>
                  <div style="background:#E8F5E9;border-radius:8px;padding:14px;margin:16px 0">
                    <div style="font-size:13px;color:#555">Date de sortie confirmée</div>
                    <div style="font-size:20px;font-weight:700;color:#1B6B3A">${new Date(p.date_sortie_estimee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                  ${message ? '<p style="font-style:italic;color:#666">Message : "' + esc(String(message).slice(0, 300)) + '"</p>' : ''}
                  <a href="https://werdhe.com/dashboard" style="display:inline-block;background:#1B6B3A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Voir mon espace →</a>
                </div>
              </div>
            `
          });
        } catch (e) {
          console.warn('[Réponse préavis] Email non envoyé:', e.message);
        }
      }

      return res.json({ message: 'Accusé de réception enregistré', statut: 'accuse' });
    }

    if (reponse === 'renouveler') {
      // Marquer le préavis comme annulé (changement d'avis)
      await db.query(
        `UPDATE preavis SET statut = 'termine', accuse_at = NOW(), accuse_par = $2 WHERE id = $1`,
        [id, req.user.id]
      );
      if (p.document_id) await enregistrerEvenement(p.document_id, 'accuse_reception', req.user.id, { reponse: 'renouvellement' }, req.ip);

      // Notifier l'auteur
      await db.query(
        `INSERT INTO alertes
           (proprietaire_id, destinataire_id, logement_id, type, titre, description, priorite)
         VALUES ($1, $2,
           (SELECT logement_id FROM reservations WHERE id = $3),
           'bail_bientot', $4, $5, 'haute')`,
        [
          p.proprietaire_id,
          p.auteur_id,
          p.reservation_id,
          '🔄 Demande de renouvellement pour ' + p.logement_titre,
          (p.type === 'locataire' ? p.prop_prenom + ' ' + p.prop_nom : p.loc_prenom + ' ' + p.loc_nom) +
            ' souhaite renouveler le bail' + (message ? ' : "' + message + '"' : '')
        ]
      );

      return res.json({ message: 'Demande de renouvellement envoyée', statut: 'termine' });
    }

    res.status(400).json({ erreur: 'Réponse invalide (accepte ou renouveler)' });

  } catch (err) {
    console.error('[PATCH /preavis/:id/repondre]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── PRÉAVIS REÇUS ────────────────────────────────────────────────
router.get('/recus', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*,
         l.titre as logement_titre,
         u_loc.nom as loc_nom, u_loc.prenom as loc_prenom,
         u_prop.nom as prop_nom, u_prop.prenom as prop_prenom
       FROM preavis p
       JOIN reservations r ON p.reservation_id = r.id
       JOIN logements l ON r.logement_id = l.id
       JOIN users u_loc ON r.locataire_id = u_loc.id
       JOIN users u_prop ON l.proprietaire_id = u_prop.id
       WHERE p.auteur_id != $1
         AND (r.locataire_id = $1 OR l.proprietaire_id = $1)
         AND p.statut = 'envoye'
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ preavis: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;