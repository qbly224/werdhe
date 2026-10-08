const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── BADGE DE MARQUE (table-based, fiable dans tous les clients mail) ──
function logoBadge() {
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
    <td style="width:40px;height:40px;border-radius:11px;background:#F5A623;text-align:center;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:900;font-size:19px;color:#14251A;">W</td>
    <td style="padding-left:10px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:19px;color:#fff;letter-spacing:-0.3px;">Werdhe</td>
  </tr></table>`;
}

// ================================
// EMAIL RESET MOT DE PASSE
// ================================
const envoyerEmailReset = async (email, prenom, lienReset) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Réinitialisation de votre mot de passe Werdhe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:480px;margin:0 auto;padding:40px 16px;">
            <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <div style="background:#14251A;padding:32px 24px;text-align:center;">
                ${logoBadge()}
              </div>
              <div style="padding:36px 32px;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#1B2B22;">Réinitialisation du mot de passe</h1>
                <p style="margin:0 0 8px;color:#444;line-height:1.6;font-size:15px;">Bonjour <strong>${prenom}</strong>,</p>
                <p style="margin:0 0 28px;color:#444;line-height:1.6;font-size:15px;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                  <tr><td style="border-radius:10px;background:#1B6B3A;">
                    <a href="${lienReset}" style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;border-radius:10px;">Réinitialiser mon mot de passe</a>
                  </td></tr>
                </table>
                <div style="background:#FFF8E1;border-left:3px solid #F5A623;border-radius:6px;padding:12px 16px;font-size:13px;color:#7A5B00;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</div>
              </div>
              <div style="background:#FAFAFA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #F0F0F0;">© 2026 Werdhe — Guinée</div>
            </div>
          </div>
        </body>
        </html>
      `
    });
    return true;
  } catch (err) {
    console.error('Erreur email reset:', err);
    return false;
  }
};

