const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const db       = require('../database');

// ─── INSCRIPTION ──────────────────────────────────────────────────
router.post('/inscription', async (req, res) => {
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

    // Créer abonnement gratuit si proprio
    if (['proprietaire', 'les_deux'].includes(user.role)) {
      await db.query(
        `INSERT INTO abonnements (user_id, plan, statut) VALUES ($1, 'gratuit', 'actif')`,
        [user.id]
      ).catch(console.warn);
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Compte créé !',
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit' }
    });
  } catch (err) {
    console.error('[POST /inscription]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// ─── CONNEXION EMAIL ─────────────────────────────────────────────
router.post('/connexion', async (req, res) => {
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

    var valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit' }
    });
  } catch (err) {
    console.error('[POST /connexion]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

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

    console.log('[OTP] Code pour', tel, ':', code);

    res.json({
      message:   'Code OTP généré',
      telephone: tel,
      code_dev:  code
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

    await db.query(
      'UPDATE otp_telephone SET utilise = TRUE WHERE id = $1',
      [otpResult.rows[0].id]
    );

    var userResult = await db.query('SELECT * FROM users WHERE telephone = $1', [tel]);
    var user;

    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      if (!role) {
        return res.status(200).json({ nouveau_utilisateur: true, telephone: tel });
      }
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
    console.error('[OTP verifier]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

// Alias pour compatibilité avec le frontend
router.post('/login', async (req, res) => {
  req.url = '/connexion';
  var { email, mot_de_passe } = req.body;
  if (!email || !mot_de_passe) {
    return res.status(400).json({ erreur: 'Email et mot de passe requis' });
  }
  try {
    var result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }
    var user  = result.rows[0];
    if (user.suspendu) {
      return res.status(403).json({ erreur: 'Compte suspendu. Contactez le support.' });
    }
    var bcrypt = require('bcrypt');
    var valid  = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }
    var token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom, plan: user.plan || 'gratuit' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      message: 'Connexion réussie', token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, telephone: user.telephone, plan: user.plan || 'gratuit' }
    });
  } catch (err) {
    console.error('[POST /login]', err.message);
    res.status(500).json({ erreur: err.message });
  }
});

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

module.exports = router;