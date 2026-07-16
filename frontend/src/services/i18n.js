// ─── Traductions Werdhe ──────────────────────────────────────────
var TRADUCTIONS = {
  fr: {
    // Navigation
    'tableau_bord':    'Tableau de bord',
    'mes_biens':       'Mes biens',
    'reservations':    'Réservations',
    'paiements':       'Paiements',
    'messages':        'Messages',
    'documents':       'Documents',
    'reclamations':    'Réclamations',
    'preavis':         'Préavis',
    'parametres':      'Paramètres',
    'mes_locations':   'Mes locations',
    'locataires':      'Locataires',

    // Actions
    'connexion':       'Se connecter',
    'inscription':     'S\'inscrire',
    'deconnexion':     'Se déconnecter',
    'ajouter':         'Ajouter',
    'modifier':        'Modifier',
    'supprimer':       'Supprimer',
    'envoyer':         'Envoyer',
    'annuler':         'Annuler',
    'confirmer':       'Confirmer',
    'rechercher':      'Rechercher',
    'telecharger':     'Télécharger',

    // Statuts
    'disponible':      'Disponible',
    'occupe':          'Occupé',
    'en_attente':      'En attente',
    'acceptee':        'Acceptée',
    'refusee':         'Refusée',
    'confirmee':       'Confirmée',

    // Messages courants
    'bienvenue':       'Bienvenue',
    'chargement':      'Chargement...',
    'erreur':          'Une erreur est survenue',
    'succes':          'Opération réussie',
    'aucun_resultat':  'Aucun résultat',
    'loyer_mensuel':   'Loyer mensuel',
    'date_entree':     'Date d\'entrée',
    'chercher_logement': 'Chercher un logement',
  },

  pular: {
    // Navigation
    'tableau_bord':    'Tablo hoore',
    'mes_biens':       'Hakkunde am',
    'reservations':    'Reservasiiji',
    'paiements':       'Liggeeji',
    'messages':        'Tindirɗe',
    'documents':       'Takkaari',
    'reclamations':    'Hollitiiji',
    'preavis':         'Habrande',
    'parametres':      'Suɓorɗe',
    'mes_locations':   'Suudu am',
    'locataires':      'Suudu-jeyaaɓe',

    // Actions
    'connexion':       'Naatde',
    'inscription':     'Innde',
    'deconnexion':     'Yaltude',
    'ajouter':         'Moɓɓude',
    'modifier':        'Rewindude',
    'supprimer':       'Dabbude',
    'envoyer':         'Neldude',
    'annuler':         'Haɗde',
    'confirmer':       'Jaɓde',
    'rechercher':      'Yiylude',
    'telecharger':     'Wurndude',

    // Statuts
    'disponible':      'Wodaani',
    'occupe':          'Heɓii',
    'en_attente':      'Ɗannii',
    'acceptee':        'Jaɓaama',
    'refusee':         'Haɗaama',
    'confirmee':       'Jaɓaama haa timmi',

    // Messages courants
    'bienvenue':       'Ngaran e jam',
    'chargement':      'Ɗannude...',
    'erreur':          'Juumre waɗii',
    'succes':          'Jaraama',
    'aucun_resultat':  'Alaa fijirde',
    'loyer_mensuel':   'Liggal lewru',
    'date_entree':     'Ñalnde naatde',
    'chercher_logement': 'Yiylu suudu',
  },

  malinke: {
    // Navigation
    'tableau_bord':    'Kunnafoni bɔrɔ',
    'mes_biens':       'N ka fɛn',
    'reservations':    'Bɔlɔsiw',
    'paiements':       'Sara',
    'messages':        'Kuma',
    'documents':       'Sɛbɛnni',
    'reclamations':    'Ɲininkali',
    'preavis':         'Kunnafoni',
    'parametres':      'Ɲɛnabɔli',
    'mes_locations':   'N ka so',
    'locataires':      'So jeli',

    // Actions
    'connexion':       'Dòn',
    'inscription':     'Tɔgɔ sɛbɛn',
    'deconnexion':     'Bɔ',
    'ajouter':         'Fara',
    'modifier':        'Yɛlɛma',
    'supprimer':       'Bɔ',
    'envoyer':         'Ci',
    'annuler':         'Bali',
    'confirmer':       'Dafa',
    'rechercher':      'Dòn',
    'telecharger':     'Sɔrɔ',

    // Statuts
    'disponible':      'Ɲɛ bɛ',
    'occupe':          'Dòn',
    'en_attente':      'Makɔnɔ',
    'acceptee':        'Sɔn',
    'refusee':         'Sɔn tɛ',
    'confirmee':       'Dafara',

    // Messages courants
    'bienvenue':       'Aw ni ce',
    'chargement':      'Tali...',
    'erreur':          'Fili bɛ yen',
    'succes':          'Aw ni baara',
    'aucun_resultat':  'Fɛn tɛ sɔrɔ',
    'loyer_mensuel':   'Kalo sara',
    'date_entree':     'Don dòn lɔgɔ',
    'chercher_logement': 'So nini',
  }
};

var langueActuelle = localStorage.getItem('werdhe_langue') || 'fr';

function t(cle) {
  var traductions = TRADUCTIONS[langueActuelle] || TRADUCTIONS.fr;
  return traductions[cle] || TRADUCTIONS.fr[cle] || cle;
}

function changerLangue(langue) {
  langueActuelle = langue;
  localStorage.setItem('werdhe_langue', langue);
  window.location.reload();
}

function getLangue() {
  return langueActuelle;
}

export { t, changerLangue, getLangue, TRADUCTIONS };