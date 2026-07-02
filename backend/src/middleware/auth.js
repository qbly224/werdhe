const jwt = require('jsonwebtoken');

module.exports = function verifierToken(req, res, next) {
  var token = null;
  var authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ erreur: 'Accès refusé - Token manquant' });
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erreur: 'Token invalide ou expiré' });
  }
};