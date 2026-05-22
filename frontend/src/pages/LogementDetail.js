import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CarteGoogle from '../components/CarteGoogle';
import './LogementDetail.css';

const CATEGORIE_INFO = {
  villa_luxe:        { icon: '👑', label: 'Villa de luxe' },
  villa_standard:    { icon: '🏰', label: 'Villa standard' },
  maison_moderne:    { icon: '🏠', label: 'Maison moderne' },
  maison_banco:      { icon: '🛖', label: 'Maison traditionnelle' },
  maison_chantier:   { icon: '🏗️', label: 'Maison en construction' },
  concession:        { icon: '🏘️', label: 'Concession familiale' },
  appartement:       { icon: '🏢', label: 'Appartement' },
  duplex:            { icon: '🏬', label: 'Duplex' },
  logement_social:   { icon: '🏛️', label: 'Logement social' },
  studio_moderne:    { icon: '🏨', label: 'Studio moderne' },
  chambre_habitant:  { icon: '🛏️', label: 'Chambre chez l\'habitant' },
  chambre_cour:      { icon: '🚪', label: 'Chambre en cour commune' },
  habitat_precaire:  { icon: '🏚️', label: 'Habitat précaire' },
  boutique:          { icon: '🏪', label: 'Boutique' },
  bureau:            { icon: '💼', label: 'Bureau' },
  entrepot:          { icon: '🏭', label: 'Entrepôt' },
  local_commercial:  { icon: '🏬', label: 'Local commercial' },
  centre_commercial: { icon: '🛍️', label: 'Centre commercial' }
};

const LogementDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoActive, setPhotoActive] = useState(0);

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await api.get(`/logements/${id}`);
        setLogement(res.data.logement);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  if (loading) return (
    <div><Navbar /><div style={{textAlign:'center',padding:'100px'}}>⏳ Chargement...</div></div>
  );

  if (!logement) return (
    <div><Navbar /><div style={{textAlign:'center',padding:'100px'}}>❌ Logement non trouvé</div></div>
  );

  const cat = CATEGORIE_INFO[logement.categorie] || { icon: '🏠', label: 'Logement' };
  const photos = logement.photos
    ? (typeof logement.photos === 'string'
        ? JSON.parse(logement.photos) : logement.photos)
    : [];

  return (
    <div>
      <Navbar />
      <div className="detail-page">
        <div className="container">

          {/* Fil d'Ariane */}
          <div className="breadcrumb">
            <Link to="/logements">← Retour aux logements</Link>
          </div>

          <div className="detail-grid">

            {/* Colonne gauche */}
            <div className="detail-gauche">

              {/* Galerie photos */}
              <div className="galerie">
                {photos.length > 0 ? (
                  <>
                    <div className="galerie-principale">
                      <img
                        src={photos[photoActive].url}
                        alt="logement principal"
                      />
                      <span className={`detail-statut ${logement.statut}`}>
                        {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                      </span>
                    </div>
                    {photos.length > 1 && (
                      <div className="galerie-miniatures">
                        {photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo.url}
                            alt={`miniature ${i + 1}`}
                            className={photoActive === i ? 'active' : ''}
                            onClick={() => setPhotoActive(i)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="galerie-vide">
                    <span>{cat.icon}</span>
                    <span className={`detail-statut ${logement.statut}`}>
                      {logement.statut === 'disponible' ? '✅ Disponible' : '🔴 Loué'}
                    </span>
                  </div>
                )}
              </div>

              {/* Informations détaillées */}
              <div className="detail-card">
                <div className="detail-categorie-badge">
                  {cat.icon} {cat.label}
                </div>
                <h1 className="detail-titre">{logement.titre}</h1>
                <p className="detail-adresse">
                  📍 {logement.adresse}, {logement.ville}, Guinée
                </p>

                {/* Caractéristiques */}
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
                        {logement.etat === 'neuf' ? '✨'
                          : logement.etat === 'bon_etat' ? '✅'
                          : logement.etat === 'a_renover' ? '🔧'
                          : logement.etat === 'en_construction' ? '🏗️' : '⚠️'}
                      </span>
                      <small>
                        {logement.etat === 'neuf' ? 'Neuf'
                          : logement.etat === 'bon_etat' ? 'Bon état'
                          : logement.etat === 'a_renover' ? 'À rénover'
                          : logement.etat === 'en_construction' ? 'En construction'
                          : 'Vétuste'}
                      </small>
                    </div>
                  )}
                </div>

                {/* Description */}
                {logement.description && (
                  <div className="detail-section">
                    <h3>📝 Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}

                {/* Équipements */}
                <div className="detail-section">
                  <h3>⚡ Équipements</h3>
                  <div className="equipements-liste">
                    {logement.sanitaires_type && (
                      <span>🚿 Sanitaires : {
                        logement.sanitaires_type === 'interne' ? 'Internes'
                          : logement.sanitaires_type === 'externe' ? 'Externes'
                          : logement.sanitaires_type === 'commun' ? 'Communs'
                          : 'Aucun'
                      }</span>
                    )}
                    {logement.acces_eau && (
                      <span>🚰 Eau : {
                        logement.acces_eau === 'robinet_interieur' ? 'Robinet intérieur'
                          : logement.acces_eau === 'robinet_exterieur' ? 'Robinet extérieur'
                          : logement.acces_eau === 'puits' ? 'Puits'
                          : logement.acces_eau === 'forage' ? 'Forage'
                          : 'Borne publique'
                      }</span>
                    )}
                    {logement.electricite && (
                      <span>⚡ Électricité : {
                        logement.electricite === 'secteur' ? 'Secteur (EDG)'
                          : logement.electricite === 'solaire' ? 'Solaire'
                          : logement.electricite === 'groupe' ? 'Groupe électrogène'
                          : 'Sans électricité'
                      }</span>
                    )}
                    {logement.type_toit && (
                      <span>🏠 Toit : {
                        logement.type_toit === 'dalle' ? 'Dalle béton'
                          : logement.type_toit === 'tole' ? 'Tôle'
                          : logement.type_toit === 'chaume' ? 'Chaume'
                          : 'Autre'
                      }</span>
                    )}
                    {logement.type_sol && (
                      <span>🏗️ Sol : {
                        logement.type_sol === 'carreaux' ? 'Carreaux'
                          : logement.type_sol === 'ciment' ? 'Ciment'
                          : logement.type_sol === 'terre' ? 'Terre'
                          : 'Autre'
                      }</span>
                    )}
                    {logement.parking && <span>🚗 Parking</span>}
                    {logement.jardin && <span>🌿 Jardin/Cour</span>}
                    {logement.climatisation && <span>❄️ Climatisation</span>}
                    {logement.gardien && <span>👮 Gardien</span>}
                  </div>
                </div>

                {/* Statut foncier */}
                {logement.statut_foncier && logement.statut_foncier !== 'non_precise' && (
                  <div className="detail-section">
                    <h3>📜 Statut foncier</h3>
                    <span className="statut-foncier-badge">
                      {logement.statut_foncier === 'titre_foncier' ? '📜 Titre foncier'
                        : logement.statut_foncier === 'permis_habiter' ? '🏛️ Permis d\'habiter'
                        : logement.statut_foncier === 'accord_coutumier' ? '🤝 Accord coutumier'
                        : '✍️ Sous-seing privé'}
                    </span>
                  </div>
                )}

                {/* Carte Google Maps */}
                <div className="detail-section">
                  <h3>🗺️ Localisation</h3>
                  <CarteGoogle logement={logement} />
                </div>

              </div>
            </div>

            {/* Colonne droite — Sticky */}
            <div className="detail-droite">
              <div className="detail-sticky-card">

                <div className="detail-prix">
                  {Number(logement.prix_mensuel).toLocaleString()} GNF
                  <small>/mois</small>
                </div>

                {/* Propriétaire */}
                <div className="proprio-box">
                  <div className="proprio-avatar">
                    {logement.proprietaire_prenom?.charAt(0)}
                    {logement.proprietaire_nom?.charAt(0)}
                  </div>
                  <div>
                    <strong>
                      {logement.proprietaire_prenom} {logement.proprietaire_nom}
                    </strong>
                    <p>📞 {logement.proprietaire_telephone || 'N/A'}</p>
                  </div>
                </div>

                {logement.statut === 'disponible' ? (
                  user ? (
                    <Link
                      to={`/logements/${logement.id}/reserver`}
                      className="btn btn-primary btn-full-detail"
                    >
                      📅 Réserver ce logement
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="btn btn-secondary btn-full-detail"
                    >
                      🔐 Connectez-vous pour réserver
                    </Link>
                  )
                ) : (
                  <div className="loue-badge">🔴 Ce logement est actuellement loué</div>
                )}

                {/* Partager */}
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
};

export default LogementDetail;