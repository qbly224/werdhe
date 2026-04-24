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

module.exports = { register, login };