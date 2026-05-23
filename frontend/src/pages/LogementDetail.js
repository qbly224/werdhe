import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteLeaflet from '../components/CarteLeaflet';
import './LogementDetail.css';

const CATEGORIES = {
  villa_luxe:        { icon: '👑', label: 'Villa de luxe' },
  villa_standard:    { icon: '🏰', label: 'Villa standard' },
  maison_moderne:    { icon: '🏠', label: 'Maison moderne' },
  maison_banco:      { icon: '🛖', label: 'Maison traditionnelle' },
  maison_chantier:   { icon: '🏗️', label: 'En construction' },
  concession:        { icon: '🏘️', label: 'Concession' },
  appartement:       { icon: '🏢', label: 'Appartement' },
  duplex:            { icon: '🏬', label: 'Duplex' },
  logement_social:   { icon: '🏛️', label: 'Logement social' },
  studio_moderne:    { icon: '🏨', label: 'Studio' },
  chambre_habitant:  { icon: '🛏️', label: 'Chambre' },
  chambre_cour:      { icon: '🚪', label: 'Chambre cour' },
  habitat_precaire:  { icon: '🏚️', label: 'Habitat précaire' },
  boutique:          { icon: '🏪', label: 'Boutique' },
  bureau:            { icon: '💼', label: 'Bureau' },
  entrepot:          { icon: '🏭', label: 'Entrepôt' },
  local_commercial:  { icon: '🏬', label: 'Local commercial' },
  centre_commercial: { icon: '🛍️', label: 'Centre commercial' }
};

function getLabel(map, key, defaut) {
  return map[key] || defaut;
}

