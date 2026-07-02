const jwt = require('jsonwebtoken');

const verifierToken = (req, res, next) => {
  // 1. Récupérer le token dans le header de la requête
  // Le token est envoyé dans le header "Authorization: Bearer TOKEN"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Si pas de token → accès refusé
  if (!token) {
    return res.status(401).json({
      erreur: 'Accès refusé - Token manquant'
    });
  }

  // 3. Vérifier que le token est valide
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded contient { id, role } qu'on a mis dans le token
    req.user = decoded;
    next(); // Tout est bon, on passe à la route suivante
  } catch (err) {
    res.status(403).json({
      erreur: 'Token invalide ou expiré'
    });
  }
};

const crypto = require('crypto');

// ─── ENVOYER OTP PAR TÉLÉPHONE ──────────────────────────────────
router.post('/telephone/envoyer-otp', async (req, res) => {
  try {
    var { telephone } = req.body;
    if (!telephone) {
      return res.status(400).json({ erreur: 'Numéro de téléphone requis' });
    }

    // Normaliser le numéro (+224 pour la Guinée)
    var tel = telephone.replace(/\s+/g, '').replace(/^00/, '+');
    if (!tel.startsWith('+')) {
      tel = '+224' + tel.replace(/^0/, '');
    }

    // Générer un code OTP à 6 chiffres
    var code = Math.floor(100000 + Math.random() * 900000).toString();
    var expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Supprimer les anciens OTP pour ce numéro
    await db.query(
      'DELETE FROM otp_telephone WHERE telephone = $1',
      [tel]
    );

    // Sauvegarder le nouvel OTP
    await db.query(
      `INSERT INTO otp_telephone (telephone, code, expire_at)
       VALUES ($1, $2, $3)`,
      [tel, code, expireAt]
    );

    // Envoyer le SMS (via Africa's Talking ou simulation)
    var smsSent = false;
    if (process.env.AFRICAS_TALKING_API_KEY) {
      try {
        const AfricasTalking = require('africastalking');
        const at = AfricasTalking({
          apiKey:   process.env.AFRICAS_TALKING_API_KEY,
          username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox'
        });
        await at.SMS.send({
          to:      [tel],
          message: 'Votre code Werdhe : ' + code + '. Valable 10 minutes.',
          from:    'Werdhe'
        });
        smsSent = true;
        console.log('[OTP] SMS envoyé à', tel);
      } catch (smsErr) {
        console.warn('[OTP] SMS échoué:', smsErr.message);
      }
    }

    // En mode développement ou si SMS échoué → retourner le code dans la réponse
    if (!smsSent) {
      console.log('[OTP] Code pour', tel, ':', code);
      return res.json({
        message: 'Code OTP généré',
        telephone: tel,
        // En production retirer cette ligne :
        code_dev: process.env.NODE_ENV !== 'production' ? code : undefined
      });
    }

    res.json({
      message: 'Code OTP envoyé par SMS',
      telephone: tel
    });

  } catch (err) {
    console.error('[POST /auth/telephone/envoyer-otp]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
});

// ─── VÉRIFIER OTP ET CONNEXION ───────────────────────────────────
router.post('/telephone/verifier-otp', async (req, res) => {
  try {
    var { telephone, code, nom, prenom, role } = req.body;

    var tel = telephone.replace(/\s+/g, '').replace(/^00/, '+');
    if (!tel.startsWith('+')) {
      tel = '+224' + tel.replace(/^0/, '');
    }

    // Vérifier l'OTP
    var otpResult = await db.query(
      `SELECT * FROM otp_telephone
       WHERE telephone = $1
         AND code = $2
         AND utilise = FALSE
         AND expire_at > NOW()
       LIMIT 1`,
      [tel, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ erreur: 'Code invalide ou expiré' });
    }

    // Marquer l'OTP comme utilisé
    await db.query(
      'UPDATE otp_telephone SET utilise = TRUE WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Chercher l'utilisateur par téléphone
    var userResult = await db.query(
      'SELECT * FROM users WHERE telephone = $1',
      [tel]
    );

    var user;

    if (userResult.rows.length > 0) {
      // Utilisateur existant → connexion
      user = userResult.rows[0];
    } else {
      // Nouvel utilisateur → créer le compte
      if (!role) {
        return res.status(200).json({
          nouveau_utilisateur: true,
          telephone: tel,
          message: 'Nouveau compte — renseignez vos informations'
        });
      }

      var nouveauUser = await db.query(
        `INSERT INTO users
           (telephone, nom, prenom, role, mot_de_passe, email)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          tel,
          nom || 'Utilisateur',
          prenom || '',
          role || 'locataire',
          crypto.randomBytes(32).toString('hex'), // mot de passe aléatoire
          tel + '@werdhe-phone.com' // email fictif basé sur le téléphone
        ]
      );

      user = nouveauUser.rows[0];

      // Créer abonnement gratuit si proprio
      if (['proprietaire', 'les_deux'].includes(user.role)) {
        await db.query(
          `INSERT INTO abonnements (user_id, plan, statut)
           VALUES ($1, 'gratuit', 'actif')`,
          [user.id]
        ).catch(console.warn);
      }
    }

    // Générer le JWT
    const jwt = require('jsonwebtoken');
    var token = jwt.sign(
      {
        id:    user.id,
        email: user.email,
        role:  user.role,
        nom:   user.nom,
        prenom: user.prenom,
        plan:  user.plan || 'gratuit'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
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
    console.error('[POST /auth/telephone/verifier-otp]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur : ' + err.message });
  }
});

module.exports = function verifierToken(req, res, next) {
  // Token depuis header Authorization OU depuis query param
  var token = null;
  var authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;  // ← AJOUTER
  }

  if (!token) return res.status(401).json({ erreur: 'Accès refusé - Token manquant' });

  try {
    var decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erreur: 'Token invalide ou expiré' });
  }
};