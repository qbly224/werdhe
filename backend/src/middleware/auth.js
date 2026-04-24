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

module.exports = verifierToken;