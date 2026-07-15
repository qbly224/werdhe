const Joi = require('joi');

// Schémas de validation
var schemas = {

  inscription: Joi.object({
    nom:          Joi.string().min(2).max(50).required(),
    prenom:       Joi.string().min(2).max(50).allow(''),
    email:        Joi.string().email().required(),
    mot_de_passe: Joi.string().min(6).max(100).required(),
    role:         Joi.string().valid('locataire', 'proprietaire', 'les_deux').default('locataire'),
    telephone:    Joi.string().allow('', null),
  }),

  connexion: Joi.object({
    email:        Joi.string().email().required(),
    mot_de_passe: Joi.string().required(),
  }),

  logement: Joi.object({
    titre:        Joi.string().min(3).max(100).required(),
    description:  Joi.string().max(1000).allow('', null),
    adresse:      Joi.string().required(),
    ville:        Joi.string().required(),
    prix_mensuel: Joi.number().min(0).required(),
    nb_chambres:  Joi.number().min(0).allow(null),
    superficie:   Joi.number().min(0).allow(null),
    categorie:    Joi.string().allow('', null),
  }),

  reservation: Joi.object({
    logement_id:     Joi.string().uuid().required(),
    date_debut:      Joi.string().required(),
    duree_mois:      Joi.number().min(1).max(60).required(),
    message_locataire: Joi.string().max(500).allow('', null),
  }),

  message: Joi.object({
    destinataire_id: Joi.string().uuid().required(),
    contenu:         Joi.string().max(2000).allow('', null),
    reservation_id:  Joi.string().uuid().allow('', null),
  }),

  preavis: Joi.object({
    reservation_id: Joi.string().uuid().required(),
    motif:          Joi.string().min(3).max(200).required(),
    delai_mois:     Joi.number().min(1).max(6).required(),
    note:           Joi.string().max(500).allow('', null),
    type:           Joi.string().valid('locataire', 'proprietaire').required(),
  }),
};

// Middleware de validation
function valider(schema) {
  return function(req, res, next) {
    var s = schemas[schema];
    if (!s) return next();

    var { error } = s.validate(req.body, { abortEarly: false });
    if (error) {
      var messages = error.details.map(function(d) { return d.message; });
      return res.status(400).json({
        erreur: 'Données invalides',
        details: messages
      });
    }
    next();
  };
}

module.exports = { valider };