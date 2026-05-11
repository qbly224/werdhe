const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// ================================
// INSCRIPTION
// ================================
const register = async (req, res) => {
  try {
    // 1. Récupérer les données envoyées par l'utilisateur
    const { nom, prenom, email, telephone, mot_de_passe, role } = req.body;

    // 2. Vérifier que tous les champs obligatoires sont présents
    if (!nom || !prenom || !email || !mot_de_passe || !role) {
      return res.status(400).json({
        erreur: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // 3. Vérifier si l'email existe déjà en base de données
    const userExistant = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExistant.rows.length > 0) {
      return res.status(400).json({
        erreur: 'Cet email est déjà utilisé'
      });
    }

    // 4. Chiffrer le mot de passe
    // Le "10" = niveau de complexité du chiffrement (bcrypt salt rounds)
    // Plus le chiffre est élevé, plus c'est sécurisé mais lent
    const motDePasseChiffre = await bcrypt.hash(mot_de_passe, 10);

    // 5. Enregistrer l'utilisateur en base de données
    const nouvelUtilisateur = await db.query(
      `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nom, prenom, email, role`,
      [nom, prenom, email, telephone, motDePasseChiffre, role]
    );

    const user = nouvelUtilisateur.rows[0];

    // 6. Créer le token JWT
    // Ce token contient l'ID et le role de l'utilisateur
    // Il expire dans 7 jours
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. Retourner la réponse
    res.status(201).json({
      message: '✅ Compte créé avec succès !',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Erreur inscription:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// CONNEXION
// ================================
const login = async (req, res) => {
  try {
    // 1. Récupérer email et mot de passe
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        erreur: 'Email et mot de passe requis'
      });
    }

    // 2. Chercher l'utilisateur en base de données
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erreur: 'Email ou mot de passe incorrect'
      });
    }

    const user = result.rows[0];

    // 3. Vérifier le mot de passe
    // bcrypt compare le mot de passe saisi avec le hash stocké en DB
    const motDePasseValide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!motDePasseValide) {
      return res.status(401).json({
        erreur: 'Email ou mot de passe incorrect'
      });
    }

    // 4. Créer le token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Retourner la réponse
    res.json({
      message: '✅ Connexion réussie !',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Erreur connexion:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};
// ================================
// MOT DE PASSE OUBLIÉ
// ================================
// Génère un nouveau mot de passe temporaire
const motDePasseOublie = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erreur: 'Email requis' });
    }

    // Vérifier que l'email existe
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // On répond toujours "succès" pour ne pas révéler
      // si l'email existe ou non — bonne pratique sécurité
      return res.json({
        message: 'Si cet email existe, un nouveau mot de passe a été envoyé.'
      });
    }

    // Générer un mot de passe temporaire
    const nouveauMotDePasse = Math.random()
      .toString(36).slice(-8).toUpperCase();

    // Chiffrer le nouveau mot de passe
    const hash = await bcrypt.hash(nouveauMotDePasse, 10);

    // Mettre à jour en base
    await db.query(
      'UPDATE users SET mot_de_passe = $1 WHERE email = $2',
      [hash, email]
    );

    // En production on enverrait un email
    // Pour l'instant on retourne le mot de passe temporaire
    res.json({
      message: '✅ Nouveau mot de passe généré !',
      mot_de_passe_temporaire: nouveauMotDePasse,
      instruction: 'Connectez-vous avec ce mot de passe puis changez-le.'
    });

  } catch (err) {
    console.error('Erreur mot de passe oublié:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};
const crypto = require('crypto');
const { envoyerEmailReset } = require('../services/emailService');

// ================================
// DEMANDE RESET MOT DE PASSE
// ================================
const demanderReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erreur: 'Email requis' });
    }

    // Chercher l'utilisateur
    const result = await db.query(
      'SELECT id, nom, prenom, email FROM users WHERE email = $1',
      [email]
    );

    // Sécurité : ne pas révéler si l'email existe ou non
    if (result.rows.length === 0) {
      return res.json({
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation.'
      });
    }

    const user = result.rows[0];

    // Générer un token unique et sécurisé
    const token = crypto.randomBytes(32).toString('hex');

    // Expiration dans 1 heure
    const expireAt = new Date(Date.now() + 60 * 60 * 1000);

    // Supprimer les anciens tokens de cet utilisateur
    await db.query(
      'DELETE FROM reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Sauvegarder le nouveau token
    await db.query(
      `INSERT INTO reset_tokens (user_id, token, expire_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expireAt]
    );

    // Construire le lien de reset
    const lienReset = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Envoyer l'email
    await envoyerEmailReset(user.email, user.prenom, lienReset);

    res.json({
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation.'
    });

  } catch (err) {
    console.error('Erreur demande reset:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================
// RÉINITIALISER LE MOT DE PASSE
// ================================
const resetMotDePasse = async (req, res) => {
  try {
    const { token, nouveau_mot_de_passe } = req.body;

    if (!token || !nouveau_mot_de_passe) {
      return res.status(400).json({
        erreur: 'Token et nouveau mot de passe requis'
      });
    }

    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({
        erreur: 'Le mot de passe doit faire au moins 6 caractères'
      });
    }

    // Vérifier le token
    const result = await db.query(
      `SELECT * FROM reset_tokens
       WHERE token = $1
       AND expire_at > NOW()
       AND utilise = FALSE`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        erreur: 'Lien invalide ou expiré. Veuillez faire une nouvelle demande.'
      });
    }

    const resetToken = result.rows[0];

    // Chiffrer le nouveau mot de passe
    const motDePasseChiffre = await bcrypt.hash(nouveau_mot_de_passe, 10);

    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE users SET mot_de_passe = $1 WHERE id = $2',
      [motDePasseChiffre, resetToken.user_id]
    );

    // Marquer le token comme utilisé
    await db.query(
      'UPDATE reset_tokens SET utilise = TRUE WHERE id = $1',
      [resetToken.id]
    );

    res.json({
      message: '✅ Mot de passe réinitialisé avec succès ! Vous pouvez vous connecter.'
    });

  } catch (err) {
    console.error('Erreur reset mot de passe:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};
module.exports = {
  register,
  login,
  demanderReset,
  resetMotDePasse
};