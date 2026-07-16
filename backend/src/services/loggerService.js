// ─── Logger structuré Werdhe ─────────────────────────────────────
var couleurs = {
  info:    '\x1b[36m',  // Cyan
  succes:  '\x1b[32m',  // Vert
  warn:    '\x1b[33m',  // Jaune
  erreur:  '\x1b[31m',  // Rouge
  reset:   '\x1b[0m'
};

function formater(niveau, message, data) {
  var date    = new Date().toISOString();
  var couleur = couleurs[niveau] || couleurs.reset;
  var prefix  = couleur + '[' + niveau.toUpperCase() + ']' + couleurs.reset;
  var log     = prefix + ' ' + date + ' — ' + message;
  if (data) log += ' ' + JSON.stringify(data);
  return log;
}

var logger = {
  info:   function(msg, data) { console.log(formater('info',   msg, data)); },
  succes: function(msg, data) { console.log(formater('succes', msg, data)); },
  warn:   function(msg, data) { console.warn(formater('warn',  msg, data)); },
  erreur: function(msg, data) { console.error(formater('erreur',msg, data)); },

  // Logger une requête HTTP
  requete: function(req, res, duree) {
    var niveau = res.statusCode >= 500 ? 'erreur'
               : res.statusCode >= 400 ? 'warn'
               : 'info';
    logger[niveau](
      req.method + ' ' + req.path + ' → ' + res.statusCode + ' (' + duree + 'ms)',
      { ip: req.ip, user: req.user && req.user.id }
    );
  }
};

module.exports = logger;