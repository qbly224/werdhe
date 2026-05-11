import { Link } from 'react-router-dom';
import './CarteLogement.css';

// Icônes et labels des catégories
const CATEGORIE_INFO = {
  appartement: { icon: '🏢', label: 'Appartement' },
  studio:      { icon: '🏨', label: 'Studio' },
  maison:      { icon: '🏠', label: 'Maison' },
  villa:       { icon: '👑', label: 'Villa' },
  terrain:     { icon: '🏗️', label: 'Terrain' },
  local_commercial: { icon: '🏪', label: 'Local commercial' }
};

const CarteLogement = ({ logement }) => {
  const cat = CATEGORIE_INFO[logement.categorie] || {
    icon: '🏠', label: 'Logement'
  };

  return (
    <div className="carte-logement">

      {/* Image */}
      <div className="carte-image">
        <span className="carte-cat-icon">{cat.icon}</span>
        <span className={`carte-statut ${logement.statut}`}>
          {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
        </span>
        <span className="carte-categorie-badge">{cat.label}</span>
      </div>

      {/* Infos */}
      <div className="carte-body">
        <h3 className="carte-titre">{logement.titre}</h3>

        <p className="carte-adresse">
          📍 {logement.adresse}, {logement.ville}
        </p>

        <div className="carte-details">
          {logement.categorie !== 'terrain' &&
           logement.categorie !== 'local_commercial' && (
            <span>🛏 {logement.nb_chambres} ch.</span>
          )}
          {logement.categorie !== 'terrain' && (
            <span>🚿 {logement.nb_salles_bain} sdb.</span>
          )}
          {logement.superficie && (
            <span>📐 {logement.superficie} m²</span>
          )}
        </div>

        <div className="carte-footer">
          <span className="carte-prix">
            {Number(logement.prix_mensuel).toLocaleString()} GNF
            <small>/mois</small>
          </span>
          <div style={{display:'flex', gap:'8px'}}>
            <Link
              to={`/logements/${logement.id}`}
              className="btn btn-primary"
            >
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