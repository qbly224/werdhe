import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import './LogementDetail.css';

export default function LogementDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoActive, setPhotoActive] = useState(0);

  useEffect(() => {
    api.get('/logements/' + id)
      .then(function(res) { setLogement(res.data.logement); })
      .catch(function(err) { console.error(err); })
      .finally(function() { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <p style={{textAlign:'center',padding:'100px'}}>Chargement...</p>
      </div>
    );
  }

  if (!logement) {
    return (
      <div>
        <Navbar />
        <p style={{textAlign:'center',padding:'100px'}}>Logement non trouve</p>
      </div>
    );
  }

  var photos = [];
  if (logement.photos) {
    photos = typeof logement.photos === 'string'
      ? JSON.parse(logement.photos)
      : logement.photos;
  }

  var prix = Number(logement.prix_mensuel).toLocaleString();
  var propPrenom = logement.proprietaire_prenom || '';
  var propNom = logement.proprietaire_nom || '';
  var propTel = logement.proprietaire_telephone || 'N/A';

  return (
    <div>
      <SEO
        titre={logement ? logement.titre + ' à ' + logement.ville : 'Logement disponible'}
        description={logement ? logement.titre + ' à ' + logement.ville + ', Guinée. ' + new Intl.NumberFormat('fr-FR').format(logement.prix_mensuel) + ' GNF/mois. Candidatez sur Werdhe.' : ''}
        image={logement && logement.photos && logement.photos[0] ? logement.photos[0] : undefined}
        url={'https://werdhe.com/logements/' + (logement ? logement.id : '')}
        type="article"
      />
      {logement && (
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          "name": logement.titre,
          "description": logement.description || logement.titre + ' à ' + logement.ville,
          "url": 'https://werdhe.com/logements/' + logement.id,
          "image": logement.photos && logement.photos[0] ? logement.photos[0] : undefined,
          "offers": {
            "@type": "Offer",
            "price": logement.prix_mensuel,
            "priceCurrency": "GNF",
            "availability": logement.statut === 'disponible' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          },
          "address": {
            "@type": "PostalAddress",
            "addressLocality": logement.ville,
            "addressCountry": "GN"
          }
        })}</script>
      )}
      <Navbar />
      <div className="detail-page">
        <div className="container">

          <div className="breadcrumb">
            <Link to="/logements">Retour aux logements</Link>
          </div>

          <div className="detail-grid">

            <div className="detail-gauche">
              <div className="galerie">
                {photos.length === 0 && (
                  <div className="galerie-vide">
                    <span>🏠</span>
                  </div>
                )}
                {photos.length >= 1 && (
                  <div className="galerie-principale">
                    <img src={photos[photoActive].url} alt="logement" />
                    <span className={'detail-statut ' + logement.statut}>
                      {logement.statut === 'disponible' ? 'Disponible' : 'Loue'}
                    </span>
                  </div>
                )}
                {photos.length >= 2 && (
                  <div className="galerie-miniatures">
                    {photos.map(function(p, i) {
                      return (
                        <img
                          key={i}
                          src={p.url}
                          alt={'photo' + i}
                          className={photoActive === i ? 'active' : ''}
                          onClick={function() { setPhotoActive(i); }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="detail-card">
                <h1 className="detail-titre">{logement.titre}</h1>
                <p className="detail-adresse">
                  {logement.adresse}, {logement.ville}, Guinee
                </p>

                <div className="detail-caract">
                  {logement.nb_chambres >= 1 && (
                    <div className="caract-item">
                      <span>🛏</span>
                      <span>{logement.nb_chambres}</span>
                      <small>Chambres</small>
                    </div>
                  )}
                  {logement.nb_salles_bain >= 1 && (
                    <div className="caract-item">
                      <span>🚿</span>
                      <span>{logement.nb_salles_bain}</span>
                      <small>Salles de bain</small>
                    </div>
                  )}
                  {logement.superficie && (
                    <div className="caract-item">
                      <span>📐</span>
                      <span>{logement.superficie}</span>
                      <small>m2</small>
                    </div>
                  )}
                </div>

                {logement.description && (
                  <div className="detail-section">
                    <h3>Description</h3>
                    <p>{logement.description}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h3>Equipements</h3>
                  <div className="equipements-liste">
                    {logement.parking && <span>Parking</span>}
                    {logement.jardin && <span>Jardin</span>}
                    {logement.climatisation && <span>Climatisation</span>}
                    {logement.gardien && <span>Gardien</span>}
                    {logement.electricite === 'secteur' && <span>Electricite secteur</span>}
                    {logement.electricite === 'solaire' && <span>Panneau solaire</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-droite">
              <div className="detail-sticky-card">

                <div className="detail-prix">
                  {prix} GNF
                  <small>/mois</small>
                </div>
                
                <div className="proprio-box">
                 <div className="proprio-avatar">
                  {propPrenom.charAt(0)}{propNom.charAt(0)}
                 </div>
                 <div>
                  <Link
                    to={'/proprietaire/' + (logement.proprietaire_id || '')}
                    style={{ color: '#1B6B3A', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                    {propPrenom} {propNom} →
                    </Link>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>{propTel}</p>
                  </div>
                </div>

                {logement.statut === 'disponible' && user && (
                  <Link
                    to={'/logements/' + logement.id + '/reserver'}
                    className="btn btn-primary btn-full-detail"
                  >
                    Candidater →
                  </Link>
                )}
                {logement.statut === 'disponible' && !user && (
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-full-detail"
                  >
                    Connectez-vous pour postuler
                  </Link>
                )}
                {logement.statut !== 'disponible' && (
                  <div className="loue-badge">
                    Logement actuellement loue
                  </div>
                )}

                <button
                  className="btn-partager"
                  onClick={function() {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copie !');
                  }}
                >
                  Copier le lien
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}