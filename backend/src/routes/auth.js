const { valider } = require('../middleware/valider');
const audit = require('../services/auditService');
const express       = require('express');
const router        = require('express').Router();
const verifierToken = require('../middleware/auth');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const db       = require('../database');
const passport = require('../config/passport');
const emailService = require('../services/emailService');
// ─── INSCRIPTION ──────────────────────────────────────────────────
router.post('/inscription', valider('inscription'), async (req, res) => {
  try {
    var { nom, prenom, email, mot_de_passe, role, telephone } = req.body;
    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }

    var existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ erreur: 'Email déjà utilisé' });
    }

    var hash = await bcrypt.hash(mot_de_passe, 10);
    var result = await db.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nom, prenom || '', email, hash, role || 'locataire', telephone || null]
    );
    var user = result.rows[0];
// Email de bienvenue
emailService.emailBienvenue(user).catch(console.warn);
    // Créer abonnement gratuit si proprio
    if (['proprietaire', 'les_deux'].includes(user.role)) {
      await db.query(
        `INSERT INTO abonnements (user_id, plan, statut) VALUES ($1, 'gratuit', 'actif')`,
        [user.id]
      ).catch(console.warn);
    }

    await audit.log(user.id, 'inscription', { email: user.email, role: user.role }, req.ip);

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit', onboarding_termine: user.onboarding_termine || false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Compte créé !',
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit', onboarding_termine: user.onboarding_termine || false }
    });
  } catch (err) {
    console.error('[POST /inscription]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── CONNEXION EMAIL ─────────────────────────────────────────────
async function connexionHandler(req, res) {
  try {
    var { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ erreur: 'Email et mot de passe requis' });
    }

    var result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    var user = result.rows[0];

    if (user.suspendu) {
      return res.status(403).json({ erreur: 'Compte suspendu. Contactez le support.' });
    }

    if (user.abonnement_bloque) {
      return res.status(403).json({
        erreur: 'Abonnement impayé. Réglez votre abonnement ou contactez contact@werdhe.com pour retrouver l\'accès.',
        code:   'ABONNEMENT_BLOQUE'
      });
    }

    var valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit', onboarding_termine: user.onboarding_termine || false },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Logger la connexion
await audit.log(user.id, 'connexion', { email: user.email, role: user.role }, req.ip);
    // Si compte admin → envoyer OTP avant de donner le JWT
if (user.role === 'admin') {
  var codeOTP = Math.floor(100000 + Math.random() * 900000).toString();
  var expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Supprimer anciens OTP
  await db.query('DELETE FROM otp_admin WHERE user_id = $1', [user.id]);

  // Sauvegarder le nouvel OTP
  await db.query(
    'INSERT INTO otp_admin (user_id, code, expire_at, ip_address) VALUES ($1, $2, $3, $4)',
    [user.id, codeOTP, expireAt, req.ip]
  );

  // Envoyer par email
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
        to:      user.email,
        subject: 'Code de vérification Admin — Werdhe',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
            <div style="max-width:420px;margin:0 auto;padding:40px 16px;">
              <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                <div style="background:#14251A;padding:28px 24px;text-align:center;">
                  <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
                    <td style="width:38px;height:38px;border-radius:10px;background:#F5A623;text-align:center;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:900;font-size:18px;color:#14251A;">W</td>
                    <td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:18px;color:#fff;">Werdhe Admin</td>
                  </tr></table>
                </div>
                <div style="padding:32px;">
                  <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">Tentative de connexion admin depuis <strong>${req.ip}</strong>.</p>
                  <div style="background:#14251A;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
                    <div style="font-size:36px;font-weight:900;color:#F5A623;letter-spacing:8px;font-family:'Courier New',monospace;">${codeOTP}</div>
                  </div>
                  <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">Ce code expire dans <strong>10 minutes</strong>. Si ce n'est pas vous, changez votre mot de passe immédiatement.</p>
                </div>
                <div style="background:#FAFAFA;padding:16px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #F0F0F0;">© 2026 Werdhe</div>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (e) {
      console.warn('[2FA Admin] Email non envoyé:', e.message);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[2FA Admin] Code pour', user.email, ':', codeOTP);
  }

  return res.json({
    requires_2fa: true,
    user_id:      user.id,
    message:      'Code 2FA envoyé à ' + user.email
  });
}
    res.json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit', onboarding_termine: user.onboarding_termine || false }
    });
  } catch (err) {
    console.error('[POST /connexion]', err.message);
    res.status(500).json({ erreur: err.message });
  }
}
router.post('/connexion', valider('connexion'), connexionHandler);

