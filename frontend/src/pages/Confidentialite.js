/* eslint-disable */
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronLeft, Shield, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getSections(t) {
  var n = [1,2,3,4,5,6,7,8,9,10,11,12];
  return n.map(function(i) {
    return { titre: t('confidentialite.sections.' + i + '.titre'), contenu: t('confidentialite.sections.' + i + '.contenu') };
  });
}

export default function Confidentialite() {
  var t = useTranslation('public').t;
  var SECTIONS = getSections(t);
  var navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre={t('confidentialite.seo.titre')}
        description={t('confidentialite.seo.description')}
        url="https://werdhe.com/confidentialite"
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={function() { navigate(-1); }}
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={16} strokeWidth={2} /> {t('confidentialite.retour')}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{t('confidentialite.documentsLegaux')}</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, background: '#E3F2FD', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} strokeWidth={1.5} color="#1565C0" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1B2B22', margin: 0 }}>
              {t('confidentialite.titre')}
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
              {t('confidentialite.derniereMiseAJour')}
            </p>
          </div>
        </div>

        {/* Intro */}
        <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#1565C0', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Lock size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} /> {t('confidentialite.intro')}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map(function(s, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: '#E3F2FD', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1565C0', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {s.titre.replace(/^\d+\.\s/, '')}
                </h2>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                  {s.contenu}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div style={{ background: '#1B2B22', borderRadius: 14, padding: '20px 24px', marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 12px' }}>
            {t('confidentialite.questionsContact')}
          </p>
          <a href="mailto:contact@werdhe.com"
            style={{ background: '#1565C0', color: '#fff', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            contact@werdhe.com
          </a>
        </div>
      </div>
    </div>
  );
}