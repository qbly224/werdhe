const jwt = require('jsonwebtoken');
const db  = require('../database');

// Compte de test exempté du blocage en lecture seule (abonnement impayé)
var EMAIL_EXEMPT_BLOCAGE = 'loc@gmail.com';
var METHODES_ECRITURE = ['POST', 'PUT', 'PATCH', 'DELETE'];

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

    // Abonnement impayé (bloqué au J+5) : lecture seule — aucune nouvelle
    // action n'est autorisée, quelle qu'elle soit, à l'exception du compte
    // de test, des comptes admin, et des routes de paiement/renouvellement
    // de l'abonnement lui-même (sinon un compte bloqué ne pourrait plus
    // jamais régler sa facture pour se débloquer).
    if (
      METHODES_ECRITURE.includes(req.method) &&
      decoded.role !== 'admin' &&
      decoded.email !== EMAIL_EXEMPT_BLOCAGE &&
      !req.originalUrl.startsWith('/abonnements')
    ) {
      db.query('SELECT abonnement_bloque FROM users WHERE id = $1', [decoded.id])
        .then(function(result) {
          if (result.rows[0] && result.rows[0].abonnement_bloque) {
            return res.status(403).json({
              erreur: 'Votre abonnement est impayé — votre compte est en lecture seule. Renouvelez votre abonnement pour continuer.',
              code:   'ABONNEMENT_BLOQUE'
            });
          }
          next();
        })
        .catch(function(err) {
          console.error('[verifierToken] Vérification abonnement_bloque:', err.message);
          next();
        });
      return;
    }

    next();
  } catch (err) {
    return res.status(403).json({ erreur: 'Token invalide ou expiré' });
  }
};