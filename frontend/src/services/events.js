// Système d'événements global Werdhe
// Permet la communication entre composants sans prop drilling

var WerdheEvents = {
  // Déclencher un événement
  emit: function(event, data) {
    window.dispatchEvent(new CustomEvent('werdhe:' + event, { detail: data }));
  },

  // Écouter un événement
  on: function(event, callback) {
    window.addEventListener('werdhe:' + event, function(e) {
      callback(e.detail);
    });
  },

  // Arrêter d'écouter
  off: function(event, callback) {
    window.removeEventListener('werdhe:' + event, callback);
  },

  // Événements disponibles
  REFRESH:      'refresh',       // Rafraîchir toutes les données
  LOGEMENT:     'logement',      // Un bien a changé
  RESERVATION:  'reservation',   // Une réservation a changé
  PAIEMENT:     'paiement',      // Un paiement a changé
  MESSAGE:      'message',       // Un nouveau message
  ALERTE:       'alerte',        // Une nouvelle alerte
  PREAVIS:      'preavis',       // Un préavis a changé
};

module.exports = WerdheEvents;