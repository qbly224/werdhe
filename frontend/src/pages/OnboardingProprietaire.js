import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

var PLANS = [
  {
    id: 'gratuit',
    titre: 'Gratuit - 0 GNF/mois',
    desc: "Jusqu'a 2 biens · Gestion basique",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    iconBg: '#E8F5E9',
    recommande: false
  },
  {
    id: 'pro',
    titre: 'Pro - 120 000 GNF/mois',
    desc: 'Mobile Money + Especes + Documents + Rapports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2.5" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    iconBg: '#fff',
    recommande: true
  },
  {
    id: 'agence',
    titre: 'Agence - 300 000 GNF/mois',
    desc: 'Biens illimites · Multi-utilisateurs · API',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" strokeWidth="2.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
    ),
    iconBg: '#F3E5F5',
    recommande: false
  }
];

var PAIEMENTS = [
  { id: 'om', logo: 'OM', logoBg: '#FF6600', logoColor: '#fff', titre: 'Orange Money', desc: 'Paiement instantane + notification', selected: true },
  { id: 'mtn', logo: 'MM', logoBg: '#FFCC00', logoColor: '#1B2B22', titre: 'MTN MoMo', desc: 'Paiement instantane + notification', selected: true },
  { id: 'cash', logo: null, titre: 'Especes', desc: 'Vous enregistrez le paiement · quittance PDF auto', selected: true },
  { id: 'bank', logo: null, titre: 'Virement bancaire', desc: 'BICIGUI, Ecobank, UBA', selected: false }
];

