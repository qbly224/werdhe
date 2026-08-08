/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { BedDouble, Bath, Maximize2, ArrowRight, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MapView from '../components/MapView';
import SEO from '../components/SEO';

var GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

var CATEGORIES = ['appartement', 'villa', 'studio', 'chambre', 'duplex', 'bureau'];
var VILLES_GN  = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Boké', 'Faranah', 'N\'Zérékoré', 'Coyah', 'Dubréka', 'Fria', 'Télimélé'];
var EQUIPEMENTS_OPTS = ['Eau courante', 'Électricité', 'Climatisation', 'Gardiennage', 'Parking', 'Groupe électrogène', 'Cuisine équipée', 'Balcon', 'Piscine'];

export default function Logements() {
  var navigate = useNavigate();
  var [logements, setLogements]   = useState([]);
  var [loading, setLoading]       = useState(true);
  var [total, setTotal]           = useState(0);
  var [page, setPage]             = useState(1);
  var [showFiltres, setShowFiltres] = useState(false);
  var [vueMode, setVueMode] = useState('liste'); // 'liste' ou 'carte'

  // Filtres
  var [search, setSearch]         = useState('');
  var [ville, setVille]           = useState('');
  var [categorie, setCategorie]   = useState('');
  var [prixMin, setPrixMin]       = useState('');
  var [prixMax, setPrixMax]       = useState('');
  var [nbChambres, setNbChambres] = useState('');
  var [superficieMin, setSuperficieMin] = useState('');
  var [tri, setTri] = useState('recent');

  var nbFiltresActifs = [ville, categorie, prixMin, prixMax, nbChambres, superficieMin].filter(Boolean).length;

  var charger = useCallback(function() {
    setLoading(true);
    var params = new URLSearchParams();
    if (search)       params.append('search', search);
    if (ville)        params.append('ville', ville);
    if (categorie)    params.append('categorie', categorie);
    if (prixMin)      params.append('prix_min', prixMin);
    if (prixMax)      params.append('prix_max', prixMax);
    if (nbChambres)   params.append('nb_chambres', nbChambres);
    if (superficieMin) params.append('superficie_min', superficieMin);
    params.append('page', page);
    params.append('limit', 12);

    api.get('/logements?' + params.toString())
      .then(function(res) {
        setLogements(res.data.logements || []);
        setTotal(res.data.total || 0);
      })
      .catch(console.error)
      .finally(function() { setLoading(false); });
  }, [search, ville, categorie, prixMin, prixMax, nbChambres, superficieMin, page]);

  useEffect(function() {
    var timer = setTimeout(charger, 400);
    return function() { clearTimeout(timer); };
  }, [charger]);

  function reinitialiser() {
    setVille(''); setCategorie('');
    setPrixMin(''); setPrixMax('');
    setNbChambres(''); setSuperficieMin('');
    setPage(1);
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ background: 'rgba(247,248,247,0.96)', backdropFilter: 'blur(8px)', borderBottom: '0.5px solid rgba(27,107,58,0.1)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Connexion</Link>
          <Link to="/dashboard" style={{ padding: '7px 14px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Dashboard</Link>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22 0%, #1B6B3A 100%)', padding: '28px 24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
  <div style={{ maxWidth: 900, margin: '0 auto' }}>
    <h1 style={{ color: '#fff', fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, margin: '0 0 6px', letterSpacing: -0.5 }}>
      🏠 Logements disponibles en Guinée
    </h1>
    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
      {total} logement(s) trouvé(s) · Sans intermédiaire
    </p>
  </div>
</div>
      {/* Sélecteur de tri */}
<select value={tri} onChange={function(e) { setTri(e.target.value); }}
  style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', fontSize: 13, color: '#555', cursor: 'pointer', outline: 'none' }}>
  <option value="recent">Plus récent</option>
  <option value="prix_asc">Prix croissant</option>
  <option value="prix_desc">Prix décroissant</option>
</select>
      {/* Toggle vue liste / carte */}
<div style={{ display: 'flex', gap: 6, background: '#F0F0F0', borderRadius: 10, padding: 4 }}>
  <button
    onClick={function() { setVueMode('liste'); }}
    style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: vueMode === 'liste' ? '#1B6B3A' : 'transparent', color: vueMode === 'liste' ? '#fff' : '#888', fontSize: 13, fontWeight: vueMode === 'liste' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
    Liste
  </button>
  <button
    onClick={function() { setVueMode('carte'); }}
    style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: vueMode === 'carte' ? '#1B6B3A' : 'transparent', color: vueMode === 'carte' ? '#fff' : '#888', fontSize: 13, fontWeight: vueMode === 'carte' ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s' }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    Carte
  </button>
</div>

      {/* BARRE DE RECHERCHE */}
      <div style={{ background: '#fff', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 16 }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher : titre, quartier, adresse..."
              value={search}
              onChange={function(e) { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#F8F8F8' }} />
          </div>
          <button
            onClick={function() { setShowFiltres(!showFiltres); }}
            style={{ padding: '10px 16px', borderRadius: 10, border: nbFiltresActifs > 0 ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: nbFiltresActifs > 0 ? '#E8F5E9' : '#F8F8F8', color: nbFiltresActifs > 0 ? '#1B6B3A' : '#555', fontSize: 13, fontWeight: nbFiltresActifs > 0 ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            🎛️ Filtres {nbFiltresActifs > 0 && <span style={{ background: '#1B6B3A', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{nbFiltresActifs}</span>}
          </button>
        </div>

        {/* FILTRES RAPIDES — villes */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['Toutes', ...VILLES_GN.slice(0, 6)].map(function(v) {
            var actif = v === 'Toutes' ? !ville : ville === v;
            return (
              <button key={v} onClick={function() { setVille(v === 'Toutes' ? '' : v); setPage(1); }}
                style={{ padding: '5px 14px', borderRadius: 20, border: actif ? '1.5px solid #1B6B3A' : '0.5px solid #E0E0E0', background: actif ? '#1B6B3A' : '#fff', color: actif ? '#fff' : '#555', fontSize: 12, fontWeight: actif ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* PANNEAU FILTRES AVANCÉS */}
      {showFiltres && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '0.5px solid #F0F0F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowY: 'auto', maxHeight: '80vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>Filtres avancés</div>
            {nbFiltresActifs > 0 && (
              <button onClick={reinitialiser} style={{ background: 'none', border: 'none', color: '#E53935', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                Réinitialiser tout
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>

            {/* Ville */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Ville</div>
              <select value={ville} onChange={function(e) { setVille(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: ville ? '#E8F5E9' : '#FAFAFA' }}>
                <option value="">Toutes les villes</option>
                {VILLES_GN.map(function(v) { return <option key={v} value={v}>{v}</option>; })}
              </select>
            </div>

            {/* Catégorie */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Type</div>
              <select value={categorie} onChange={function(e) { setCategorie(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: categorie ? '#E8F5E9' : '#FAFAFA' }}>
                <option value="">Tous les types</option>
                {CATEGORIES.map(function(c) { return <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>; })}
              </select>
            </div>

            {/* Prix min */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Prix minimum (GNF)</div>
              <input type="number" placeholder="Ex: 500000" value={prixMin}
                onChange={function(e) { setPrixMin(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: prixMin ? '#E8F5E9' : '#FAFAFA' }} />
            </div>

            {/* Prix max */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Prix maximum (GNF)</div>
              <input type="number" placeholder="Ex: 2000000" value={prixMax}
                onChange={function(e) { setPrixMax(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: prixMax ? '#E8F5E9' : '#FAFAFA' }} />
            </div>

            {/* Chambres */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Chambres minimum</div>
              <select value={nbChambres} onChange={function(e) { setNbChambres(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', background: nbChambres ? '#E8F5E9' : '#FAFAFA' }}>
                <option value="">Peu importe</option>
                {[1,2,3,4,5].map(function(n) { return <option key={n} value={n}>{n}+</option>; })}
              </select>
            </div>

            {/* Superficie */}
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5, fontWeight: 600 }}>Superficie min (m²)</div>
              <input type="number" placeholder="Ex: 30" value={superficieMin}
                onChange={function(e) { setSuperficieMin(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: superficieMin ? '#E8F5E9' : '#FAFAFA' }} />
            </div>
          </div>

          {/* Fourchette prix visuelle */}
          {(prixMin || prixMax) && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#E8F5E9', borderRadius: 10, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
              💰 Fourchette : {prixMin ? GNF(prixMin) : '0'} — {prixMax ? GNF(prixMax) : 'illimité'}
            </div>
          )}
        </div>
      )}

      {/* LISTE DES LOGEMENTS */}
      <div style={{ padding: '16px', maxWidth: 900, margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            Recherche en cours...
          </div>
        )}

        {!loading && logements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏠</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>Aucun logement trouvé</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>Essayez avec d'autres critères</div>
            {nbFiltresActifs > 0 && (
              <button onClick={reinitialiser}
                style={{ padding: '10px 24px', background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {vueMode === 'carte' && (
          <div style={{ marginTop: 16 }}>
            <MapView
              logements={logements}
              onSelectLogement={function(l) { window.location.href = '/logements/' + l.id; }}
            />
          </div>
        )}
        {vueMode === 'liste' && (
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
  {logements
    .slice()
    .sort(function(a, b) {
      if (tri === 'prix_asc')  return Number(a.prix_mensuel) - Number(b.prix_mensuel);
      if (tri === 'prix_desc') return Number(b.prix_mensuel) - Number(a.prix_mensuel);
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .map(function(l) {
    var estNouveau = (new Date() - new Date(l.created_at)) < 7 * 24 * 60 * 60 * 1000;
            return (
              <div key={l.id}
                onClick={function() { navigate('/logements/' + l.id); }}
                style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={function(e) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}>

                {/* Photo / placeholder */}
                 <div style={{ height: 180, position: 'relative', background: '#E8F5E9', overflow: 'hidden',display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
                  {l.photos && l.photos.length > 0 ? (
  <img src={l.photos[0]} alt={l.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
) : (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B6B3A 0%, #2D9E5F 50%, #E8F5E9 100%)' }}>
    <span style={{ fontSize: 48, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>
      {l.categorie === 'villa' || l.categorie === 'villa_luxe' ? '🏡'
       : l.categorie === 'studio'           ? '🏢'
       : l.categorie === 'appartement'      ? '🏬'
       : l.categorie === 'bureau'           ? '🏪'
       : l.categorie === 'duplex'           ? '🏘️'
       : '🏠'}
    </span>
    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, marginTop: 8, textTransform: 'capitalize', letterSpacing: 0.5 }}>
      {l.categorie ? l.categorie.replace(/_/g, ' ') : 'Logement'}
    </div>
  </div>
)}
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '#1B6B3A', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                    Disponible
                  </div>
                  {estNouveau && (
  <div style={{ position: 'absolute', top: 10, left: 10, background: '#F5A623', color: '#1B2B22', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
    ✨ Nouveau
  </div>
)}
                  {l.categorie && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
                      {l.categorie}
                    </div>
                  )}
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 4 }}>{l.titre}</div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {l.adresse}, {l.ville}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1B6B3A', marginBottom: 10 }}>{GNF(l.prix_mensuel)}<span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>/mois</span></div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {l.nb_chambres && (
                      <span style={{ background: '#F5F5F5', color: '#555', padding: '3px 8px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <BedDouble size={11} strokeWidth={1.5} /> {l.nb_chambres} ch.
                      </span>
                    )}
                    {l.nb_salles_bain && (
                      <span style={{ background: '#F5F5F5', color: '#555', padding: '3px 8px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Bath size={11} strokeWidth={1.5} /> {l.nb_salles_bain} SdB
                      </span>
                    )}
                    {l.superficie && (
                      <span style={{ background: '#F5F5F5', color: '#555', padding: '3px 8px', borderRadius: 6, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Maximize2 size={11} strokeWidth={1.5} /> {l.superficie}m²
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={function(e) { e.stopPropagation(); navigate('/logements/' + l.id); }}
                      style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid #1B6B3A', background: 'transparent', color: '#1B6B3A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Voir
                    </button>
                    <button
                      onClick={function(e) { e.stopPropagation(); navigate('/logements/' + l.id + '/reserver'); }}
                      style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <ArrowRight size={13} strokeWidth={2.5} /> Candidater
                    </button>
                  </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
        {/* PAGINATION */}
        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button onClick={function() { setPage(function(p) { return Math.max(1, p - 1); }); }} disabled={page === 1}
              style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid #E0E0E0', background: page === 1 ? '#F5F5F5' : '#fff', color: page === 1 ? '#ccc' : '#555', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>
              ← Précédent
            </button>
            <div style={{ padding: '8px 16px', fontSize: 13, color: '#888', display: 'flex', alignItems: 'center' }}>
              Page {page} / {Math.ceil(total / 12)}
            </div>
            <button onClick={function() { setPage(function(p) { return p + 1; }); }} disabled={page >= Math.ceil(total / 12)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid #E0E0E0', background: page >= Math.ceil(total / 12) ? '#F5F5F5' : '#1B6B3A', color: page >= Math.ceil(total / 12) ? '#ccc' : '#fff', cursor: page >= Math.ceil(total / 12) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}