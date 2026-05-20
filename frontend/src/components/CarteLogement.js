import { Link } from 'react-router-dom';
import './CarteLogement.css';

const CATEGORIE_INFO = {
  villa_luxe:       { icon: '👑', label: 'Villa luxe' },
  villa_standard:   { icon: '🏰', label: 'Villa' },
  maison_moderne:   { icon: '🏠', label: 'Maison' },
  maison_banco:     { icon: '🛖', label: 'Maison traditionnelle' },
  maison_chantier:  { icon: '🏗️', label: 'En construction' },
  concession:       { icon: '🏘️', label: 'Concession' },
  appartement:      { icon: '🏢', label: 'Appartement' },
  duplex:           { icon: '🏬', label: 'Duplex' },
  logement_social:  { icon: '🏛️', label: 'Logement social' },
  studio_moderne:   { icon: '🏨', label: 'Studio' },
  chambre_habitant: { icon: '🛏️', label: 'Chambre' },
  chambre_cour:     { icon: '🚪', label: 'Chambre cour' },
  habitat_precaire: { icon: '🏚️', label: 'Habitat précaire' },
  boutique:         { icon: '🏪', label: 'Boutique' },
  bureau:           { icon: '💼', label: 'Bureau' },
  entrepot:         { icon: '🏭', label: 'Entrepôt' },
  local_commercial: { icon: '🏬', label: 'Local commercial' },
  centre_commercial:{ icon: '🛍️', label: 'Centre commercial' }
};

const CarteLogement = ({ logement }) => {
  const cat = CATEGORIE_INFO[logement.categorie] || { icon: '🏠', label: 'Logement' };

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
          {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
        </span>
        <span className="carte-categorie-badge">
          {cat.icon} {cat.label}
        </span>
        {photos.length > 1 && (
          <span className="carte-nb-photos">📸 {photos.length}</span>
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
            <span>🛏 {logement.nb_chambres} ch.</span>
          )}
          {logement.nb_salles_bain > 0 && (
            <span>🚿 {logement.nb_salles_bain} sdb.</span>
          )}
          {logement.superficie && (
            <span>📐 {logement.superficie} m²</span>
          )}
          {logement.etat && logement.etat !== 'bon_etat' && (
            <span>
              {logement.etat === 'neuf' ? '✨ Neuf'
                : logement.etat === 'a_renover' ? '🔧 À rénover'
                : logement.etat === 'en_construction' ? '🏗️ En construction'
                : ''}
            </span>
          )}
        </div>

        <div className="carte-footer">
          <span className="carte-prix">
            {Number(logement.prix_mensuel).toLocaleString()} GNF
            <small>/mois</small>
          </span>
          <div style={{display:'flex', gap:'8px'}}>
            <Link to={`/logements/${logement.id}`} className="btn btn-primary">
              Détails
            </Link>
            {logement.statut === 'disponible' && (
              <Link
                to={`/logements/${logement.id}/reserver`}
                className="btn btn-secondary"
              >
                Réserver
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CarteLogement;