export default function OnboardingProprietaire() {
  var navigate = useNavigate();
  var [step, setStep] = useState(1);
  var [planChoisi, setPlanChoisi] = useState('pro');
  var [nomComplet, setNomComplet] = useState('');
  var [ville, setVille] = useState('Conakry');
  var [nbBiens, setNbBiens] = useState('3 a 5');
  var [paiements, setPaiements] = useState({ om: true, mtn: true, cash: true, bank: false });

  function togglePaiement(id) {
    var next = Object.assign({}, paiements);
    next[id] = !next[id];
    setPaiements(next);
  }

  function Stepper() {
    var steps = [1, 2, 3, 4];
    return (
      <div className="auth-stepper">
        {steps.map(function(s, i) {
          var dotClass = s < step
            ? 'auth-step-dot done-green'
            : s === step
            ? 'auth-step-dot active-green'
            : 'auth-step-dot pending';
          var lineClass = s < step ? 'auth-step-line done-green' : 'auth-step-line';
          return (
            <div key={s} style={{display:'flex', alignItems:'center', flex: s < 4 ? '1' : 'none'}}>
              <div className={dotClass}>
                {s < step ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : s}
              </div>
              {s < 4 && <div className={lineClass} style={{flex:1}} />}
            </div>
          );
        })}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">Etape 1 sur 4 · Proprietaire</div>
          <div className="auth-step-title">Choisissez votre plan</div>
          <div className="auth-step-desc">Modifiable a tout moment depuis les parametres.</div>

          {PLANS.map(function(plan) {
            var isSelected = planChoisi === plan.id;
            return (
              <div
                key={plan.id}
                className={'auth-plan-opt ' + (isSelected ? 'selected' : '')}
                onClick={function() { setPlanChoisi(plan.id); }}
              >
                <div className="auth-pay-icon" style={{background: plan.iconBg}}>
                  {plan.icon}
                </div>
                <div style={{flex:1}}>
                  <div className="auth-pay-title">{plan.titre}</div>
                  <div className="auth-pay-desc">{plan.desc}</div>
                </div>
                {plan.recommande && (
                  <span style={{
                    fontSize:'10px', background:'#1B6B3A', color:'#fff',
                    borderRadius:'20px', padding:'2px 8px', whiteSpace:'nowrap'
                  }}>Recommande</span>
                )}
              </div>
            );
          })}

          <button
            className="auth-btn-green"
            style={{marginTop:'6px'}}
            onClick={function() { setStep(2); }}
            type="button"
          >
            Continuer
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">Etape 2 sur 4 · Proprietaire</div>
          <div className="auth-step-title">Votre profil proprietaire</div>

          <div className="auth-field">
            <label>Nom complet (tel qu'il apparaitra sur les documents)</label>
            <input
              type="text"
              placeholder="Alpha Barry"
              value={nomComplet}
              onChange={function(e) { setNomComplet(e.target.value); }}
            />
          </div>

          <div className="auth-field">
            <label>Ville principale</label>
            <select value={ville} onChange={function(e) { setVille(e.target.value); }}>
              <option>Conakry</option>
              <option>Labe</option>
              <option>Kankan</option>
              <option>Nzerekore</option>
              <option>Kindia</option>
              <option>Mamou</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Nombre de biens a gerer</label>
            <select value={nbBiens} onChange={function(e) { setNbBiens(e.target.value); }}>
              <option>1 a 2</option>
              <option>3 a 5</option>
              <option>6 a 10</option>
              <option>Plus de 10</option>
            </select>
          </div>

          <div className="auth-btn-row">
            <button className="auth-btn-outline" onClick={function() { setStep(1); }} type="button">
              Retour
            </button>
            <button className="auth-btn-green" onClick={function() { setStep(3); }} type="button">
              Continuer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">Etape 3 sur 4 · Proprietaire</div>
          <div className="auth-step-title">Modes de paiement acceptes</div>
          <div className="auth-step-desc">Selectionnez les modes que vous acceptez de vos locataires.</div>

          {PAIEMENTS.map(function(p) {
            var isSelected = paiements[p.id];
            return (
              <div
                key={p.id}
                className={'auth-pay-opt ' + (isSelected ? 'selected' : '')}
                onClick={function() { togglePaiement(p.id); }}
              >
                {p.logo ? (
                  <div className="auth-pay-icon" style={{background: p.logoBg, color: p.logoColor, fontWeight:'700', fontSize:'11px'}}>
                    {p.logo}
                  </div>
                ) : p.id === 'cash' ? (
                  <div className="auth-pay-icon" style={{background:'#E8F5E9'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
                      <rect x="2" y="6" width="20" height="12" rx="2"/>
                      <circle cx="12" cy="12" r="2"/>
                    </svg>
                  </div>
                ) : (
                  <div className="auth-pay-icon" style={{background:'#E3F2FD'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2.5" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                    </svg>
                  </div>
                )}
                <div style={{flex:1}}>
                  <div className="auth-pay-title">{p.titre}</div>
                  <div className="auth-pay-desc">{p.desc}</div>
                </div>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}

          <div className="auth-btn-row" style={{marginTop:'14px'}}>
            <button className="auth-btn-outline" onClick={function() { setStep(2); }} type="button">
              Retour
            </button>
            <button className="auth-btn-green" onClick={function() { setStep(4); }} type="button">
              Continuer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Stepper />
        <div style={{textAlign:'center'}}>
          <div className="auth-success-icon green" style={{margin:'0 auto 14px'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="3" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{fontSize:'17px', fontWeight:'500', color:'#111', marginBottom:'6px'}}>
            Espace proprietaire pret !
          </div>
          <div style={{fontSize:'12px', color:'#888', marginBottom:'20px', lineHeight:'1.6'}}>
            Bienvenue sur Werdhe. Votre tableau de bord est configure. Commencez par ajouter votre premier bien.
          </div>

          <div className="auth-quick-grid">
            <div className="auth-quick-action" onClick={function() { navigate('/logements/ajouter'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <line x1="12" y1="22" x2="12" y2="12"/>
                  <line x1="8" y1="16" x2="16" y2="16"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Ajouter un bien</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard/locataires'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Ajouter un locataire</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard/documents'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Creer un bail</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard/paiements'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Enregistrer un paiement</div>
            </div>
          </div>

          <button
            className="auth-btn-green"
            onClick={function() { navigate('/dashboard'); }}
            type="button"
          >
            Acceder a mon tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}