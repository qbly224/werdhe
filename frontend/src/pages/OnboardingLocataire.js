import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

var EQUIPEMENTS = ['Eau courante', 'Gardiennage', 'Parking', 'WiFi', 'Meuble', 'Climatisation'];

export default function OnboardingLocataire() {
  var navigate = useNavigate();
  var [step, setStep] = useState(1);
  var [nomComplet, setNomComplet] = useState('');
  var [profession, setProfession] = useState('Fonctionnaire');
  var [budget, setBudget] = useState('2 000 000');
  var [quartier, setQuartier] = useState('Ratoma, Conakry');
  var [typeLogement, setTypeLogement] = useState('Appartement');
  var [dispo, setDispo] = useState('Immediate');
  var [equipements, setEquipements] = useState(['Eau courante', 'WiFi']);

  function toggleEquipement(eq) {
    var next = equipements.slice();
    var idx = next.indexOf(eq);
    if (idx >= 0) { next.splice(idx, 1); } else { next.push(eq); }
    setEquipements(next);
  }

  function Stepper() {
    var steps = [1, 2, 3, 4];
    return (
      <div className="auth-stepper">
        {steps.map(function(s) {
          var dotClass = s < step
            ? 'auth-step-dot done-blue'
            : s === step
            ? 'auth-step-dot active-blue'
            : 'auth-step-dot pending';
          var lineClass = s < step ? 'auth-step-line done-blue' : 'auth-step-line';
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
          <div className="auth-step-label">Etape 1 sur 4 · Locataire</div>
          <div className="auth-step-title">Votre profil locataire</div>
          <div className="auth-step-desc">Ces infos aident les proprietaires a evaluer votre dossier.</div>

          <div className="auth-field">
            <label>Nom complet</label>
            <input type="text" placeholder="Fatoumata Camara"
              value={nomComplet}
              onChange={function(e) { setNomComplet(e.target.value); }} />
          </div>

          <div className="auth-field">
            <label>Profession</label>
            <select value={profession} onChange={function(e) { setProfession(e.target.value); }}>
              <option>Fonctionnaire</option>
              <option>Commercant(e)</option>
              <option>Salarie(e) prive</option>
              <option>Etudiant(e)</option>
              <option>Autre</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Budget mensuel max (GNF)</label>
            <select value={budget} onChange={function(e) { setBudget(e.target.value); }}>
              <option>500 000</option>
              <option>1 000 000</option>
              <option>2 000 000</option>
              <option>5 000 000</option>
              <option>Plus de 5 000 000</option>
            </select>
          </div>

          <button className="auth-btn-blue" onClick={function() { setStep(2); }} type="button">
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
          <div className="auth-step-label">Etape 2 sur 4 · Locataire</div>
          <div className="auth-step-title">Vos criteres de recherche</div>
          <div className="auth-step-desc">Personnalisez votre recherche pour voir les logements correspondants.</div>

          <div className="auth-field">
            <label>Quartier / Ville souhaite</label>
            <select value={quartier} onChange={function(e) { setQuartier(e.target.value); }}>
              <option>Ratoma, Conakry</option>
              <option>Kaloum, Conakry</option>
              <option>Matam, Conakry</option>
              <option>Dixinn, Conakry</option>
              <option>Labe</option>
              <option>Kankan</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Type de logement</label>
            <select value={typeLogement} onChange={function(e) { setTypeLogement(e.target.value); }}>
              <option>Tous types</option>
              <option>Appartement</option>
              <option>Villa</option>
              <option>Studio / Chambre</option>
              <option>Maison</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Disponibilite souhaitee</label>
            <select value={dispo} onChange={function(e) { setDispo(e.target.value); }}>
              <option>Immediate</option>
              <option>Dans 1 mois</option>
              <option>Dans 3 mois</option>
            </select>
          </div>

          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'12px', color:'#888', fontWeight:'500', marginBottom:'8px'}}>
              Equipements souhaites
            </div>
            <div className="auth-equip-tags">
              {EQUIPEMENTS.map(function(eq) {
                var isSelected = equipements.indexOf(eq) >= 0;
                return (
                  <span
                    key={eq}
                    className={'auth-equip-tag ' + (isSelected ? 'selected-blue' : '')}
                    onClick={function() { toggleEquipement(eq); }}
                  >
                    {eq}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="auth-btn-row">
            <button className="auth-btn-outline" onClick={function() { setStep(1); }} type="button">
              Retour
            </button>
            <button className="auth-btn-blue" onClick={function() { setStep(3); }} type="button">
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
    var docs = [
      { titre: "Piece d'identite (CNI)", desc: 'Photo recto-verso', badge: 'Recommande', iconColor: '#1A4FA0', iconBg: '#E3F2FD' },
      { titre: 'Justificatif de revenus', desc: "Fiche de paie, attestation employeur", iconColor: '#1A4FA0', iconBg: '#E3F2FD' },
      { titre: 'Contact de garant', desc: 'Optionnel mais recommande', iconColor: '#1A4FA0', iconBg: '#E3F2FD' }
    ];
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">Etape 3 sur 4 · Locataire</div>
          <div className="auth-step-title">Documents de dossier</div>
          <div className="auth-step-desc">Un dossier complet augmente vos chances d'obtenir un logement rapidement.</div>

          <div style={{marginBottom:'16px'}}>
            {docs.map(function(doc) {
              return (
                <div key={doc.titre} className="auth-doc-item">
                  <div className="auth-doc-icon" style={{background: doc.iconBg}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={doc.iconColor} strokeWidth="2.5" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style={{flex:1}}>
                    <div className="auth-doc-title">{doc.titre}</div>
                    <div className="auth-doc-desc">{doc.desc}</div>
                  </div>
                  {doc.badge && (
                    <span className="auth-doc-badge">{doc.badge}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="auth-btn-row">
            <button className="auth-btn-outline" onClick={function() { setStep(2); }} type="button">
              Retour
            </button>
            <button className="auth-btn-blue" onClick={function() { setStep(4); }} type="button">
              Terminer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <p
            className="auth-link-text"
            style={{cursor:'pointer'}}
            onClick={function() { setStep(4); }}
          >
            Ignorer cette etape
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Stepper />
        <div style={{textAlign:'center'}}>
          <div className="auth-success-icon blue" style={{margin:'0 auto 14px'}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="3" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{fontSize:'17px', fontWeight:'500', color:'#111', marginBottom:'6px'}}>
            Votre espace locataire est pret !
          </div>
          <div style={{fontSize:'12px', color:'#888', marginBottom:'20px', lineHeight:'1.6'}}>
            Nous avons trouve des logements correspondant a vos criteres a {quartier}.
          </div>

          <div className="auth-quick-grid">
            <div className="auth-quick-action" onClick={function() { navigate('/logements'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Voir les logements</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Mes messages</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard/factures'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Mes factures</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Faire une reclamation</div>
            </div>
          </div>

          <button
            className="auth-btn-blue"
            onClick={function() { navigate('/logements'); }}
            type="button"
          >
            Rechercher des logements
          </button>
        </div>
      </div>
    </div>
  );
}