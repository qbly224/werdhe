/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import { Home, Calendar, Eye, ArrowRight, Search } from 'lucide-react';

export default function Blog() {
  var [params, setParams] = useSearchParams();
  var [articles, setArticles] = useState([]);
  var [categories, setCategories] = useState([]);
  var [loading, setLoading] = useState(true);
  var [recherche, setRecherche] = useState('');
  var categorieActive = params.get('categorie') || '';
  var page = parseInt(params.get('page')) || 1;
  var [total, setTotal] = useState(0);

  useEffect(function() {
    api.get('/blog/categories').then(function(res) { setCategories(res.data.categories || []); }).catch(function() {});
  }, []);

  useEffect(function() {
    setLoading(true);
    var query = '?page=' + page + (categorieActive ? '&categorie=' + encodeURIComponent(categorieActive) : '') + (recherche ? '&recherche=' + encodeURIComponent(recherche) : '');
    api.get('/blog' + query)
      .then(function(res) {
        setArticles(res.data.articles || []);
        setTotal(res.data.total || 0);
      })
      .catch(function() { setArticles([]); })
      .finally(function() { setLoading(false); });
  }, [categorieActive, page, recherche]);

  function changerCategorie(cat) {
    var next = new URLSearchParams();
    if (cat) next.set('categorie', cat);
    setParams(next);
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Blog — Guides et actualités immobilières en Guinée"
        description="Conseils pour louer, prix des loyers par quartier, documents à fournir : le blog Werdhe sur l'immobilier en Guinée."
        url="https://werdhe.com/blog"
      />

      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/logements" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Voir les logements</Link>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 56px) 24px 32px' }}>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
          Le blog Werdhe
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 auto 24px', maxWidth: 480 }}>
          Guides pratiques, prix des loyers et conseils pour louer ou gérer un bien en Guinée
        </p>

        <div style={{ maxWidth: 420, margin: '0 auto', position: 'relative' }}>
          <Search size={16} color="#aaa" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Rechercher un article..." value={recherche}
            onChange={function(e) { setRecherche(e.target.value); }}
            style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 12, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
        </div>
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', padding: '0 20px 32px' }}>
          <button onClick={function() { changerCategorie(''); }}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: !categorieActive ? '#1B6B3A' : '#fff', color: !categorieActive ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            Tous
          </button>
          {categories.map(function(c) {
            var actif = categorieActive === c.categorie;
            return (
              <button key={c.categorie} onClick={function() { changerCategorie(c.categorie); }}
                style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: actif ? '#1B6B3A' : '#fff', color: actif ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {c.categorie} ({c.nb})
              </button>
            );
          })}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 64px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Chargement...</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Aucun article pour le moment.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {articles.map(function(a) {
              return (
                <Link key={a.id} to={'/blog/' + a.slug} style={{ textDecoration: 'none', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 160, background: a.image_couverture ? 'url(' + a.image_couverture + ') center/cover' : 'linear-gradient(135deg, #1B6B3A, #1B2B22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!a.image_couverture && <Home size={36} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />}
                  </div>
                  <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {a.categorie && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#1B6B3A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{a.categorie}</span>
                    )}
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1B2B22', margin: '0 0 8px', lineHeight: 1.35 }}>{a.titre}</h3>
                    <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px', lineHeight: 1.6, flex: 1 }}>{a.extrait}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} strokeWidth={1.5} />
                        {a.published_at ? new Date(a.published_at).toLocaleDateString('fr-FR') : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} strokeWidth={1.5} /> {a.vues}</span>
                        <ArrowRight size={14} strokeWidth={2} color="#1B6B3A" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © 2026 Werdhe · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>CGU</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Confidentialité</a>
        </p>
      </div>
    </div>
  );
}