function GaleriePhotos({ photos, cat, statut }) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="galerie">
        <div className="galerie-vide">
          <span>{cat.icon}</span>
          <span className={'detail-statut ' + statut}>
            {statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="galerie">
      <div className="galerie-principale">
        <img src={photos[active].url} alt="logement" />
        <span className={'detail-statut ' + statut}>
          {statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
        </span>
      </div>
      {photos.length > 1 && (
        <div className="galerie-miniatures">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p.url}
              alt={'vue ' + (i + 1)}
              className={active === i ? 'active' : ''}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoutonReservation({ logement, user }) {
  if (logement.statut !== 'disponible') {
    return (
      <div className="loue-badge">
        🔴 Ce logement est actuellement loué
      </div>
    );
  }
  if (!user) {
    return (
      <Link to="/login" className="btn btn-secondary btn-full-detail">
        🔐 Connectez-vous pour réserver
      </Link>
    );
  }
  return (
    <Link
      to={'/logements/' + logement.id + '/reserver'}
      className="btn btn-primary btn-full-detail"
    >
      📅 Réserver ce logement
    </Link>
  );
}

function Equipements({ logement }) {
  const items = [];

  if (logement.sanitaires_type) {
    const labels = {
      interne: 'Sanitaires internes',
      externe: 'Sanitaires externes',
      commun: 'Sanitaires communs',
      aucun: 'Sans sanitaires'
    };
    items.push('🚿 ' + (labels[logement.sanitaires_type] || ''));
  }

  if (logement.acces_eau) {
    const labels = {
      robinet_interieur: 'Robinet intérieur',
      robinet_exterieur: 'Robinet extérieur',
      puits: 'Puits',
      forage: 'Forage',
      public: 'Borne publique'
    };
    items.push('🚰 ' + (labels[logement.acces_eau] || ''));
  }

  if (logement.electricite) {
    const labels = {
      secteur: 'Secteur EDG',
      solaire: 'Solaire',
      groupe: 'Groupe électrogène',
      sans: 'Sans électricité'
    };
    items.push('⚡ ' + (labels[logement.electricite] || ''));
  }

  if (logement.type_toit) {
    const labels = { dalle: 'Dalle béton', tole: 'Tôle', chaume: 'Chaume', autre: 'Autre' };
    items.push('🏠 Toit : ' + (labels[logement.type_toit] || ''));
  }

  if (logement.type_sol) {
    const labels = { carreaux: 'Carreaux', ciment: 'Ciment', terre: 'Terre', autre: 'Autre' };
    items.push('🏗️ Sol : ' + (labels[logement.type_sol] || ''));
  }

  if (logement.parking) items.push('🚗 Parking');
  if (logement.jardin) items.push('🌿 Jardin / Cour');
  if (logement.climatisation) items.push('❄️ Climatisation');
  if (logement.gardien) items.push('👮 Gardien');

  return (
    <div className="detail-section">
      <h3>⚡ Équipements</h3>
      <div className="equipements-liste">
        {items.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function LogementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logements/' + id)
      .then(res => setLogement(res.data.logement))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>⏳ Chargement...</div>
      </div>
    );
  }

  if (!logement) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>❌ Logement non trouvé</div>
      </div>
    );
  }

  const cat = CATEGORIES[logement.categorie] || { icon: '🏠', label: 'Logement' };

  const photos = logement.photos
    ? (typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos)
    : [];

  const etatIcons = { neuf: '✨', bon_etat: '✅', a_renover: '🔧', en_construction: '🏗️', vetuste: '⚠️' };
  const etatLabels = { neuf: 'Neuf', bon_etat: 'Bon état', a_renover: 'À rénover', en_construction: 'En construction', vetuste: 'Vétuste' };
  const foncierLabels = {
    titre_foncier: '📜 Titre foncier',
    permis_habiter: "🏛️ Permis d'habiter",
    accord_coutumier: '🤝 Accord coutumier',
    sous_seing_prive: '✍️ Sous-seing privé'
  };

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/logements">← Retour aux logements</Link>
          </div>
          <div className="detail-grid">
            <div className="detail-gauche">
              <GaleriePhotos photos={photos} cat={cat} statut={logement.statut} />
              <div className="detail-card">
                <div className="detail-categorie-badge">{cat.icon} {cat.label}</div>
                <h1 className="detail-titre">{logement.titre}</h1>
                <p className="detail-adresse">📍 {logement.adresse}, {logement.ville}, Guinée</p>
                <div className="detail-caract">
                  {logement.nb_chambres > 0 && (
                    <div className="caract-item">
                      <span className="caract-icon">🛏</span>
                      <span>{logement.nb_chambres}</span>
                      <small>Chambre(s)</small>
                    </div>
                  )}
                  {logement.nb_salles_bain > 0 && (
                    <div className="caract-item">
                      <span className="caract-icon">🚿</span>
                      <span>{logement.nb_salles_bain}</span>
                      <small>Salle(s) de bain</small>
                    </div>
                  )}
                  {logement.superficie && (
                    <div className="caract-item">
                      <span className="caract-icon">📐</span>
                      <span>{logement.superficie}</span>
                      <small>m²</small>
                    </div>
                  )}
                  {logement.etat && (
                    <div className="caract-item">
                      <span className="caract-icon">
                        {getLabel(etatIcons, logement.etat, '✅')}
                      </span>
                      <small>{getLabel(etatLabels, logement.etat, '')}</small>
                    </div>
                  )}
                </div>
                {logement.description && (
                  <div className="detail-section">
                    <h3>📝 Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}
                <Equipements logement={logement} />
                {logement.statut_foncier && logement.statut_foncier !== 'non_precise' && (
                  <div className="detail-section">
                    <h3>📜 Statut foncier</h3>
                    <span className="statut-foncier-badge">
                      {getLabel(foncierLabels, logement.statut_foncier, '❓ Non précisé')}
                    </span>
                  </div>
                )}
                {logement.latitude && logement.longitude && (
                  <div className="detail-section">
                    <h3>🗺️ Localisation</h3>
                    <CarteLeaflet logements={[logement]} hauteur="300px" />
                    
                      href={'https://www.openstreetmap.org/?mlat=' + logement.latitude + '&mlon=' + logement.longitude + '&zoom=17'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'block', textAlign: 'center', marginTop: '10px', color: '#2E7D32', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
                    >
                      🗺️ Agrandir sur OpenStreetMap →
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="detail-droite">
              <div className="detail-sticky-card">
                <div className="detail-prix">
                  {Number(logement.prix_mensuel).toLocaleString()} GNF
                  <small>/mois</small>
                </div>
                <div className="proprio-box">
                  <div className="proprio-avatar">
                    {logement.proprietaire_prenom?.charAt(0)}
                    {logement.proprietaire_nom?.charAt(0)}
                  </div>
                  <div>
                    <strong>{logement.proprietaire_prenom} {logement.proprietaire_nom}</strong>
                    <p>📞 {logement.proprietaire_telephone || 'N/A'}</p>
                  </div>
                </div>
                <BoutonReservation logement={logement} user={user} />
                <button
                  className="btn-partager"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copié !');
                  }}
                >
                  🔗 Copier le lien
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogementDetail;