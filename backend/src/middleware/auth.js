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