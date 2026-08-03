/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Home, MapPin, BedDouble, Maximize2, Award, ChevronLeft, Calendar, Building2 } from 'lucide-react';
import api from '../services/api';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n); };

export default function ProfilPublic() {
  var { id }      = useParams();
  var navigate    = useNavigate();
  var [data, setData]       = useState(null);
  var [loading, setLoading] = useState(true);
  var [erreur, setErreur]   = useState('');

  useEffect(function() {
    api.get('/auth/profil-public/' + id)
      .then(function(res) { setData(res.data); })
      .catch(function(err) {
        setErreur(err.response && err.response.data ? err.response.data.erreur : 'Profil non trouvé');
      })
      .finally(function() { setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#888', fontSize: 14 }}>Chargement du profil...</span>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (erreur) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={{ color: '#1B2B22', margin: 0 }}>Profil introuvable</h2>
        <p style={{ color: '#888' }}>{erreur}</p>
        <button onClick={function() { navigate(-1); }}
          style={{ padding: '10px 20px', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
          ← Retour
        </button>
      </div>
    );
  }

  var p = data.proprietaire;
  var initiales = p.nom.split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B6B3A, #134F2B)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center' }}>
        <button onClick={function() { navigate(-1); }}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={16} strokeWidth={2} /> Retour
        </button>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 16 }}>Profil propriétaire</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Carte profil */}
        <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          {/* Bannière verte */}
          <div style={{ height: 80, background: 'linear-gradient(135deg, #1B6B3A, #2D9E5F)' }} />

          <div style={{ padding: '0 24px 24px' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ marginTop: -36, width: 72, height: 72, background: '#1B2B22', borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
                {initiales}
              </div>
              {p.plan === 'pro' || p.plan === 'agence' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 20, padding: '5px 12px' }}>
                  <Award size={14} color="#1B6B3A" strokeWidth={2} />
                  <span style={{ fontSize: 12, color: '#1B5E20', fontWeight: 700 }}>Propriétaire vérifié</span>
                </div>
              ) : null}
            </div>

            {/* Nom + note */}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 8px' }}>{p.nom}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              {p.nb_notations > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(function(n) {
                      return <Star key={n} size={14} strokeWidth={1.5} fill={n <= Math.round(p.note_moyenne) ? '#F5A623' : 'transparent'} color="#F5A623" />;
                    })}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{Number(p.note_moyenne).toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: '#888' }}>({p.nb_notations} avis)</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: '#888' }}>Aucun avis pour le moment</span>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { icon: <Building2 size={18} strokeWidth={1.5} />, val: p.total_logements,     label: 'Logements'        },
                { icon: <Home      size={18} strokeWidth={1.5} />, val: p.locations_actives,   label: 'Locations actives' },
                { icon: <Calendar  size={18} strokeWidth={1.5} />, val: p.membre_depuis,        label: 'Membre depuis'     },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: '#F7F8F7', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ color: '#1B6B3A' }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1B2B22' }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logements du propriétaire */}
        {data.logements.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B22', margin: '0 0 14px' }}>
              Logements ({data.logements.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {data.logements.map(function(l) {
                return (
                  <Link key={l.id} to={'/logements/' + l.id}
                    style={{ textDecoration: 'none', display: 'block', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                    onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}>

                    {/* Photo */}
                    <div style={{ height: 150, background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {l.photos && l.photos.length > 0 ? (
                        <img src={l.photos[0]} alt={l.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Home size={40} strokeWidth={1} color="#A5D6A7" />
                      )}
                      <div style={{ position: 'absolute', top: 10, right: 10, background: l.statut === 'loue' ? '#1B2B22' : '#1B6B3A', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {l.statut === 'loue' ? 'Occupé' : 'Disponible'}
                      </div>
                    </div>

                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{l.titre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', marginBottom: 10 }}>
                        <MapPin size={12} strokeWidth={1.5} /> {l.ville}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1B6B3A' }}>
                        {GNF(l.prix_mensuel)} <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>GNF/mois</span>
                      </div>
                      {(l.nb_chambres || l.superficie) && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: '#888' }}>
                          {l.nb_chambres && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><BedDouble size={12} strokeWidth={1.5} /> {l.nb_chambres} ch.</span>}
                          {l.superficie && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Maximize2 size={12} strokeWidth={1.5} /> {l.superficie}m²</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Avis */}
        {data.notations.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2B22', margin: '0 0 14px' }}>
              Avis des locataires ({data.notations.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {data.notations.map(function(n, i) {
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {[1,2,3,4,5].map(function(s) {
                        return <Star key={s} size={13} strokeWidth={1.5} fill={s <= n.note ? '#F5A623' : 'transparent'} color="#F5A623" />;
                      })}
                    </div>
                    <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 14px', fontStyle: 'italic' }}>"{n.commentaire}"</p>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>
                      {n.auteur_prenom} {n.auteur_nom ? n.auteur_nom.charAt(0) + '.' : ''} · {new Date(n.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.notations.length === 0 && data.logements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <Home size={48} strokeWidth={1} color="#E0E0E0" />
            <p>Ce propriétaire n'a pas encore de logements publiés.</p>
          </div>
        )}
      </div>
    </div>
  );
}