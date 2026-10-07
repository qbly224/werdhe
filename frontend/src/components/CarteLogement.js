import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './CarteLogement.css';

const CarteLogement = ({ logement }) => {
  const t = useTranslation('logements').t;

  const CATEGORIE_INFO = {
    villa_luxe:       { icon: '👑', label: t('carteLogement.categories.villaLuxe') },
    villa_standard:   { icon: '🏰', label: t('carteLogement.categories.villa') },
    maison_moderne:   { icon: '🏠', label: t('carteLogement.categories.maison') },
    maison_banco:     { icon: '🛖', label: t('carteLogement.categories.maisonTraditionnelle') },
    maison_chantier:  { icon: '🏗️', label: t('carteLogement.categories.enConstruction') },
    concession:       { icon: '🏘️', label: t('carteLogement.categories.concession') },
    appartement:      { icon: '🏢', label: t('carteLogement.categories.appartement') },
    duplex:           { icon: '🏬', label: t('carteLogement.categories.duplex') },
    logement_social:  { icon: '🏛️', label: t('carteLogement.categories.logementSocial') },
    studio_moderne:   { icon: '🏨', label: t('carteLogement.categories.studio') },
    chambre_habitant: { icon: '🛏️', label: t('carteLogement.categories.chambre') },
    chambre_cour:     { icon: '🚪', label: t('carteLogement.categories.chambreCour') },
    habitat_precaire: { icon: '🏚️', label: t('carteLogement.categories.habitatPrecaire') },
    boutique:         { icon: '🏪', label: t('carteLogement.categories.boutique') },
    bureau:           { icon: '💼', label: t('carteLogement.categories.bureau') },
    entrepot:         { icon: '🏭', label: t('carteLogement.categories.entrepot') },
    local_commercial: { icon: '🏬', label: t('carteLogement.categories.localCommercial') },
    centre_commercial:{ icon: '🛍️', label: t('carteLogement.categories.centreCommercial') }
  };

  const cat = CATEGORIE_INFO[logement.categorie] || { icon: '🏠', label: t('carteLogement.categories.logementParDefaut') };

  // Récupérer la première photo si disponible
  const photos = logement.photos
    ? (typeof logement.photos === 'string'
        ? JSON.parse(logement.photos)
        : logement.photos)
    : [];
  const photoUrl = photos.length > 0 ? photos[0].url : null;

  return (
    <div className="carte-logement">

      {/* Image */}
      <div className="carte-image">
        {photoUrl ? (
          <img src={photoUrl} alt={logement.titre} className="carte-photo" />
        ) : (
          <span className="carte-cat-icon">{cat.icon}</span>
        )}
        <span className={`carte-statut ${logement.statut}`}>
          {logement.statut === 'disponible' ? t('carteLogement.statut.disponible') : t('carteLogement.statut.loue')}
        </span>
        <span className="carte-categorie-badge">
          {cat.icon} {cat.label}
        </span>
        {photos.length > 1 && (
          <span className="carte-nb-photos">{t('carteLogement.nbPhotos', { count: photos.length })}</span>
        )}
      </div>

      {/* Infos */}
      <div className="carte-body">
        <h3 className="carte-titre">{logement.titre}</h3>

        <p className="carte-adresse">
          📍 {logement.adresse}, {logement.ville}
        </p>

        <div className="carte-details">
          {logement.nb_chambres > 0 && (
            <span>{t('carteLogement.chambresAbrev', { count: logement.nb_chambres })}</span>
          )}
          {logement.nb_salles_bain > 0 && (
            <span>{t('carteLogement.sdbAbrev', { count: logement.nb_salles_bain })}</span>
          )}
          {logement.superficie && (
            <span>{t('carteLogement.superficieAbrev', { superficie: logement.superficie })}</span>
          )}
          {logement.etat && logement.etat !== 'bon_etat' && (
            <span>
              {logement.etat === 'neuf' ? t('carteLogement.etat.neuf')
                : logement.etat === 'a_renover' ? t('carteLogement.etat.aRenover')
                : logement.etat === 'en_construction' ? t('carteLogement.etat.enConstruction')
                : ''}
            </span>
          )}
        </div>

        <div className="carte-footer">
          <span className="carte-prix">
            {Number(logement.prix_mensuel).toLocaleString()} GNF
            <small>{t('carteLogement.prixParMois')}</small>
          </span>
          <div style={{display:'flex', gap:'8px'}}>
            <Link to={`/logements/${logement.id}`} className="btn btn-primary">
              {t('carteLogement.details')}
            </Link>
            {logement.statut === 'disponible' && (
              <Link
                to={`/logements/${logement.id}/reserver`}
                className="btn btn-secondary"
              >
                {t('carteLogement.reserver')}
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CarteLogement;