// ─── PROFIL ───────────────────────────────────────────────────────
router.get('/profil', require('../middleware/auth'), async (req, res) => {
  try {
    var result = await db.query(
      'SELECT id, nom, prenom, email, role, telephone, plan FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── MODIFIER PROFIL ─────────────────────────────────────────────
router.put('/profil', require('../middleware/auth'), async (req, res) => {
  try {
    var { nom, prenom, telephone } = req.body;
    await db.query(
      'UPDATE users SET nom = $1, prenom = $2, telephone = $3 WHERE id = $4',
      [nom, prenom, telephone, req.user.id]
    );
    res.json({ message: 'Profil mis à jour' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── CHANGER MOT DE PASSE ────────────────────────────────────────
router.put('/changer-mot-de-passe', require('../middleware/auth'), async (req, res) => {
  try {
    var { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    var result = await db.query('SELECT mot_de_passe FROM users WHERE id = $1', [req.user.id]);
    var user   = result.rows[0];
    var valid  = await bcrypt.compare(ancien_mot_de_passe, user.mot_de_passe);
    if (!valid) return res.status(401).json({ erreur: 'Ancien mot de passe incorrect' });
    var hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await db.query('UPDATE users SET mot_de_passe = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe changé !' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── OTP PAR TÉLÉPHONE — ENVOYER ────────────────────────────────
router.post('/telephone/envoyer-otp', async (req, res) => {
  try {
    var { telephone } = req.body;
    if (!telephone) return res.status(400).json({ erreur: 'Numéro requis' });

    var tel = telephone.replace(/\s+/g, '').replace(/^00/, '+');
    if (!tel.startsWith('+')) tel = '+224' + tel.replace(/^0/, '');

    var code     = Math.floor(100000 + Math.random() * 900000).toString();
    var expireAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query('DELETE FROM otp_telephone WHERE telephone = $1', [tel]);
    await db.query(
      'INSERT INTO otp_telephone (telephone, code, expire_at) VALUES ($1, $2, $3)',
      [tel, code, expireAt]
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log('[OTP] Code pour', tel, ':', code);
    }

// Chercher si l'utilisateur a un email enregistré
var userExistant = await db.query(
  'SELECT email FROM users WHERE telephone = $1',
  [tel]
);

if (userExistant.rows.length > 0 && userExistant.rows[0].email && process.env.RESEND_API_KEY) {
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
      to:      userExistant.rows[0].email,
      subject: 'Votre code de connexion Werdhe',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F7F8F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:420px;margin:0 auto;padding:40px 16px;">
            <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
              <div style="background:#14251A;padding:28px 24px;text-align:center;">
                <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
                  <td style="width:38px;height:38px;border-radius:10px;background:#F5A623;text-align:center;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:900;font-size:18px;color:#14251A;">W</td>
                  <td style="padding-left:9px;vertical-align:middle;font-family:-apple-system,'Segoe UI',Arial,sans-serif;font-weight:800;font-size:18px;color:#fff;">Werdhe</td>
                </tr></table>
              </div>
              <div style="padding:32px;">
                <p style="margin:0 0 16px;color:#444;font-size:14px;">Votre code de connexion :</p>
                <div style="background:#F0FBF0;border:1.5px solid #1B6B3A;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px;">
                  <div style="font-size:34px;font-weight:800;color:#1B6B3A;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</div>
                </div>
                <p style="margin:0;color:#888;font-size:12px;">Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
              </div>
              <div style="background:#FAFAFA;padding:16px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #F0F0F0;">© 2026 Werdhe</div>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('[OTP] Email envoyé à', userExistant.rows[0].email);
  } catch (emailErr) {
    console.warn('[OTP] Email non envoyé:', emailErr.message);
  }
}

res.json({
  message:   'Code OTP envoyé',
  telephone: tel
});
  } catch (err) {
    console.error('[OTP envoyer]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── OTP PAR TÉLÉPHONE — VÉRIFIER ───────────────────────────────
router.post('/telephone/verifier-otp', async (req, res) => {
  try {
    var { telephone, code, nom, prenom, role } = req.body;

    var tel = telephone.replace(/\s+/g, '').replace(/^00/, '+');
    if (!tel.startsWith('+')) tel = '+224' + tel.replace(/^0/, '');

    var otpResult = await db.query(
      `SELECT * FROM otp_telephone
       WHERE telephone = $1 AND code = $2
         AND utilise = FALSE AND expire_at > NOW()
       LIMIT 1`,
      [tel, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ erreur: 'Code invalide ou expiré' });
    }

    var userResult = await db.query('SELECT * FROM users WHERE telephone = $1', [tel]);
    var user;

    if (userResult.rows.length === 0 && !role) {
      // Nouvel utilisateur : on ne consomme pas encore le code, il devra être
      // resoumis avec nom/role pour finaliser l'inscription.
      return res.status(200).json({ nouveau_utilisateur: true, telephone: tel });
    }

    await db.query(
      'UPDATE otp_telephone SET utilise = TRUE WHERE id = $1',
      [otpResult.rows[0].id]
    );

    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      var nouveauUser = await db.query(
        `INSERT INTO users (telephone, nom, prenom, role, mot_de_passe, email)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          tel,
          nom || 'Utilisateur',
          prenom || '',
          role || 'locataire',
          crypto.randomBytes(32).toString('hex'),
          tel.replace('+', '') + '@werdhe-phone.com'
        ]
      );
      user = nouveauUser.rows[0];

      if (['proprietaire', 'les_deux'].includes(user.role)) {
        await db.query(
          `INSERT INTO abonnements (user_id, plan, statut) VALUES ($1, 'gratuit', 'actif')`,
          [user.id]
        ).catch(console.warn);
      }
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id:        user.id,
        nom:       user.nom,
        prenom:    user.prenom,
        email:     user.email,
        telephone: user.telephone,
        role:      user.role,
        plan:      user.plan || 'gratuit'
      }
    });
  } catch (err) {
    console.error('[OTP verifier]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// Alias pour compatibilité avec le frontend — mêmes règles que /connexion (dont la 2FA admin)
router.post('/login', valider('connexion'), connexionHandler);

// Alias inscription
router.post('/register', async (req, res) => {
  var { nom, prenom, email, mot_de_passe, role, telephone } = req.body;
  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
  }
  try {
    var existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ erreur: 'Email déjà utilisé' });
    }
    var bcrypt = require('bcrypt');
    var hash   = await bcrypt.hash(mot_de_passe, 10);
    var result = await db.query(
      `INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nom, prenom || '', email, hash, role || 'locataire', telephone || null]
    );
    var user  = result.rows[0];
    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.status(201).json({
      message: 'Compte créé !', token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit' }
    });
  } catch (err) {
    console.error('[POST /register]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// Marquer l'onboarding comme terminé
router.patch('/onboarding-termine', verifierToken, async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET onboarding_termine = TRUE WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: 'Onboarding terminé' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── PROFIL PUBLIC D'UN PROPRIÉTAIRE ─────────────────────────────
router.get('/profil-public/:id', async (req, res) => {
  try {
    var { id } = req.params;

    // Infos du propriétaire
    var userResult = await db.query(
      `SELECT
         u.nom, u.prenom, u.note_moyenne, u.nb_notations, u.plan,
            u.telephone, u.score_confiance, u.created_at
       FROM users
       WHERE id = $1
         AND role IN ('proprietaire', 'les_deux')
         AND (suspendu IS NULL OR suspendu = FALSE)`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Propriétaire non trouvé' });
    }

    var user = userResult.rows[0];

    // Ses logements publiés
    var logementsResult = await db.query(
      `SELECT id, titre, ville, adresse, prix_mensuel,
              nb_chambres, superficie, categorie, statut, photos
       FROM logements
       WHERE proprietaire_id = $1
         AND statut IN ('disponible', 'loue')
       ORDER BY created_at DESC
       LIMIT 12`,
      [id]
    );

    // Ses notations publiques
    var notationsResult = await db.query(
      `SELECT n.note, n.commentaire, n.created_at,
              u.prenom as auteur_prenom, u.nom as auteur_nom
       FROM notations n
       JOIN users u ON n.auteur_id = u.id
       WHERE n.cible_id = $1
         AND n.type = 'locataire_note_proprio'
         AND n.commentaire IS NOT NULL
       ORDER BY n.created_at DESC
       LIMIT 6`,
      [id]
    );

    // Stats
    var statsResult = await db.query(
      `SELECT
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'confirmee') as locations_actives,
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'terminee')  as locations_terminees,
         COUNT(DISTINCT l.id) as total_logements
       FROM logements l
       LEFT JOIN reservations r ON r.logement_id = l.id
       WHERE l.proprietaire_id = $1`,
      [id]
    );

    var moisDepuis = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    res.json({
      proprietaire: {
        id:               user.id,
        nom:              user.prenom + ' ' + user.nom.charAt(0) + '.',
        note_moyenne:     user.note_moyenne || 0,
        nb_notations:     user.nb_notations || 0,
        plan:             user.plan,
        membre_depuis:    moisDepuis + ' mois',
        locations_actives:   parseInt(statsResult.rows[0].locations_actives) || 0,
        locations_terminees: parseInt(statsResult.rows[0].locations_terminees) || 0,
        total_logements:     parseInt(statsResult.rows[0].total_logements) || 0,
      },
      logements:  logementsResult.rows,
      notations:  notationsResult.rows,
    });

  } catch (err) {
    console.error('[GET /profil-public/:id]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
// ─── GOOGLE OAUTH ─────────────────────────────────────────────────

// Initier la connexion Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback après authentification Google
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'https://werdhe.com/login?error=google' }),
  async function(req, res) {
    try {
      var user = req.user;

      // Générer le JWT
      var token = jwt.sign(
        {
          id:                 user.id,
          email:              user.email,
          role:               user.role,
          nom:                user.nom,
          prenom:             user.prenom,
          plan:               user.plan || 'gratuit',
          onboarding_termine: user.onboarding_termine || false
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Rediriger vers le frontend avec le token
      res.redirect(
        'https://werdhe.com/auth/callback?token=' + token +
        '&nom=' + encodeURIComponent(user.nom || '') +
        '&prenom=' + encodeURIComponent(user.prenom || '') +
        '&role=' + (user.role || 'locataire')
      );

    } catch (err) {
      console.error('[Google OAuth callback]', err.message);
      res.redirect('https://werdhe.com/login?error=serveur');
    }
  }
);
// ─── VÉRIFIER LE CODE 2FA ADMIN ──────────────────────────────────
router.post('/admin/verifier-2fa', async (req, res) => {
  try {
    var { user_id, code } = req.body;
    if (!user_id || !code) {
      return res.status(400).json({ erreur: 'user_id et code requis' });
    }

    var otpResult = await db.query(
      `SELECT * FROM otp_admin
       WHERE user_id = $1
         AND code = $2
         AND utilise = FALSE
         AND expire_at > NOW()
       LIMIT 1`,
      [user_id, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ erreur: 'Code invalide ou expiré' });
    }

    // Marquer comme utilisé
    await db.query(
      'UPDATE otp_admin SET utilise = TRUE WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Récupérer l'admin
    var userResult = await db.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [user_id, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ erreur: 'Compte admin non trouvé' });
    }

    var user = userResult.rows[0];

    // Générer le JWT
    var token = jwt.sign(
      {
        id:                 user.id,
        email:              user.email,
        role:               user.role,
        nom:                user.nom,
        prenom:             user.prenom,
        plan:               user.plan || 'agence',
        onboarding_termine: true,
        admin_2fa_verified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Logger la connexion
    await db.query(
      `INSERT INTO logs_audit (user_id, action, details)
       VALUES ($1, 'admin_login_2fa', $2)`,
      [user.id, JSON.stringify({ ip: otpResult.rows[0].ip_address })]
    ).catch(console.warn);

    res.json({
      message: 'Connexion admin réussie',
      token,
      user: {
        id:     user.id,
        nom:    user.nom,
        prenom: user.prenom,
        email:  user.email,
        role:   user.role,
        plan:   user.plan || 'agence'
      }
    });

  } catch (err) {
    console.error('[POST /auth/admin/verifier-2fa]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
// ─── FORMULAIRE DE CONTACT ────────────────────────────────────────
router.post('/contact', async (req, res) => {
  try {
    var { nom, email, sujet, message } = req.body;
    if (!nom || !email || !message) {
      return res.status(400).json({ erreur: 'Champs obligatoires manquants' });
    }
    var echapper = function(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    process.env.EMAIL_FROM || 'Werdhe <onboarding@resend.dev>',
        to:      'contact@werdhe.com',
        replyTo: email,
        subject: '[Contact Werdhe] ' + (sujet || 'Nouveau message'),
        html: `
          <div style="font-family:sans-serif;max-width:500px">
            <h2 style="color:#1B2B22">Nouveau message de contact</h2>
            <p><b>Nom :</b> ${echapper(nom)}</p>
            <p><b>Email :</b> ${echapper(email)}</p>
            <p><b>Sujet :</b> ${echapper(sujet || 'Non précisé')}</p>
            <hr/>
            <p><b>Message :</b></p>
            <p style="background:#F7F8F7;padding:14px;border-radius:8px;line-height:1.6">${echapper(message)}</p>
          </div>
        `
      });
    }
    res.json({ message: 'Message envoyé !' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});
// ─── MOT DE PASSE OUBLIÉ — DEMANDER UN LIEN DE RÉINITIALISATION ──
router.post('/forgot-password', async (req, res) => {
  try {
    var { email } = req.body;
    if (!email) return res.status(400).json({ erreur: 'Email requis' });

    var result = await db.query('SELECT id, prenom, email FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      var user = result.rows[0];
      var token = crypto.randomBytes(32).toString('hex');
      var expireAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await db.query(
        'INSERT INTO reinitialisations_mot_de_passe (user_id, token, expire_at, ip_address) VALUES ($1, $2, $3, $4)',
        [user.id, token, expireAt, req.ip]
      );

      var lienReset = (process.env.FRONTEND_URL || 'https://werdhe.com') + '/reset-password?token=' + token;
      emailService.envoyerEmailReset(user.email, user.prenom, lienReset).catch(function(e) {
        console.warn('[forgot-password] Email non envoyé:', e.message);
      });
    }

    // Réponse générique qu'un compte existe ou non, pour ne pas révéler les emails enregistrés
    res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('[POST /auth/forgot-password]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MOT DE PASSE OUBLIÉ — APPLIQUER LE NOUVEAU MOT DE PASSE ─────
router.post('/reset-password', async (req, res) => {
  try {
    var { token, nouveau_mot_de_passe } = req.body;
    if (!token || !nouveau_mot_de_passe) {
      return res.status(400).json({ erreur: 'Token et nouveau mot de passe requis' });
    }
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    var result = await db.query(
      `SELECT * FROM reinitialisations_mot_de_passe
       WHERE token = $1 AND utilise = FALSE AND expire_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ erreur: 'Lien invalide ou expiré' });
    }

    var reinit = result.rows[0];
    var hash = await bcrypt.hash(nouveau_mot_de_passe, 10);

    await db.query('UPDATE users SET mot_de_passe = $1 WHERE id = $2', [hash, reinit.user_id]);
    await db.query('UPDATE reinitialisations_mot_de_passe SET utilise = TRUE WHERE id = $1', [reinit.id]);
    await audit.log(reinit.user_id, 'reinitialisation_mot_de_passe', {}, req.ip);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('[POST /auth/reset-password]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── SCORE DE CONFIANCE ──────────────────────────────────────────
router.get('/mon-score', verifierToken, async (req, res) => {
  try {
    const { calculerScore, labelScore, CRITERES } = require('../services/scoreService');

    var score   = await calculerScore(req.user.id);
    var label   = labelScore(score);

    // Récupérer les détails
    var user    = await db.query(
      'SELECT score_confiance, score_details FROM users WHERE id = $1',
      [req.user.id]
    );
    var details = user.rows[0].score_details || {};

    // Construire la liste des critères avec statut
    var criteres = Object.keys(CRITERES).map(function(key) {
      return {
        key:      key,
        label:    CRITERES[key].label,
        points:   CRITERES[key].points,
        atteint:  details[key] === true,
      };
    });

    res.json({
      score:    score,
      label:    label.label,
      couleur:  label.couleur,
      bg:       label.bg,
      emoji:    label.emoji,
      criteres: criteres,
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ─── SCORE D'UN LOCATAIRE (pour propriétaire) ────────────────────
router.get('/score/:userId', verifierToken, async (req, res) => {
  try {
    const { calculerScore, labelScore } = require('../services/scoreService');
    var score  = await calculerScore(req.params.userId);
    var label  = labelScore(score);
    res.json({ score, ...label });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});
// ─── SUPPRIMER MON COMPTE ─────────────────────────────────────────
router.delete('/compte', verifierToken, async (req, res) => {
  try {
    var userId = req.user.id;

    // Vérifier qu'il n'est pas admin
    if (req.user.role === 'admin') {
      return res.status(403).json({ erreur: 'Les comptes admin ne peuvent pas être supprimés via cette route.' });
    }

    // Vérifier mot de passe si fourni
    if (req.body.mot_de_passe) {
      var userCheck = await db.query('SELECT mot_de_passe FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
      var bcrypt  = require('bcrypt');
      var valide  = await bcrypt.compare(req.body.mot_de_passe, userCheck.rows[0].mot_de_passe);
      if (!valide) return res.status(401).json({ erreur: 'Mot de passe incorrect' });
    }

    // 1. Annuler les réservations actives
    await db.query(
      `UPDATE reservations SET statut = 'annulee'
       WHERE (locataire_id = $1 OR logement_id IN (SELECT id FROM logements WHERE proprietaire_id = $1))
         AND statut NOT IN ('terminee', 'annulee', 'refusee')`,
      [userId]
    );

    // 2. Masquer les logements du proprio
    await db.query(
      `UPDATE logements SET statut = 'indisponible' WHERE proprietaire_id = $1`,
      [userId]
    );

    // 3. Supprimer les push subscriptions
    await db.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);

    // 4. Supprimer les OTP
    await db.query('DELETE FROM otp_telephone WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM otp_admin WHERE user_id = $1', [userId]).catch(function() {});

    // 5. Anonymiser l'utilisateur (soft delete — garde les données contractuelles)
    await db.query(
      `UPDATE users SET
         nom              = 'Utilisateur',
         prenom           = 'Supprimé',
         email            = 'deleted_' || id || '@werdhe.com',
         telephone        = NULL,
         mot_de_passe     = '',
         google_id        = NULL,
         score_confiance  = 0,
         suspendu         = TRUE,
         onboarding_termine = TRUE
       WHERE id = $1`,
      [userId]
    );

    // Log audit
    await db.query(
      `INSERT INTO logs_audit (user_id, action, details, created_at)
       VALUES ($1, 'compte_supprime', $2, NOW())`,
      [userId, JSON.stringify({ role: req.user.role, date: new Date().toISOString() })]
    ).catch(function() {});

    res.json({ message: 'Compte supprimé avec succès.' });

  } catch (err) {
    console.error('[DELETE /auth/compte]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});
module.exports = router;