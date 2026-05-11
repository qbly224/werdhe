const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ================================
// EMAIL DE RÉINITIALISATION
// ================================
const envoyerEmailReset = async (email, prenom, lienReset) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
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
            <div class="header">
              <h1>🏠 Werdhè</h1>
            </div>
            <div class="body">
              <p>Bonjour <strong>${prenom}</strong>,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
              <a href="${lienReset}" class="btn">🔐 Réinitialiser mon mot de passe</a>
              <div class="expire">
                ⏳ Ce lien expire dans <strong>1 heure</strong>. Après ce délai, vous devrez faire une nouvelle demande.
              </div>
              <p style="margin-top: 20px; font-size: 13px; color: #999;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
              </p>
            </div>
            <div class="footer">
              © 2026 Werdhè — Plateforme de location immobilière en Guinée
            </div>
          </div>
        </body>
        </html>
      `
    });
    return true;
  } catch (err) {
    console.error('Erreur envoi email:', err);
    return false;
  }
};

module.exports = { envoyerEmailReset };