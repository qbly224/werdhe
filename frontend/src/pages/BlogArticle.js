/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import { Home, Calendar, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BlogArticle() {
  var t = useTranslation('admin').t;
  var { slug } = useParams();
  var navigate = useNavigate();
  var [article, setArticle] = useState(null);
  var [similaires, setSimilaires] = useState([]);
  var [loading, setLoading] = useState(true);
  var [erreur, setErreur] = useState(false);

  useEffect(function() {
    setLoading(true);
    setErreur(false);
    window.scrollTo(0, 0);
    api.get('/blog/' + slug)
      .then(function(res) {
        setArticle(res.data.article);
        setSimilaires(res.data.similaires || []);
      })
      .catch(function() { setErreur(true); })
      .finally(function() { setLoading(false); });
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui' }}>{t('blogArticle.chargement')}</div>;
  }

  if (erreur || !article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', gap: 16 }}>
        <p style={{ color: '#888' }}>{t('blogArticle.introuvable')}</p>
        <Link to="/blog" style={{ color: '#1B6B3A', fontWeight: 700, textDecoration: 'none' }}>{t('blogArticle.retourBlog')}</Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre={article.titre}
        description={article.meta_description || article.extrait}
        image={article.image_couverture}
        url={'https://werdhe.com/blog/' + article.slug}
        type="article"
      />

      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <button onClick={function() { navigate('/blog'); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1B6B3A', color: '#1B6B3A', background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} strokeWidth={2} /> {t('blogArticle.blog')}
        </button>
      </nav>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 6vw, 56px) 20px 64px' }}>
        {article.categorie && (
          <span style={{ display: 'inline-block', background: '#E8F5E9', color: '#1B6B3A', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            {article.categorie}
          </span>
        )}
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 16px', lineHeight: 1.25, letterSpacing: -0.5 }}>
          {article.titre}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#888', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #E8E8E8' }}>
          <span>{article.auteur_nom || t('blogArticle.equipeWerdhe')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={13} strokeWidth={1.5} />
            {article.published_at ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} strokeWidth={1.5} /> {t('blogArticle.vues', { count: article.vues })}</span>
        </div>

        {article.image_couverture && (
          <img src={article.image_couverture} alt={article.titre} style={{ width: '100%', borderRadius: 16, marginBottom: 28, display: 'block' }} />
        )}

        <div
          style={{ fontSize: 16, color: '#333', lineHeight: 1.8 }}
          className="blog-contenu"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        <div style={{ marginTop: 48, padding: 24, background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', borderRadius: 16, textAlign: 'center' }}>
          <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{t('blogArticle.ctaTitre')}</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '0 0 18px' }}>{t('blogArticle.ctaTexte')}</p>
          <Link to="/logements" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#F5A623', color: '#1B2B22', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
            {t('blogArticle.voirLogements')} <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>

        {similaires.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', marginBottom: 16 }}>{t('blogArticle.aLireAussi')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {similaires.map(function(s) {
                return (
                  <Link key={s.id} to={'/blog/' + s.slug} style={{ textDecoration: 'none', background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 6, lineHeight: 1.4 }}>{s.titre}</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{s.extrait}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>

      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          {t('footer.copyright')} · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{t('footer.cgu')}</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{t('footer.confidentialite')}</a>
        </p>
      </div>

      <style>{`
        .blog-contenu h2 { font-size: 22px; font-weight: 800; color: #1B2B22; margin: 32px 0 14px; letter-spacing: -0.3px; }
        .blog-contenu h3 { font-size: 17px; font-weight: 700; color: #1B2B22; margin: 24px 0 10px; }
        .blog-contenu p { margin: 0 0 16px; }
        .blog-contenu ul { margin: 0 0 16px; padding-left: 22px; }
        .blog-contenu li { margin-bottom: 8px; }
        .blog-contenu a { color: #1B6B3A; font-weight: 600; }
      `}</style>
    </div>
  );
}
