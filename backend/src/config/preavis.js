// Délais de préavis (en jours). Valeurs par défaut, modifiables sans toucher au
// code via les variables d'environnement PREAVIS_DELAI_LOCATAIRE_JOURS et
// PREAVIS_DELAI_PROPRIETAIRE_JOURS.
//
// À CONFIRMER avec un juriste guinéen : 30 jours correspond à la mention
// « au moins un mois » du modèle de bail, ce n'est pas un avis juridique.
function lireJours(nom, defaut) {
  var n = parseInt(process.env[nom], 10);
  return Number.isFinite(n) && n >= 0 && n <= 730 ? n : defaut;
}

module.exports = {
  delaiMinimumJours: function (auteur) {
    return auteur === 'proprietaire'
      ? lireJours('PREAVIS_DELAI_PROPRIETAIRE_JOURS', 30)
      : lireJours('PREAVIS_DELAI_LOCATAIRE_JOURS', 30);
  },
  delaiMaximumJours: 730,
  rappelAccuseHeures: 48
};
