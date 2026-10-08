import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Crown, Castle, Home, Tent, Construction, Fence, Building2, Layers,
  Landmark, Hotel, BedDouble, DoorOpen, TriangleAlert, Store, Briefcase,
  Warehouse, Building, ShoppingBag
} from 'lucide-react';
import './CarteLogement.css';

// Mapping catégorie -> icône lucide-react (vocabulaire canonique réutilisé
// par les autres pages affichant une icône de catégorie de logement).
export const CATEGORIE_INFO = {
  villa_luxe:       { icon: Crown,         label_key: 'carteLogement.categories.villaLuxe' },
  villa_standard:   { icon: Castle,        label_key: 'carteLogement.categories.villa' },
  maison_moderne:   { icon: Home,          label_key: 'carteLogement.categories.maison' },
  maison_banco:     { icon: Tent,          label_key: 'carteLogement.categories.maisonTraditionnelle' },
  maison_chantier:  { icon: Construction,  label_key: 'carteLogement.categories.enConstruction' },
  concession:       { icon: Fence,         label_key: 'carteLogement.categories.concession' },
  appartement:      { icon: Building2,     label_key: 'carteLogement.categories.appartement' },
  duplex:           { icon: Layers,        label_key: 'carteLogement.categories.duplex' },
  logement_social:  { icon: Landmark,      label_key: 'carteLogement.categories.logementSocial' },
  studio_moderne:   { icon: Hotel,         label_key: 'carteLogement.categories.studio' },
  chambre_habitant: { icon: BedDouble,     label_key: 'carteLogement.categories.chambre' },
  chambre_cour:     { icon: DoorOpen,      label_key: 'carteLogement.categories.chambreCour' },
  habitat_precaire: { icon: TriangleAlert, label_key: 'carteLogement.categories.habitatPrecaire' },
  boutique:         { icon: Store,         label_key: 'carteLogement.categories.boutique' },
  bureau:           { icon: Briefcase,     label_key: 'carteLogement.categories.bureau' },
  entrepot:         { icon: Warehouse,     label_key: 'carteLogement.categories.entrepot' },
  local_commercial: { icon: Building,      label_key: 'carteLogement.categories.localCommercial' },
  centre_commercial:{ icon: ShoppingBag,   label_key: 'carteLogement.categories.centreCommercial' }
};

export const CATEGORIE_DEFAUT = { icon: Home, label_key: 'carteLogement.categories.logementParDefaut' };

const CarteLogement = ({ logement }) => {
  const t = useTranslation('logements').t;

  const catInfo = CATEGORIE_INFO[logement.categorie] || CATEGORIE_DEFAUT;
  const cat = { icon: catInfo.icon, label: t(catInfo.label_key) };
  const CatIcon = cat.icon;

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
          <span className="carte-cat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CatIcon size={56} strokeWidth={1.5} color="#1B6B3A" />
          </span>
        )}
        <span className={`carte-statut ${logement.statut}`}>
          {logement.statut === 'disponible' ? t('carteLogement.statut.disponible') : t('carteLogement.statut.loue')}
        </span>
        <span className="carte-categorie-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CatIcon size={12} strokeWidth={1.8} /> {cat.label}
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