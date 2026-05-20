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

module.exports = {
  envoyerEmailReset,
  envoyerEmailDocument,
  envoyerEmailReservation
};