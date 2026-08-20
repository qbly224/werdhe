/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ChevronLeft, ChevronRight, MapPin, BedDouble, Bath, Maximize2,
  Zap, Droplets, Wind, Shield, Car, Trees, ArrowRight,
  Copy, Check, Phone, Star, Home, Share2
} from 'lucide-react';
import Logo from '../components/Logo';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(Number(n)); };

var EQUIPEMENTS_CONFIG = [
  { key: 'electricite',    vals: ['secteur'],  icon: <Zap size={16} strokeWidth={1.5} />,     label: 'Électricité secteur' },
  { key: 'electricite',    vals: ['solaire'],  icon: <Zap size={16} strokeWidth={1.5} />,     label: 'Panneau solaire'     },
  { key: 'acces_eau',      vals: [true, 'oui'], icon: <Droplets size={16} strokeWidth={1.5} />, label: 'Eau courante'       },
  { key: 'climatisation',  vals: [true],       icon: <Wind size={16} strokeWidth={1.5} />,    label: 'Climatisation'       },
  { key: 'gardien',        vals: [true],       icon: <Shield size={16} strokeWidth={1.5} />,  label: 'Gardiennage'         },
  { key: 'parking',        vals: [true],       icon: <Car size={16} strokeWidth={1.5} />,     label: 'Parking'             },
  { key: 'jardin',         vals: [true],       icon: <Trees size={16} strokeWidth={1.5} />,   label: 'Jardin'              },
];

export default function LogementDetail() {
  var { id }       = useParams();
  var { user }     = useAuth();
  var navigate     = useNavigate();
  var [logement, setLogement]     = useState(null);
  var [similaires, setSimilaires] = useState([]);
  var [loading, setLoading]       = useState(true);
  var [photoActive, setPhotoActive] = useState(0);
  var [copie, setCopie]           = useState(false);
  var [scoreData, setScoreData]   = useState(null);

  useEffect(function() {
    api.get('/logements/' + id)
      .then(function(res) {
        var l = res.data.logement;
        setLogement(l);
        // Charger similaires
        api.get('/logements?ville=' + (l.ville || '') + '&limit=4')
          .then(function(r) {
            setSimilaires((r.data.logements || []).filter(function(x) { return x.id !== l.id; }).slice(0, 3));
          })
          .catch(console.error);
        // Score proprio
        if (l.proprietaire_id) {
          api.get('/auth/score/' + l.proprietaire_id)
            .then(function(r) { setScoreData(r.data); })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!logement) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', fontFamily: 'system-ui' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
        <h2>Logement introuvable</h2>
        <Link to="/logements" style={{ color: '#1B6B3A' }}>← Retour aux logements</Link>
      </div>
    );
  }

  var photos = [];
  if (logement.photos) {
    photos = typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos;
    photos = photos.map(function(p) { return typeof p === 'string' ? p : (p.url || p); });
  }

  var propPrenom = logement.proprietaire_prenom || logement.prop_prenom || '';
  var propNom    = logement.proprietaire_nom    || logement.prop_nom    || '';
  var propTel    = logement.proprietaire_telephone || logement.prop_telephone || '';
  var propId     = logement.proprietaire_id || '';

  var equipements = EQUIPEMENTS_CONFIG.filter(function(e) {
    return e.vals.some(function(v) { return logement[e.key] === v || logement[e.key] === true; });
  });

  function copierLien() {
    navigator.clipboard.writeText(window.location.href);
    setCopie(true);
    setTimeout(function() { setCopie(false); }, 2000);
  }

  function prevPhoto() { setPhotoActive(function(i) { return i > 0 ? i - 1 : photos.length - 1; }); }
  function nextPhoto() { setPhotoActive(function(i) { return i < photos.length - 1 ? i + 1 : 0; }); }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre={logement.titre + ' à ' + logement.ville}
        description={logement.titre + ' à ' + logement.ville + '. ' + GNF(logement.prix_mensuel) + ' GNF/mois. Candidatez directement sur Werdhe.'}
        image={photos[0]}
        url={'https://werdhe.com/logements/' + logement.id}
        type="article"
      />

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Logo size={32} showText={true} darkBg={false} />
        </Link>
        <button onClick={function() { navigate(-1); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #E0E0E0', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#555', cursor: 'pointer' }}>
          <ChevronLeft size={16} strokeWidth={2} /> Retour
        </button>
      </nav>

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 16px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ─── COLONNE GAUCHE ───────────────────────────────── */}
          <div>
            {/* Galerie photos */}
            <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 20, position: 'relative', background: '#1B2B22' }}>
              {photos.length === 0 ? (
                <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B6B3A, #2D9E5F)', fontSize: 64 }}>🏠</div>
              ) : (
                <div style={{ position: 'relative', height: 380 }}>
                  <img src={photos[photoActive]} alt={logement.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                  {/* Overlay gradient */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5))' }} />

                  {/* Badge statut */}
                  <div style={{ position: 'absolute', top: 14, right: 14, background: logement.statut === 'disponible' ? '#1B6B3A' : '#888', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                    {logement.statut === 'disponible' ? '✅ Disponible' : 'Occupé'}
                  </div>

                  {/* Compteur photos */}
                  <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                    {photoActive + 1} / {photos.length}
                  </div>

                  {/* Navigation */}
                  {photos.length > 1 && (
                    <>
                      <button onClick={prevPhoto}
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} strokeWidth={2} color="#1B2B22" />
                      </button>
                      <button onClick={nextPhoto}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={20} strokeWidth={2} color="#1B2B22" />
                      </button>
                    </>
                  )}

                  {/* Titre superposé */}
                  <div style={{ position: 'absolute', bottom: 16, left: 18 }}>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{logement.titre}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} strokeWidth={1.5} /> {logement.adresse}, {logement.ville}
                    </div>
                  </div>
                </div>
              )}

              {/* Miniatures */}
              {photos.length > 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '10px 12px', background: '#1B2B22', overflowX: 'auto' }}>
                  {photos.map(function(p, i) {
                    return (
                      <img key={i} src={p} alt="" onClick={function() { setPhotoActive(i); }}
                        style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: photoActive === i ? '2px solid #F5A623' : '2px solid transparent', opacity: photoActive === i ? 1 : 0.6, transition: 'all .2s', flexShrink: 0 }} />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Caractéristiques */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 16px', letterSpacing: -0.5 }}>Caractéristiques</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {logement.nb_chambres && (
                  <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <BedDouble size={24} strokeWidth={1.5} color="#1B6B3A" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22' }}>{logement.nb_chambres}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Chambre(s)</div>
                  </div>
                )}
                {logement.nb_salles_bain && (
                  <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <Bath size={24} strokeWidth={1.5} color="#1565C0" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22' }}>{logement.nb_salles_bain}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Salle(s) de bain</div>
                  </div>
                )}
                {logement.superficie && (
                  <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <Maximize2 size={24} strokeWidth={1.5} color="#7B1FA2" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22' }}>{logement.superficie}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>m²</div>
                  </div>
                )}
                {logement.categorie && (
                  <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <Home size={24} strokeWidth={1.5} color="#E65100" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', textTransform: 'capitalize' }}>{logement.categorie.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>Type</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {logement.description && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 12px' }}>Description</h2>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 }}>{logement.description}</p>
              </div>
            )}

            {/* Équipements */}
            {equipements.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 14px' }}>Équipements</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                  {equipements.map(function(e, i) {
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F0FBF0', borderRadius: 10, border: '0.5px solid #A5D6A7' }}>
                        <div style={{ color: '#1B6B3A', flexShrink: 0 }}>{e.icon}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1B5E20' }}>{e.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logements similaires */}
            {similaires.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: 0 }}>Logements similaires à {logement.ville}</h2>
                  <Link to={'/logements?ville=' + logement.ville} style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {similaires.map(function(s) {
                    var sPhotos = s.photos ? (typeof s.photos === 'string' ? JSON.parse(s.photos) : s.photos) : [];
                    var sPhoto  = sPhotos.length > 0 ? (typeof sPhotos[0] === 'string' ? sPhotos[0] : sPhotos[0].url) : null;
                    return (
                      <Link key={s.id} to={'/logements/' + s.id}
                        style={{ textDecoration: 'none', background: '#F7F8F7', borderRadius: 12, overflow: 'hidden', display: 'block', transition: 'all .2s' }}
                        onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ height: 110, background: sPhoto ? 'none' : '#E8F5E9', overflow: 'hidden' }}>
                          {sPhoto
                            ? <img src={sPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏠</div>
                          }
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 4 }}>{s.titre}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1B6B3A' }}>{GNF(s.prix_mensuel)} <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>GNF/mois</span></div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ─── COLONNE DROITE (sticky) ─────────────────────── */}
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={{ background: '#fff', borderRadius: 18, padding: '22px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 14 }}>

              {/* Prix */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#1B6B3A', letterSpacing: -1 }}>
                  {GNF(logement.prix_mensuel)}
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#888', marginLeft: 4 }}>GNF/mois</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Loyer mensuel · Caution = 1 mois</div>
              </div>

              {/* Propriétaire */}
              <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Propriétaire</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {propPrenom.charAt(0)}{propNom.charAt(0)}
                  </div>
                  <div>
                    <Link to={'/proprietaire/' + propId}
                      style={{ color: '#1B6B3A', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                      {propPrenom} {propNom} →
                    </Link>
                    {propTel && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{propTel}</div>
                    )}
                  </div>
                </div>

                {/* Score proprio */}
                {scoreData && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: scoreData.bg, borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 13 }}>{scoreData.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreData.couleur }}>{scoreData.label}</span>
                    <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{scoreData.score}/100</span>
                  </div>
                )}

                {propTel && (
                  <a href={'tel:' + propTel}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, padding: '9px', borderRadius: 10, background: '#E8F5E9', color: '#1B5E20', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                    <Phone size={14} strokeWidth={2} /> Appeler
                  </a>
                )}
              </div>

              {/* Bouton candidater */}
              {logement.statut === 'disponible' && user && (
                <Link to={'/logements/' + logement.id + '/reserver'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', marginBottom: 10, boxSizing: 'border-box' }}>
                  Candidater <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              )}
              {logement.statut === 'disponible' && !user && (
                <Link to={'/login?redirect=/logements/' + logement.id + '/reserver'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginBottom: 10, boxSizing: 'border-box' }}>
                  Se connecter pour postuler
                </Link>
              )}
              {logement.statut !== 'disponible' && (
                <div style={{ background: '#F5F5F5', color: '#888', borderRadius: 12, padding: '14px', textAlign: 'center', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                  Logement actuellement occupé
                </div>
              )}

              {/* Copier lien */}
              <button onClick={copierLien}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {copie ? <><Check size={14} strokeWidth={2.5} color="#1B6B3A" /> Lien copié !</> : <><Copy size={14} strokeWidth={1.5} /> Partager ce logement</>}
              </button>
            </div>

            {/* Infos rapides */}
            <div style={{ background: '#1B2B22', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sur Werdhe</div>
              {[
                'Aucun frais d\'agence',
                'Bail électronique sécurisé',
                'Dossier en ligne simplifié',
                'Messagerie directe',
              ].map(function(item, i) {
                return <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>{item}</div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}