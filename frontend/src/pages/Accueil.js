import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Accueil.css';

export default function Accueil() {
  const { user } = useAuth();

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
          <Link to="/logements">Logements</Link>
          <span>Proprietaires</span>
          <span>Locataires</span>
          <span>Tarifs</span>
        </div>
        <div className="accueil-nav-actions">
          {user ? (
            <Link to="/dashboard" className="accueil-btn-green">Mon espace</Link>
          ) : (
            <>
              <Link to="/login" className="accueil-btn-outline">Se connecter</Link>
              <Link to="/register" className="accueil-btn-green">Essai gratuit</Link>
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
          Plateforme N1 de l'immobilier locatif en Guinee
        </div>

        <h1 className="accueil-hero-title">
          La plateforme qui connecte{' '}
          <span className="accueil-green">proprietaires</span>{' '}
          et{' '}
          <span className="accueil-blue">locataires</span>
        </h1>

        <p className="accueil-hero-desc">
          Gerez vos biens ou trouvez votre logement ideal. Paiement en especes, Orange Money ou MTN MoMo.
        </p>

        <div className="accueil-cta-double">
          <div className="accueil-cta-card">
            <div className="accueil-cta-label accueil-green">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Je suis proprietaire
            </div>
            <p className="accueil-cta-desc">Gerez biens, loyers, locataires et documents en toute simplicite.</p>
            <Link to="/register?role=proprietaire" className="accueil-btn-green accueil-btn-full">
              Gerer mes biens
            </Link>
          </div>
          <div className="accueil-cta-card">
            <div className="accueil-cta-label accueil-blue">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Je cherche un logement
            </div>
            <p className="accueil-cta-desc">Recherchez, reservez et communiquez avec les proprietaires.</p>
            <Link to="/logements" className="accueil-btn-blue accueil-btn-full">
              Trouver un logement
            </Link>
          </div>
        </div>

        <div className="accueil-checks">
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Gratuit sans CB</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Mobile-first</span>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Especes, Orange Money, MTN MoMo</span>
        </div>
      </div>

      <div className="accueil-stats">
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">500+</div>
          <div className="accueil-stat-lbl">Proprietaires</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-blue">3 200+</div>
          <div className="accueil-stat-lbl">Locataires actifs</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">2 400+</div>
          <div className="accueil-stat-lbl">Logements publies</div>
        </div>
        <div className="accueil-stat">
          <div className="accueil-stat-val accueil-green">8</div>
          <div className="accueil-stat-lbl">Regions couvertes</div>
        </div>
      </div>

      <div className="accueil-fonctionnalites">
        <div className="accueil-section-header">
          <div className="accueil-badge">Fonctionnalites</div>
          <h2>Tout ce dont vous avez besoin</h2>
          <p>Une plateforme complete adaptee au marche guineen</p>
        </div>

        <div className="accueil-tabs-wrapper">
          <div className="accueil-tab-panel">
            <div className="accueil-tab-label accueil-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              Espace Proprietaire
            </div>
            <div className="accueil-features-list">
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Gestion des biens</div>
                  <div className="accueil-feature-desc">Publiez et gerez tous vos logements depuis un tableau de bord unique</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Suivi des paiements</div>
                  <div className="accueil-feature-desc">Orange Money, MTN MoMo ou especes avec factures automatiques</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Documents officiels</div>
                  <div className="accueil-feature-desc">Baux, quittances, factures et mises en demeure generes en un clic</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E8F5E9',color:'#1B6B3A'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Alertes automatiques</div>
                  <div className="accueil-feature-desc">Loyers en retard, baux expirants et signalements de pannes</div>
                </div>
              </div>
            </div>
            <Link to="/register?role=proprietaire" className="accueil-btn-green" style={{display:'inline-block',marginTop:'16px',textDecoration:'none'}}>
              Demarrer gratuitement
            </Link>
          </div>

          <div className="accueil-tab-panel">
            <div className="accueil-tab-label accueil-blue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Espace Locataire
            </div>
            <div className="accueil-features-list">
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Recherche avancee</div>
                  <div className="accueil-feature-desc">Filtrez par quartier, budget, type de bien et equipements</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Reservation en ligne</div>
                  <div className="accueil-feature-desc">Reservez directement sans intermediaire</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">Historique et factures</div>
                  <div className="accueil-feature-desc">Recevez vos quittances et suivez vos paiements</div>
                </div>
              </div>
              <div className="accueil-feature-item">
                <div className="accueil-feature-icon" style={{background:'#E3F2FD',color:'#1A4FA0'}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/></svg>
                </div>
                <div>
                  <div className="accueil-feature-title">100% gratuit</div>
                  <div className="accueil-feature-desc">L'espace locataire est toujours gratuit pour tous</div>
                </div>
              </div>
            </div>
            <Link to="/logements" className="accueil-btn-blue" style={{display:'inline-block',marginTop:'16px',textDecoration:'none'}}>
              Trouver un logement
            </Link>
          </div>
        </div>
      </div>

      <div className="accueil-comment-ca-marche">
        <div className="accueil-section-header">
          <div className="accueil-badge">Comment ca marche</div>
          <h2>Simple comme bonjour</h2>
        </div>
        <div className="accueil-steps">
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-green">1</div>
            <div className="accueil-step-title">Creez votre compte</div>
            <div className="accueil-step-desc">Inscrivez-vous en tant que proprietaire ou locataire en 2 minutes</div>
          </div>
          <div className="accueil-step-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-green">2</div>
            <div className="accueil-step-title">Publiez ou recherchez</div>
            <div className="accueil-step-desc">Ajoutez vos biens ou filtrez par quartier, budget et type</div>
          </div>
          <div className="accueil-step-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div className="accueil-step">
            <div className="accueil-step-num accueil-step-blue">3</div>
            <div className="accueil-step-title">Reservez et payez</div>
            <div className="accueil-step-desc">Payez en ligne ou en especes, recevez votre facture automatiquement</div>
          </div>
        </div>
      </div>

      <div className="accueil-pricing">
        <div className="accueil-section-header">
          <div className="accueil-badge">Tarifs</div>
          <h2>Plans pour les proprietaires</h2>
          <p>L'espace locataire est toujours 100% gratuit</p>
        </div>
        <div className="accueil-plans">
          <div className="accueil-plan accueil-plan-featured">
            <div className="accueil-plan-badge">Recommande</div>
            <div className="accueil-plan-type">Pro</div>
            <div className="accueil-plan-price">120 000 <span>GNF/mois</span></div>
            <div className="accueil-plan-sub">Jusqu'a 20 biens</div>
            <Link to="/register" className="accueil-btn-green accueil-btn-full" style={{textAlign:'center',display:'block'}}>Essai 14 jours</Link>
            <div className="accueil-plan-features">
              <div className="accueil-plan-feature accueil-plan-feature-ok">Orange Money + MTN MoMo</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Baux et quittances PDF</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Annuaire logements</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Rapports financiers</div>
            </div>
          </div>

          <div className="accueil-plan">
            <div className="accueil-plan-type">Agence</div>
            <div className="accueil-plan-price">300 000 <span>GNF/mois</span></div>
            <div className="accueil-plan-sub">Biens illimites</div>
            <Link to="/login" className="accueil-btn-outline accueil-btn-full" style={{textAlign:'center',display:'block'}}>Nous contacter</Link>
            <div className="accueil-plan-features">
              <div className="accueil-plan-feature accueil-plan-feature-ok">Tout du plan Pro</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Multi-utilisateurs</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Marque blanche</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">API et integrations</div>
              <div className="accueil-plan-feature accueil-plan-feature-ok">Support prioritaire</div>
            </div>
          </div>
        </div>
        <div className="accueil-pricing-note">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
          L'espace locataire (recherche, messagerie, factures, reclamations) est toujours gratuit pour tous les locataires.
        </div>
      </div>

      <div className="accueil-cta-final">
        <h2>Rejoignez Werdhe aujourd'hui</h2>
        <p>Proprietaire ou locataire — la plateforme est faite pour vous</p>
        <div className="accueil-cta-final-btns">
          <Link to="/register?role=proprietaire" className="accueil-btn-green">Je suis proprietaire</Link>
          <Link to="/register?role=locataire" className="accueil-btn-blue">Je cherche un logement</Link>
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
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>Confidentialite</span>
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>CGU</span>
          <span style={{fontSize:'12px',color:'#aaa',cursor:'pointer'}}>Contact</span>
        </div>
        <span style={{fontSize:'12px',color:'#aaa'}}>2026 Werdhe · Conakry</span>
      </footer>

    </div>
  );
}