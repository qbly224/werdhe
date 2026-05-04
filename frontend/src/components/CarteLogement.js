import { Link } from 'react-router-dom';
import './CarteLogement.css';

const CarteLogement = ({ logement }) => {
  return (
    <div className="carte-logement">

      {/* Image placeholder */}
      <div className="carte-image">
        🏠
        <span className={`carte-statut ${logement.statut}`}>
          {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
        </span>
      </div>

      {/* Infos */}
      <div className="carte-body">
        <h3 className="carte-titre">{logement.titre}</h3>

        <p className="carte-adresse">
          📍 {logement.adresse}, {logement.ville}
        </p>

        <div className="carte-details">
          <span>🛏 {logement.nb_chambres} chambre(s)</span>
          <span>🚿 {logement.nb_salles_bain} salle(s) de bain</span>
          {logement.superficie && (
            <span>📐 {logement.superficie} m²</span>
          )}
        </div>

        <div className="carte-footer">
          <span className="carte-prix">
            {Number(logement.prix_mensuel).toLocaleString()} GNF
            <small>/mois</small>
          </span>
          <Link
            to={`/logements/${logement.id}`}
            className="btn btn-primary"
          >
            Voir détails
          </Link>
        </div>
      </div>

    </div>
  );
};

export default CarteLogement;