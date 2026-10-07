import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Accueil.css';

export default function Accueil() {
  const { t } = useTranslation('public');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [essaiEnCours, setEssaiEnCours] = useState(null);

  function choisirPlan(plan) {
    if (!user) {
      navigate('/inscription?role=proprietaire&plan=' + plan);
      return;
    }
    setEssaiEnCours(plan);
    api.post('/abonnements/essai', { plan: plan })
      .then(function() {
        toast.success(t('accueil.essaiDemarre', { plan: plan === 'pro' ? 'Pro' : t('accueil.pricing.agence.type') }));
        navigate('/dashboard');
      })
      .catch(function() {
        navigate('/pricing');
      })
      .finally(function() { setEssaiEnCours(null); });
  }

  return (
    <div className="accueil-page">

      <nav className="accueil-nav">
        <div className="accueil-nav-logo">
          <div className="accueil-logo-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span>Werdhe</span>
        </div>
        <div className="accueil-nav-links">
          <Link to="/logements">{t('accueil.nav.logements')}</Link>
          <span>{t('accueil.nav.proprietaires')}</span>
          <span>{t('accueil.nav.locataires')}</span>
          <span>{t('accueil.nav.tarifs')}</span>
        </div>
        <div className="accueil-nav-actions">
          <LanguageSwitcher />
          {user ? (
            <Link to="/dashboard" className="accueil-btn-green">{t('accueil.nav.monEspace')}</Link>
          ) : (
            <>
              <Link to="/login" className="accueil-btn-outline">{t('accueil.nav.seConnecter')}</Link>
              <Link to="/register" className="accueil-btn-green">{t('accueil.nav.essaiGratuit')}</Link>
            </>
          )}
        </div>
      </nav>

      <div className="accueil-hero">
        <div className="accueil-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {t('accueil.hero.badge')}
        </div>

        <h1 className="accueil-hero-title">
          {t('accueil.hero.titrePrefixe')}{' '}
          <span className="accueil-green">{t('accueil.hero.proprietaires')}</span>{' '}
          {t('accueil.hero.et')}{' '}
          <span className="accueil-blue">{t('accueil.hero.locataires')}</span>
        </h1>

        <p className="accueil-hero-desc">
          {t('accueil.hero.desc')}
        </p>

        <div className="accueil-cta-double">
          <div className="accueil-cta-card">
            <div className="accueil-cta-label accueil-green">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {t('accueil.hero.jeSuisProprietaire')}
            </div>
            <p className="accueil-cta-desc">{t('accueil.hero.descProprietaire')}</p>
            <Link to="/register?role=proprietaire" className="accueil-btn-green accueil-btn-full">
              {t('accueil.hero.gererMesBiens')}
            </Link>
          </div>
          <div className="accueil-cta-card">
            <div className="accueil-cta-label accueil-blue">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {t('accueil.hero.jeChercheUnLogement')}
            </div>
            <p className="accueil-cta-desc">{t('accueil.hero.descLocataire')}</p>
            <Link to="/logements" className="accueil-btn-blue accueil-btn-full">
              {t('accueil.hero.trouverUnLogement')}
            </Link>
          </div>
        </div>

        <div className="accueil-checks">
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> {t('accueil.hero.checkGratuit')}</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> {t('accueil.hero.checkMobile')}</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> {t('accueil.hero.checkPaiements')}</span>
        </div>
      </div>

      <div className="accueil-stats">
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">500+</div>
          <div className="accueil-stat-lbl">{t('accueil.stats.proprietaires')}</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-blue">3 200+</div>
          <div className="accueil-stat-lbl">{t('accueil.stats.locatairesActifs')}</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">2 400+</div>
          <div className="accueil-stat-lbl">{t('accueil.stats.logementsPublies')}</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">8</div>
          <div className="accueil-stat-lbl">{t('accueil.stats.regionsCouvertes')}</div>
        </div>
      </div>

      <div className="accueil-fonctionnalites">
        <div className="accueil-section-header">
          <div className="accueil-badge">{t('accueil.features.badge')}</div>
          <h2>{t('accueil.features.titre')}</h2>
          <p>{t('accueil.features.desc')}</p>
        </div>

        <div className="accueil-tabs-wrapper">
          <div className="accueil-tab-panel">
            <div className="accueil-tab-label accueil-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {t('accueil.features.espaceProprietaire')}
            </div>
            <div className="accueil-features-list">
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.proprietaire.gestion.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.proprietaire.gestion.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.proprietaire.paiements.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.proprietaire.paiements.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.proprietaire.documents.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.proprietaire.documents.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.proprietaire.alertes.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.proprietaire.alertes.desc')}</div>
                </div>
              </div>
            </div>
            <Link to="/register?role=proprietaire" className="accueil-btn-green" style={{display:'inline-block',marginTop:'16px',textDecoration:'none'}}>
              {t('accueil.features.demarrerGratuitement')}
            </Link>
          </div>

          <div className="accueil-tab-panel">
            <div className="accueil-tab-label accueil-blue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {t('accueil.features.espaceLocataire')}
            </div>
            <div className="accueil-features-list">
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.locataire.recherche.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.locataire.recherche.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.locataire.reservation.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.locataire.reservation.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.locataire.historique.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.locataire.historique.desc')}</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">{t('accueil.features.locataire.gratuit.titre')}</div>
                  <div className="accueil-feature-desc">{t('accueil.features.locataire.gratuit.desc')}</div>
                </div>
              </div>
            </div>
            <Link to="/logements" className="accueil-btn-blue" style={{display:'inline-block',marginTop:'16px',textDecoration:'none'}}>
              {t('accueil.hero.trouverUnLogement')}
            </Link>
          </div>
        </div>
      </div>

      <div className="accueil-comment-ca-marche">
        <div className="accueil-section-header">
          <div className="accueil-badge">{t('accueil.howItWorks.badge')}</div>
          <h2>{t('accueil.howItWorks.titre')}</h2>
        </div>
        <div className="accueil-steps">
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-green">1</div>
            <div className="accueil-step-title">{t('accueil.howItWorks.step1.titre')}</div>
            <div className="accueil-step-desc">{t('accueil.howItWorks.step1.desc')}</div>
          </div>
          <div className="accueil-step-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-green">2</div>
            <div className="accueil-step-title">{t('accueil.howItWorks.step2.titre')}</div>
            <div className="accueil-step-desc">{t('accueil.howItWorks.step2.desc')}</div>
          </div>
          <div className="accueil-step-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-blue">3</div>
            <div className="accueil-step-title">{t('accueil.howItWorks.step3.titre')}</div>
            <div className="accueil-step-desc">{t('accueil.howItWorks.step3.desc')}</div>
          </div>
        </div>
      </div>

      <div className="accueil-pricing">
        <div className="accueil-section-header">
          <div className="accueil-badge">{t('accueil.pricing.badge')}</div>
          <h2>{t('accueil.pricing.titre')}</h2>
          <p>{t('accueil.pricing.sousTitre')}</p>
        </div>
        <div className="accueil-plans">
          <div className="accueil-plan">
            <div className="accueil-plan-type">{t('accueil.pricing.locataire.type')}</div>
            <div className="accueil-plan-price">0 <span>{t('accueil.pricing.parMois')}</span></div>
            <div className="accueil-plan-sub">{t('accueil.pricing.locataire.sousTitre')}</div>
            <Link to="/register?role=locataire" className="accueil-btn-outline accueil-btn-full" style={{textAlign:'center',display:'block'}}>{t('accueil.hero.trouverUnLogement')}</Link>
            <div className="accueil-plan-features">
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.locataire.features.0')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.locataire.features.1')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.locataire.features.2')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.locataire.features.3')}</div>
            </div>
          </div>

          <div className="accueil-plan accueil-plan-featured">
            <div className="accueil-plan-badge">{t('accueil.pricing.recommande')}</div>
            <div className="accueil-plan-type">{t('accueil.pricing.pro.type')}</div>
            <div className="accueil-plan-price">120 000 <span>{t('accueil.pricing.parMois')}</span></div>
            <div className="accueil-plan-sub">{t('accueil.pricing.pro.sousTitre')}</div>
            <button onClick={function() { choisirPlan('pro'); }} disabled={essaiEnCours === 'pro'}
              className="accueil-btn-green accueil-btn-full" style={{textAlign:'center',display:'block',cursor:essaiEnCours==='pro'?'not-allowed':'pointer'}}>
              {essaiEnCours === 'pro' ? t('accueil.pricing.demarrage') : t('accueil.pricing.essaiGratuit')}
            </button>
            <div className="accueil-plan-features">
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.pro.features.0')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.pro.features.1')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.pro.features.2')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.pro.features.3')}</div>
            </div>
          </div>

          <div className="accueil-plan">
            <div className="accueil-plan-type">{t('accueil.pricing.agence.type')}</div>
            <div className="accueil-plan-price">300 000 <span>{t('accueil.pricing.parMois')}</span></div>
            <div className="accueil-plan-sub">{t('accueil.pricing.agence.sousTitre')}</div>
            <button onClick={function() { choisirPlan('agence'); }} disabled={essaiEnCours === 'agence'}
              className="accueil-btn-outline accueil-btn-full" style={{textAlign:'center',display:'block',cursor:essaiEnCours==='agence'?'not-allowed':'pointer'}}>
              {essaiEnCours === 'agence' ? t('accueil.pricing.demarrage') : t('accueil.pricing.essaiGratuit')}
            </button>
            <div className="accueil-plan-features">
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.agence.features.0')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.agence.features.1')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.agence.features.2')}</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">{t('accueil.pricing.agence.features.3')}</div>
            </div>
          </div>
        </div>
        <div className="accueil-pricing-note">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
          {t('accueil.pricing.note')}
        </div>
      </div>

      <div className="accueil-cta-final">
        <h2>{t('accueil.ctaFinal.titre')}</h2>
        <p>{t('accueil.ctaFinal.sousTitre')}</p>
        <div className="accueil-cta-final-btns">
          <Link to="/register?role=proprietaire" className="accueil-btn-green">{t('accueil.hero.jeSuisProprietaire')}</Link>
          <Link to="/register?role=locataire" className="accueil-btn-blue">{t('accueil.hero.jeChercheUnLogement')}</Link>
        </div>
      </div>

      <footer className="accueil-footer">
        <div className="accueil-nav-logo" style={{color:'#333'}}>
          <div className="accueil-logo-icon" style={{width:'24px',height:'24px',borderRadius:'6px'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <span style={{fontSize:'13px',fontWeight:'500'}}>Werdhe</span>
        </div>
        <div style={{display:'flex',gap:'16px'}}>
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>{t('accueil.footer.confidentialite')}</span>
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>{t('accueil.footer.cgu')}</span>
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>{t('accueil.footer.contact')}</span>
        </div>
        <span style={{fontSize:'12px',color:'#aaa'}}>{t('accueil.footer.copyright')}</span>
      </footer>

    </div>
  );
}
