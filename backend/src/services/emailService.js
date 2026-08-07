const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ================================
// EMAIL RESET MOT DE PASSE
// ================================
const envoyerEmailReset = async (email, prenom, lienReset) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe Werdhè',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 40px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
            .header { background: #2E7D32; padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 32px; }
            .body p { color: #444; line-height: 1.6; font-size: 15px; }
            .btn { display: block; width: fit-content; margin: 24px auto; background: #2E7D32; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; }
            .expire { background: #fff3e0; border-left: 4px solid #FF8F00; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #e65100; margin-top: 20px; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🏠 Werdhè</h1></div>
            <div class="body">
              <p>Bonjour <strong>${prenom}</strong>,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <a href="${lienReset}" class="btn">🔐 Réinitialiser mon mot de passe</a>
              <div class="expire">⏳ Ce lien expire dans <strong>1 heure</strong>.</div>
            </div>
            <div class="footer">© 2026 Werdhè — Guinée</div>
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
    facture: '🧾 Votre facture Werdhè',
    quittance: '📋 Votre quittance de loyer Werdhè',
    contrat_bail: '📜 Votre contrat de bail Werdhè'
  };

  const descriptions = {
    facture: 'Veuillez trouver ci-joint votre facture de loyer.',
    quittance: 'Veuillez trouver ci-joint votre quittance de loyer mensuelle.',
    contrat_bail: 'Veuillez trouver ci-joint votre contrat de bail.'
  };

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: email,
      subject: `${titres[typeDocument] || '📄 Document Werdhè'} - ${numeroDocument}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
            .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 32px; text-align: center; }
            .logo { font-size: 28px; font-weight: 900; color: white; }
            .logo small { display: block; font-size: 12px; opacity: 0.7; font-weight: 400; }
            .body { padding: 32px; }
            .body p { color: #444; line-height: 1.7; font-size: 15px; margin-bottom: 16px; }
            .doc-box { background: #e8f5e9; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center; }
            .doc-box .icon { font-size: 48px; margin-bottom: 8px; }
            .doc-box .numero { font-size: 20px; font-weight: 800; color: #1B5E20; }
            .doc-box .type { font-size: 13px; color: #666; margin-top: 4px; }
            .btn { display: block; text-align: center; background: #2E7D32; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 24px auto; width: fit-content; }
            .note { background: #f9f9f9; border-radius: 8px; padding: 14px; font-size: 13px; color: #888; }
            .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏠 Werdhè<small>Plateforme de Location Immobilière</small></div>
            </div>
            <div class="body">
              <p>Bonjour <strong>${prenom}</strong>,</p>
              <p>${descriptions[typeDocument] || 'Veuillez trouver ci-joint votre document.'}</p>

              <div class="doc-box">
                <div class="icon">
                  ${typeDocument === 'facture' ? '🧾'
                    : typeDocument === 'quittance' ? '📋' : '📜'}
                </div>
                <div class="numero">${numeroDocument}</div>
                <div class="type">
                  ${typeDocument === 'facture' ? 'Facture de loyer'
                    : typeDocument === 'quittance' ? 'Quittance de loyer'
                    : 'Contrat de bail'}
                </div>
              </div>

              <p>
                Vous pouvez également retrouver ce document dans votre espace
                personnel Werdhè, dans la section <strong>"Factures"</strong>.
              </p>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">
                📂 Voir mes documents
              </a>

              <div class="note">
                💡 Ce document est généré automatiquement par Werdhè
                et constitue une preuve officielle.
              </div>
            </div>
            <div class="footer">
              © 2026 Werdhè — Plateforme de location immobilière en Guinée<br>
              Transparence · Sécurité · Simplicité
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
      subject: '📅 Votre réservation Werdhè est confirmée !',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .container { max-width: 520px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; }
            .header { background: #2E7D32; padding: 28px; text-align: center; color: white; font-size: 24px; font-weight: 900; }
            .body { padding: 28px; color: #444; font-size: 15px; line-height: 1.7; }
            .info-box { background: #e8f5e9; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .footer { text-align: center; padding: 16px; font-size: 12px; color: #aaa; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">🏠 Werdhè</div>
            <div class="body">
              <p>Bonjour <strong>${prenom}</strong> !</p>
              <p>🎉 Votre réservation a été <strong>confirmée</strong> !</p>
              <div class="info-box">
                <p>🏠 <strong>${logement}</strong></p>
                <p>📅 Date d'entrée : <strong>${dateDebut}</strong></p>
                <p>💰 Montant : <strong>${Number(montant).toLocaleString()} GNF</strong></p>
              </div>
              <p>Connectez-vous à votre espace Werdhè pour effectuer votre paiement.</p>
            </div>
            <div class="footer">© 2026 Werdhè — Guinée</div>
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
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>${titre || 'Werdhe'}</title></head>
  <body style="margin:0;padding:0;background:#F7F8F7;font-family:system-ui,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:24px 16px 48px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:#1B2B22;border-radius:12px;padding:10px 20px;">
      <span style="color:#fff;font-weight:800;font-size:18px;">🏠 Werdhe</span>
    </div>
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
  return `<div style="background:${couleur};padding:28px;text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">${emoji}</div>
    <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px;">${titre}</h1>
    ${sous ? `<p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;">${sous}</p>` : ''}
  </div>`;
}
// ─── BOUTON CTA ───────────────────────────────────────────────────
function btn(texte, url, couleur) {
  return `<div style="text-align:center;margin:20px 0 8px;">
    <a href="${url}" style="display:inline-block;background:${couleur||'#1B6B3A'};color:#fff;padding:12px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">${texte}</a>
  </div>`;
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
    await resend.emails.send({ from: 'Werdhe <no-reply@werdhe.com>', to: Array.isArray(to) ? to : [to], subject, html });
    return true;
  } catch (err) { console.warn('[Email]', err.message); return false; }
}
// ─── BIENVENUE ──────────────────────────────────
const emailBienvenue = async (user) => {
  var estProprio = user.role === 'proprietaire' || user.role === 'les_deux';
  return envoyer(user.email, '🏠 Bienvenue sur Werdhe !', templateBase(`
    ${hdr('linear-gradient(135deg,#1B2B22,#1B6B3A)', '🎉', 'Bienvenue sur Werdhe !', 'Compte créé avec succès')}
    <div style="padding:24px;">
      <p style="font-size:14px;color:#555;line-height:1.7;">Bonjour <strong>${user.prenom}</strong>, ${estProprio ? 'publiez votre premier bien et recevez des candidatures.' : 'cherchez votre logement idéal parmi nos annonces.'}</p>
      <div style="background:#F7F8F7;border-radius:10px;padding:14px 18px;margin:16px 0;">
        ${ligne('Email', user.email)}${ligne('Rôle', estProprio ? 'Propriétaire' : 'Locataire')}
      </div>
      ${btn(estProprio ? '🏠 Mon dashboard' : '🔍 Chercher un logement', 'https://werdhe.com/dashboard', '#1B6B3A')}
    </div>`, 'Bienvenue'));
};
// ─── NOUVELLE CANDIDATURE (proprio) ─────────────
const emailNouvelleCandidature = async (proprio, locataire, logement) => {
  return envoyer(proprio.email, '📩 Nouvelle candidature — ' + logement.titre, templateBase(`
    ${hdr('#1565C0', '📩', 'Nouvelle candidature !', logement.titre)}
    <div style="padding:24px;">
      <p style="font-size:14px;color:#555;"><strong>${locataire.prenom} ${locataire.nom}</strong> vient de postuler pour votre logement.</p>
      <div style="background:#F7F8F7;border-radius:10px;padding:14px 18px;margin:16px 0;">
        ${ligne('Logement', logement.titre)}${ligne('Candidat', locataire.prenom + ' ' + locataire.nom)}${ligne('Email', locataire.email)}
      </div>
      ${btn('👁️ Voir la candidature', 'https://werdhe.com/dashboard', '#1565C0')}
    </div>`, 'Nouvelle candidature'));
};
// ─── CANDIDATURE ACCEPTÉE (locataire) ────────────
const emailCandidatureAcceptee = async (locataire, proprio, logement) => {
  return envoyer(locataire.email, '✅ Candidature acceptée — ' + logement.titre, templateBase(`
    ${hdr('#1B6B3A', '✅', 'Candidature acceptée !', 'Félicitations ' + locataire.prenom + ' !')}
    <div style="padding:24px;">
      <div style="background:#E8F5E9;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1B6B3A;">
        ${ligne('Logement', logement.titre)}${ligne('Loyer', new Intl.NumberFormat('fr-FR').format(logement.prix_mensuel) + ' GNF/mois')}${ligne('Propriétaire', proprio.prenom + ' ' + proprio.nom)}
      </div>
      ${btn('📋 Soumettre mon dossier', 'https://werdhe.com/dashboard', '#1B6B3A')}
    </div>`, 'Candidature acceptée'));
};
// ─── CANDIDATURE REFUSÉE (locataire) ───────────────────────
const emailCandidatureRefusee = async (locataire, logement, motif) => {
  return envoyer(locataire.email, '❌ Candidature non retenue — ' + logement.titre, templateBase(`
    ${hdr('#B71C1C', '❌', 'Candidature non retenue', logement.titre)}
    <div style="padding:24px;">
      ${motif ? `<div style="background:#FFEBEE;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#B71C1C;"><strong>Motif :</strong> ${motif}</div>` : ''}
      ${btn('🔍 Voir d\'autres logements', 'https://werdhe.com/logements', '#1B6B3A')}
    </div>`, 'Candidature non retenue'));
};
// ─── RAPPEL LOYER (J-3) ──────────────────────────
const emailRappelLoyer = async (locataire, logement, montant) => {
  return envoyer(locataire.email, '⏰ Rappel : loyer dû dans 3 jours', templateBase(`
    ${hdr('#E65100', '⏰', 'Rappel de paiement', 'Dans 3 jours')}
    <div style="padding:24px;">
      <div style="background:#FFF3E0;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #E65100;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(montant) + ' GNF')}
      </div>
      ${btn('💳 Payer maintenant', 'https://werdhe.com/dashboard', '#E65100')}
    </div>`, 'Rappel loyer'));
};
// ─── LOYER EN RETARD (J+5) ────────────────────────
const emailLoyerEnRetard = async (locataire, proprio, logement, montant) => {
  return envoyer(locataire.email, '🚨 Loyer en retard — ' + logement.titre, templateBase(`
    ${hdr('#B71C1C', '🚨', 'Loyer en retard', 'Action requise')}
    <div style="padding:24px;">
      <div style="background:#FFEBEE;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #B71C1C;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(montant) + ' GNF')}${ligne('Retard', '5 jours')}
      </div>
      ${btn('💳 Régulariser', 'https://werdhe.com/dashboard', '#B71C1C')}
    </div>`, 'Loyer en retard'));
};
// ─── NOUVEAU MESSAGE ────────────────────────
const emailNouveauMessage = async (destinataire, expediteur, apercu) => {
  return envoyer(destinataire.email, '💬 Nouveau message de ' + expediteur.prenom, templateBase(`
    ${hdr('#7B1FA2', '💬', 'Nouveau message', 'De ' + expediteur.prenom + ' ' + expediteur.nom)}
    <div style="padding:24px;">
      <div style="background:#F3E5F5;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #7B1FA2;font-size:14px;color:#333;font-style:italic;">
        "${(apercu||'').slice(0,120)}${(apercu||'').length>120?'...':''}"
      </div>
      ${btn('💬 Répondre', 'https://werdhe.com/dashboard', '#7B1FA2')}
    </div>`, 'Nouveau message'));
};
// ─── BAIL BIENTÔT EXPIRANT (J-30) ──────────────────────────
const emailBailExpirant = async (locataire, proprio, logement, dateExpiration) => {
  return envoyer(locataire.email, '📅 Bail expirant — ' + logement.titre, templateBase(`
    ${hdr('#1565C0', '📅', 'Bail expirant bientôt', 'Dans 30 jours')}
    <div style="padding:24px;">
      <div style="background:#E3F2FD;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1565C0;">
        ${ligne('Logement', logement.titre)}${ligne('Expiration', new Date(dateExpiration).toLocaleDateString('fr-FR'))}${ligne('Propriétaire', proprio.prenom)}
      </div>
      ${btn('💬 Contacter le proprio', 'https://werdhe.com/dashboard', '#1565C0')}
    </div>`, 'Bail expirant'));
};
// ─── PRÉAVIS REÇU ──────────────────────────
const emailPreavisRecu = async (destinataire, expediteur, logement, motif) => {
  return envoyer(destinataire.email, '📤 Préavis reçu — ' + logement.titre, templateBase(`
    ${hdr('#37474F', '📤', 'Préavis reçu', logement.titre)}
    <div style="padding:24px;">
      <div style="background:#ECEFF1;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #37474F;">
        ${ligne('De', expediteur.prenom + ' ' + expediteur.nom)}${ligne('Date', new Date().toLocaleDateString('fr-FR'))}${motif ? ligne('Motif', motif) : ''}
      </div>
      ${btn('📋 Voir le préavis', 'https://werdhe.com/dashboard', '#37474F')}
    </div>`, 'Préavis reçu'));
};
// ─── PAIEMENT ENREGISTRÉ ───────────────────────
const emailPaiementEnregistre = async (locataire, logement, paiement) => {
  return envoyer(locataire.email, '💰 Paiement enregistré — ' + logement.titre, templateBase(`
    ${hdr('#1B6B3A', '💰', 'Paiement confirmé !', 'Quittance disponible')}
    <div style="padding:24px;">
      <div style="background:#E8F5E9;border-radius:10px;padding:14px 18px;margin:16px 0;border-left:4px solid #1B6B3A;">
        ${ligne('Logement', logement.titre)}${ligne('Montant', new Intl.NumberFormat('fr-FR').format(paiement.montant) + ' GNF')}${ligne('Mode', paiement.mode_paiement||'Espèces')}${ligne('Statut', '✅ Confirmé')}
      </div>
      ${btn('📄 Voir ma quittance', 'https://werdhe.com/dashboard', '#1B6B3A')}
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