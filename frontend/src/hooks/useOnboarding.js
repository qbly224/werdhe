/* eslint-disable */
import { useState, useEffect } from 'react';

var ETAPES_PROPRIO = [
  { id: 'sidebar',       cible: '[data-tour="sidebar"]',       titre: 'Navigation',         desc: 'Accédez à toutes vos fonctionnalités depuis la barre latérale.',                 position: 'right'  },
  { id: 'header-tabs',   cible: '[data-tour="header-tabs"]',   titre: 'Onglets rapides',    desc: 'Naviguez rapidement entre vos sections principales depuis le haut.',             position: 'bottom' },
  { id: 'kpis',          cible: '[data-tour="kpis"]',          titre: 'Vos indicateurs',    desc: 'Suivez vos revenus, biens, candidatures et alertes en un coup d\'œil.',          position: 'bottom' },
  { id: 'ajouter-bien',  cible: '[data-tour="ajouter-bien"]',  titre: 'Ajouter un bien',    desc: 'Publiez votre premier logement en 5 minutes. Photos, prix, localisation.',       position: 'bottom' },
  { id: 'recherche',     cible: '[data-tour="recherche"]',     titre: 'Recherche rapide',   desc: 'Ctrl+K pour chercher un locataire, logement ou accéder à n\'importe quelle page.', position: 'bottom' },
  { id: 'notifications', cible: '[data-tour="notifications"]', titre: 'Notifications',      desc: 'Restez informé de toutes les activités : loyers, candidatures, messages.',       position: 'bottom' },
];

var ETAPES_LOCATAIRE = [
  { id: 'sidebar',      cible: '[data-tour="sidebar"]',      titre: 'Navigation',       desc: 'Accédez à vos locations, paiements et messages depuis la barre latérale.',  position: 'right'  },
  { id: 'kpis',         cible: '[data-tour="kpis"]',         titre: 'Votre situation',  desc: 'Consultez vos locations actives, paiements à venir et votre score de confiance.', position: 'bottom' },
  { id: 'recherche',    cible: '[data-tour="recherche"]',    titre: 'Recherche rapide', desc: 'Ctrl+K pour accéder rapidement à n\'importe quelle section.',              position: 'bottom' },
  { id: 'notifications',cible: '[data-tour="notifications"]',titre: 'Alertes',          desc: 'Soyez notifié des nouveaux messages et mises à jour de vos candidatures.', position: 'bottom' },
];

export default function useOnboarding(role) {
  var cleDone = 'werdhe-tour-' + (role || 'proprio') + '-done';
  var etapes  = role === 'locataire' ? ETAPES_LOCATAIRE : ETAPES_PROPRIO;

  var [actif, setActif]     = useState(false);
  var [etape, setEtape]     = useState(0);

  useEffect(function() {
    var done = localStorage.getItem(cleDone);
    if (!done) {
      // Lancer le tour après 1.5s (laisse le temps au dashboard de charger)
      var t = setTimeout(function() { setActif(true); }, 1500);
      return function() { clearTimeout(t); };
    }
  }, [cleDone]);

  function suivant() {
    if (etape < etapes.length - 1) {
      setEtape(etape + 1);
    } else {
      terminer();
    }
  }

  function passer() { terminer(); }

  function terminer() {
    setActif(false);
    localStorage.setItem(cleDone, 'true');
  }

  function relancer() {
    localStorage.removeItem(cleDone);
    setEtape(0);
    setActif(true);
  }

  return {
    actif, etape,
    etapeActuelle: etapes[etape],
    totalEtapes: etapes.length,
    suivant, passer, terminer, relancer,
  };
}