// ================================
// EMAIL DOCUMENT (facture, quittance, contrat)
// ================================
const envoyerEmailDocument = async ({
  email, prenom, typeDocument, numeroDocument,
  htmlDocument, nomFichier
}) => {
  const titres = {
    facture: 'Votre facture Werdhe',
    quittance: 'Votre quittance de loyer Werdhe',
    contrat_bail: 'Votre contrat de bail Werdhe'
  };

  const descriptions = {
    facture: 'Veuillez trouver ci-joint votre facture de loyer.',
    quittance: 'Veuillez trouver ci-joint votre quittance de loyer mensuelle.',
    contrat_bail: 'Veuillez trouver ci-joint votre contrat de bail.'
  };

  const abreviations = {
    facture: 'FA',
    quittance: 'QT',
    contrat_bail: 'CB'
  };

  const libelles = {
    facture: 'Facture de loyer',
    quittance: 'Quittance de loyer',
    contrat_bail: 'Contrat de bail'
  };

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: `${titres[typeDocument] || 'Document Werdhe'} - ${numeroDocument}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;padding:40px 16px;">
            <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <div style="background:#14251A;padding:32px 24px;text-align:center;">
                ${logoBadge()}
              </div>
              <div style="padding:36px 32px;">
                <p style="margin:0 0 8px;color:#444;line-height:1.7;font-size:15px;">Bonjour <strong>${prenom}</strong>,</p>
                <p style="margin:0 0 24px;color:#444;line-height:1.7;font-size:15px;">${descriptions[typeDocument] || 'Veuillez trouver ci-joint votre document.'}</p>

                <div style="background:#F7F8F7;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
                  <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px;"><tr>
                    <td style="width:52px;height:52px;border-radius:14px;background:#1B6B3A;text-align:center;vertical-align:middle;font-weight:800;font-size:16px;color:#fff;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">${abreviations[typeDocument] || 'DOC'}</td>
                  </tr></table>
                  <div style="font-size:19px;font-weight:800;color:#1B5E20;">${numeroDocument}</div>
                  <div style="font-size:13px;color:#777;margin-top:4px;">${libelles[typeDocument] || 'Document'}</div>
                </div>

                <p style="margin:0 0 20px;color:#444;line-height:1.7;font-size:14px;">Vous pouvez également retrouver ce document dans votre espace personnel Werdhe, dans la section <strong>« Factures »</strong>.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
                  <tr><td style="border-radius:10px;background:#1B6B3A;">
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:13px 28px;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;">Voir mes documents</a>
                  </td></tr>
                </table>

                <div style="background:#FAFAFA;border-radius:8px;padding:14px;font-size:12px;color:#999;">Ce document est généré automatiquement par Werdhe et constitue une preuve officielle.</div>
              </div>
              <div style="background:#FAFAFA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #F0F0F0;">
                © 2026 Werdhe — Plateforme de location immobilière en Guinée<br>
                Transparence · Sécurité · Simplicité
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      // Pièce jointe HTML comme document
      attachments: [
        {
          filename: nomFichier || `${numeroDocument}.html`,
          content: Buffer.from(htmlDocument).toString('base64'),
          content_type: 'text/html'
        }
      ]
    });
    return true;
  } catch (err) {
    console.error('Erreur email document:', err);
    return false;
  }
};

// ================================
// EMAIL CONFIRMATION RÉSERVATION
// ================================
const envoyerEmailReservation = async ({ email, prenom, logement, dateDebut, montant }) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: 'Votre réservation Werdhe est confirmée !',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:480px;margin:0 auto;padding:40px 16px;">
            <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <div style="background:#14251A;padding:32px 24px;text-align:center;">
                ${logoBadge()}
              </div>
              <div style="padding:32px;">
                <p style="margin:0 0 8px;color:#444;font-size:15px;line-height:1.7;">Bonjour <strong>${prenom}</strong>,</p>
                <p style="margin:0 0 20px;color:#1B6B3A;font-size:16px;font-weight:700;line-height:1.7;">Votre réservation a été confirmée !</p>
                <div style="background:#F7F8F7;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
                  <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:0.5px solid #EEE;"><span style="font-size:13px;color:#888;">Logement</span><span style="font-size:13px;font-weight:600;color:#1B2B22;">${logement}</span></div>
                  <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:0.5px solid #EEE;"><span style="font-size:13px;color:#888;">Date d'entrée</span><span style="font-size:13px;font-weight:600;color:#1B2B22;">${dateDebut}</span></div>
                  <div style="display:flex;justify-content:space-between;padding:7px 0;"><span style="font-size:13px;color:#888;">Montant</span><span style="font-size:13px;font-weight:600;color:#1B2B22;">${Number(montant).toLocaleString()} GNF</span></div>
                </div>
                <p style="margin:0;color:#444;font-size:14px;line-height:1.7;">Connectez-vous à votre espace Werdhe pour effectuer votre paiement.</p>
              </div>
              <div style="background:#FAFAFA;padding:20px;text-align:center;font-size:12px;color:#999;border-top:1px solid #F0F0F0;">© 2026 Werdhe — Guinée</div>
            </div>
          </div>
        </body>
        </html>
      `
    });
    return true;
  } catch (err) {
    console.error('Erreur email réservation:', err);
    return false;
  }
};
// ─── TEMPLATE DE BASE ──────────────────────────────────────────────
function templateBase(contenu, titre) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${titre || 'Werdhe'}</title></head>
  <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:24px 16px 48px;">
  <div style="background:#14251A;border-radius:14px;padding:16px;margin-bottom:16px;text-align:center;">
    ${logoBadge()}
  </div>
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">${contenu}</div>
  <div style="text-align:center;margin-top:24px;">
    <p style="font-size:12px;color:#aaa;margin:0 0 8px;">Werdhe — Plateforme Immobilière Guinée</p>
    <p style="font-size:12px;color:#aaa;margin:0;">
      <a href="https://werdhe.com" style="color:#1B6B3A;text-decoration:none;">werdhe.com</a> &nbsp;·&nbsp;
      <a href="mailto:contact@werdhe.com" style="color:#1B6B3A;text-decoration:none;">contact@werdhe.com</a>
    </p>
  </div></div></body></html>`;
}
// ─── HEADER COLORÉ ────────────────────────────────────────────────
function hdr(couleur, emoji, titre, sous) {
  return `<div style="background:${couleur};padding:28px 24px;text-align:center;">
    <h1 style="color:#fff;font-size:19px;font-weight:800;margin:0 0 4px;">${titre}</h1>
    ${sous ? `<p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">${sous}</p>` : ''}
  </div>`;
}
// ─── BOUTON CTA ───────────────────────────────────────────────────
function btn(texte, url, couleur) {
  var texteClean = String(texte).replace(/^[\p{Extended_Pictographic}‍️]+\s*/u, '').trim();
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 8px;"><tr><td style="border-radius:10px;background:${couleur||'#1B6B3A'};">
    <a href="${url}" style="display:inline-block;padding:12px 26px;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;">${texteClean}</a>
  </td></tr></table>`;
}
// ─── LIGNE INFO ──────────────────────────────
function ligne(label, valeur) {
  return `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:0.5px solid #F0F0F0;">
    <span style="font-size:13px;color:#888;">${label}</span>
    <span style="font-size:13px;font-weight:600;color:#1B2B22;">${valeur}</span>
  </div>`;
}
// ══════════════════════════════════════════════════════════════════
// FONCTIONS D'ENVOI
// ══
async function envoyer(to, subject, html) {
  try {
    await resend.emails.send({ from: process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>', to: Array.isArray(to) ? to : [to], subject, html });
    return true;
  } catch (err) { console.warn('[Email]', err.message); return false; }
}
// ─── BIENVENUE ──────────────────────────────────
const emailBienvenue = async (user) => {
  var estProprio = user.role === 'proprietaire' || user.role === 'les_deux';
  return envoyer(user.email, 'Bienvenue sur Werdhe !', templateBase(`
    ${hdr('linear-gradient(135deg,#1B2B22,#1B6B3A)', '', 'Bienvenue sur Werdhe !', 'Compte créé avec succès')}
    <div style="padding:24px;">
      <p style="font-size:14px;color:#555;line-height:1.7;">Bonjour <strong>${user.prenom}</strong>, ${estProprio ? 'publiez votre premier bien et recevez des candidatures.' : 'cherchez votre logement idéal parmi nos annonces.'}</p>
      <div style="background:#F7F8F7;border-radius:10px;padding:14px 18px;margin:16px 0;">
        ${ligne('Email', user.email)}${ligne('Rôle', estProprio ? 'Propriétaire' : 'Locataire')}
      </div>
      ${btn(estProprio ? 'Mon dashboard' : 'Chercher un logement', 'https://werdhe.com/dashboard', '#1B6B3A')}
    </div>`, 'Bienvenue'));
};
// ─── NOUVELLE CANDIDATURE (proprio) ─────────────
const emailNouvelleCandidature = async (proprio, locataire, logement) => {
  return envoyer(proprio.email, 'Nouvelle candidature — ' + logement.titre, templateBase(`
    ${hdr('#1565C0', '', 'Nouvelle candidature !', logement.titre)}
    <div style="padding:24px;">
      <p style="font-size:14px;color:#555;"><strong>${locataire.prenom} ${locataire.nom}</strong> vient de postuler pour votre logement.</p>
      <div style="background:#F7F8F7;border-radius:10px;padding:14px 18px;margin:16px 0;">
        ${ligne('Logement', logement.titre)}${ligne('Candidat', locataire.prenom + ' ' + locataire.nom)}${ligne('Email', locataire.email)}
      </div>
      ${btn('Voir la candidature', 'https://werdhe.com/dashboard', '#1565C0')}
    </div>`, 'Nouvelle candidature'));
};
// ─── CANDIDATURE ACCEPTÉE (locataire) ────────────
const emailCandidatureAcceptee = async (locataire, proprio, logement) => {
  return envoyer(locataire.email, 'Candidature acceptée — ' + logement.titre, templateBase(`
    ${hdr('#1B6B3A', '', 'Candidature acceptée !', 'Félicitations ' + locataire.prenom + ' !')}
    <div style="padding:24px;">
      <div style="background:#E8F5E9;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1B6B3A;">
        ${ligne('Logement', logement.titre)}${ligne('Loyer', new Intl.NumberFormat('fr-FR').format(logement.prix_mensuel) + ' GNF/mois')}${ligne('Propriétaire', proprio.prenom + ' ' + proprio.nom)}
      </div>
      ${btn('Soumettre mon dossier', 'https://werdhe.com/dashboard', '#1B6B3A')}
    </div>`, 'Candidature acceptée'));
};
// ─── CANDIDATURE REFUSÉE (locataire) ───────────────────────
const emailCandidatureRefusee = async (locataire, logement, motif) => {
  return envoyer(locataire.email, 'Candidature non retenue — ' + logement.titre, templateBase(`
    ${hdr('#B71C1C', '', 'Candidature non retenue', logement.titre)}
    <div style="padding:24px;">
      ${motif ? `<div style="background:#FFEBEE;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#B71C1C;"><strong>Motif :</strong> ${motif}</div>` : ''}
      ${btn('Voir d\'autres logements', 'https://werdhe.com/logements', '#1B6B3A')}
    </div>`, 'Candidature non retenue'));
};
// ─── RAPPEL LOYER (J-3) ──────────────────────────
const emailRappelLoyer = async (locataire, logement, montant) => {
  return envoyer(locataire.email, 'Rappel : loyer dû dans 3 jours', templateBase(`
    ${hdr('#E65100', '', 'Rappel de paiement', 'Dans 3 jours')}
    <div style="padding:24px;">
      <div style="background:#FFF3E0;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #E65100;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(montant) + ' GNF')}
      </div>
      ${btn('Payer maintenant', 'https://werdhe.com/dashboard', '#E65100')}
    </div>`, 'Rappel loyer'));
};
// ─── LOYER EN RETARD (J+5) ────────────────────────
const emailLoyerEnRetard = async (locataire, proprio, logement, montant) => {
  return envoyer(locataire.email, 'Loyer en retard — ' + logement.titre, templateBase(`
    ${hdr('#B71C1C', '', 'Loyer en retard', 'Action requise')}
    <div style="padding:24px;">
      <div style="background:#FFEBEE;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #B71C1C;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(montant) + ' GNF')}${ligne('Retard', '5 jours')}
      </div>
      ${btn('Régulariser', 'https://werdhe.com/dashboard', '#B71C1C')}
    </div>`, 'Loyer en retard'));
};
// ─── NOUVEAU MESSAGE ────────────────────────
const emailNouveauMessage = async (destinataire, expediteur, apercu) => {
  return envoyer(destinataire.email, 'Nouveau message de ' + expediteur.prenom, templateBase(`
    ${hdr('#7B1FA2', '', 'Nouveau message', 'De ' + expediteur.prenom + ' ' + expediteur.nom)}
    <div style="padding:24px;">
      <div style="background:#F3E5F5;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #7B1FA2;font-size:14px;color:#333;font-style:italic;">
        "${(apercu||'').slice(0,120)}${(apercu||'').length>120?'...':''}"
      </div>
      ${btn('Répondre', 'https://werdhe.com/dashboard', '#7B1FA2')}
    </div>`, 'Nouveau message'));
};
// ─── BAIL BIENTÔT EXPIRANT (J-30) ──────────────────────────
const emailBailExpirant = async (locataire, proprio, logement, dateExpiration) => {
  return envoyer(locataire.email, 'Bail expirant — ' + logement.titre, templateBase(`
    ${hdr('#1565C0', '', 'Bail expirant bientôt', 'Dans 30 jours')}
    <div style="padding:24px;">
      <div style="background:#E3F2FD;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1565C0;">
        ${ligne('Logement', logement.titre)}${ligne('Expiration', new Date(dateExpiration).toLocaleDateString('fr-FR'))}${ligne('Propriétaire', proprio.prenom)}
      </div>
      ${btn('Contacter le proprio', 'https://werdhe.com/dashboard', '#1565C0')}
    </div>`, 'Bail expirant'));
};
// ─── PRÉAVIS REÇU ──────────────────────────
const emailPreavisRecu = async (destinataire, expediteur, logement, motif) => {
  return envoyer(destinataire.email, 'Préavis reçu — ' + logement.titre, templateBase(`
    ${hdr('#37474F', '', 'Préavis reçu', logement.titre)}
    <div style="padding:24px;">
      <div style="background:#ECEFF1;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #37474F;">
        ${ligne('De', expediteur.prenom + ' ' + expediteur.nom)}${ligne('Date', new Date().toLocaleDateString('fr-FR'))}${motif ? ligne('Motif', motif) : ''}
      </div>
      ${btn('Voir le préavis', 'https://werdhe.com/dashboard', '#37474F')}
    </div>`, 'Préavis reçu'));
};
// ─── PAIEMENT ENREGISTRÉ ───────────────────────
const emailPaiementEnregistre = async (locataire, logement, paiement) => {
  return envoyer(locataire.email, 'Paiement enregistré — ' + logement.titre, templateBase(`
    ${hdr('#1B6B3A', '', 'Paiement confirmé !', 'Quittance disponible')}
    <div style="padding:24px;">
      <div style="background:#E8F5E9;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1B6B3A;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(paiement.montant) + ' GNF')}${ligne('Mode', paiement.mode_paiement||'Espèces')}${ligne('Statut', 'Confirmé')}
      </div>
      ${btn('Voir ma quittance', 'https://werdhe.com/dashboard', '#1B6B3A')}
    </div>`, 'Paiement confirmé'));
};

module.exports = {
  envoyerEmailReset,
  envoyerEmailDocument,
  envoyerEmailReservation,
  emailBienvenue,
  emailNouvelleCandidature,
  emailCandidatureAcceptee,
  emailCandidatureRefusee,
  emailRappelLoyer,
  emailLoyerEnRetard,
  emailNouveauMessage,
  emailBailExpirant,
  emailPreavisRecu,
  emailPaiementEnregistre,
};
