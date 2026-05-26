import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './auth.css';

// ================================
// COMPOSANT OTP
// ================================
function EcranOTP({ telephone, onVerif, onBack }) {
  var refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  var [vals, setVals] = useState(['', '', '', '', '', '']);
  var [secondes, setSecondes] = useState(154);

  useEffect(function() {
    var t = setInterval(function() {
      setSecondes(function(s) { return s > 0 ? s - 1 : 0; });
    }, 1000);
    return function() { clearInterval(t); };
  }, []);

  function formatTimer(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function handleOtpChange(i, val) {
    if (val.length > 1) return;
    var newVals = vals.slice();
    newVals[i] = val;
    setVals(newVals);
    if (val && i < 5) {
      refs[i + 1].current.focus();
    }
  }

  function handleOtpKey(i, e) {
    if (e.key === 'Backspace' && !vals[i] && i > 0) {
      refs[i - 1].current.focus();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back" onClick={onBack} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Retour
        </button>

        <div style={{textAlign:'center',marginBottom:'22px'}}>
          <div className="auth-otp-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div style={{fontSize:'16px',fontWeight:'500',color:'#111',marginBottom:'6px'}}>Code de verification</div>
          <div style={{fontSize:'12px',color:'#888',lineHeight:'1.6'}}>
            Code envoye par SMS au
            <br />
            <span style={{fontWeight:'500',color:'#111'}}>{telephone || '+224 622 00 00 00'}</span>
          </div>
        </div>

        <div className="auth-otp-boxes">
          {vals.map(function(v, i) {
            var cls = 'auth-otp-box';
            if (v) cls += ' filled';
            else if (i > vals.findIndex(function(x) { return !x; }) && vals.findIndex(function(x) { return !x; }) !== -1) cls += ' empty';
            return (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                maxLength={1}
                value={v}
                className={cls}
                onChange={function(e) { handleOtpChange(i, e.target.value); }}
                onKeyDown={function(e) { handleOtpKey(i, e); }}
              />
            );
          })}
        </div>

        <div className="auth-otp-timer">
          Expire dans <span>{formatTimer(secondes)}</span>
        </div>

        <button
          className="auth-btn-green"
          type="button"
          onClick={onVerif}
        >
          Verifier le code
        </button>

        <p className="auth-switch">
          Pas recu ?{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={function() { setSecondes(154); setVals(['','','','','','']); }}
          >
            Renvoyer le code
          </button>
        </p>
      </div>
    </div>
  );
}

// ================================
// ONBOARDING PROPRIETAIRE
// ================================
function OnboardingProprio({ onDone }) {
  var [etape, setEtape] = useState(1);
  var [plan, setPlan] = useState('pro');
  var [paiements, setPaiements] = useState(['om', 'mtn', 'cash']);

  function togglePaie(code) {
    setPaiements(function(prev) {
      if (prev.indexOf(code) !== -1) {
        return prev.filter(function(p) { return p !== code; });
      }
      return prev.concat([code]);
    });
  }

  function getDotClass(i) {
    if (i < etape) return 'auth-step-dot done-g';
    if (i === etape) return 'auth-step-dot active-g';
    return 'auth-step-dot pending';
  }

  function getLineClass(i) {
    if (i < etape) return 'auth-step-line done-g';
    return 'auth-step-line';
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-progress">
          {[1,2,3,4].map(function(i) {
            return (
              <span key={i} style={{display:'flex',alignItems:'center',flex: i < 4 ? '1' : 'none'}}>
                <span className={getDotClass(i)}>
                  {i < etape ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i}
                </span>
                {i < 4 && <span className={getLineClass(i)} style={{flex:1}}></span>}
              </span>
            );
          })}
        </div>

        {etape === 1 && (
          <div>
            <div className="auth-step-label">Etape 1 sur 4 - Proprietaire</div>
            <div className="auth-step-title">Choisissez votre plan</div>
            <div className="auth-step-desc">Modifiable a tout moment depuis les parametres.</div>

            <div
              className={'auth-plan-card ' + (plan === 'free' ? 'selected' : '')}
              onClick={function() { setPlan('free'); }}
            >
              <div className="auth-plan-icon" style={{background:'#E8F5E9'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-plan-name">Gratuit — 0 GNF/mois</div>
                <div className="auth-plan-desc">Jusqu'a 2 biens - Gestion basique</div>
              </div>
            </div>

            <div
              className={'auth-plan-card ' + (plan === 'pro' ? 'selected' : '')}
              onClick={function() { setPlan('pro'); }}
            >
              <div className="auth-plan-icon" style={{background:'#fff',border:'0.5px solid #eee'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-plan-name">Pro — 120 000 GNF/mois</div>
                <div className="auth-plan-desc">Mobile Money + Especes + Documents + Rapports</div>
              </div>
              <span className="auth-plan-badge">Recommande</span>
            </div>

            <div
              className={'auth-plan-card ' + (plan === 'agence' ? 'selected' : '')}
              onClick={function() { setPlan('agence'); }}
            >
              <div className="auth-plan-icon" style={{background:'#F3E5F5'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" strokeWidth="2.5" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/></svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-plan-name">Agence — 300 000 GNF/mois</div>
                <div className="auth-plan-desc">Biens illimites - Multi-utilisateurs - API</div>
              </div>
            </div>

            <button className="auth-btn-green" type="button" onClick={function() { setEtape(2); }}>
              Continuer
            </button>
          </div>
        )}

        {etape === 2 && (
          <div>
            <div className="auth-step-label">Etape 2 sur 4 - Proprietaire</div>
            <div className="auth-step-title">Votre profil proprietaire</div>

            <div className="auth-field">
              <label>Nom complet</label>
              <input type="text" placeholder="Mamadou Diallo" />
            </div>
            <div className="auth-field">
              <label>Ville principale</label>
              <select>
                <option>Conakry</option>
                <option>Labe</option>
                <option>Kankan</option>
                <option>N'Zerekoré</option>
                <option>Kindia</option>
              </select>
            </div>
            <div className="auth-field">
              <label>Nombre de biens a gerer</label>
              <select>
                <option>1 a 2</option>
                <option>3 a 5</option>
                <option>6 a 10</option>
                <option>Plus de 10</option>
              </select>
            </div>

            <div className="auth-btn-row">
              <button className="auth-btn-outline" type="button" onClick={function() { setEtape(1); }} style={{flex:1}}>Retour</button>
              <button className="auth-btn-green" type="button" onClick={function() { setEtape(3); }} style={{flex:2}}>Continuer</button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div>
            <div className="auth-step-label">Etape 3 sur 4 - Proprietaire</div>
            <div className="auth-step-title">Modes de paiement acceptes</div>
            <div className="auth-step-desc">Selectionnez les modes que vous acceptez de vos locataires.</div>

            <div
              className={'auth-pay-option ' + (paiements.indexOf('om') !== -1 ? 'selected' : '')}
              onClick={function() { togglePaie('om'); }}
            >
              <div className="auth-pay-logo" style={{background:'#FF6600'}}>OM</div>
              <div style={{flex:1}}>
                <div className="auth-pay-name">Orange Money</div>
                <div className="auth-pay-desc">Paiement instantane + notification</div>
              </div>
              {paiements.indexOf('om') !== -1 && (
                <div className="auth-pay-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>

            <div
              className={'auth-pay-option ' + (paiements.indexOf('mtn') !== -1 ? 'selected' : '')}
              onClick={function() { togglePaie('mtn'); }}
            >
              <div className="auth-pay-logo" style={{background:'#FFCC00',color:'#1B2B22'}}>MM</div>
              <div style={{flex:1}}>
                <div className="auth-pay-name">MTN MoMo</div>
                <div className="auth-pay-desc">Paiement instantane + notification</div>
              </div>
              {paiements.indexOf('mtn') !== -1 && (
                <div className="auth-pay-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>

            <div
              className={'auth-pay-option ' + (paiements.indexOf('cash') !== -1 ? 'selected' : '')}
              onClick={function() { togglePaie('cash'); }}
            >
              <div className="auth-pay-logo" style={{background:'#E8F5E9'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-pay-name">Especes</div>
                <div className="auth-pay-desc">Vous enregistrez le paiement - quittance PDF auto</div>
              </div>
              {paiements.indexOf('cash') !== -1 && (
                <div className="auth-pay-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>

            <div
              className={'auth-pay-option ' + (paiements.indexOf('bank') !== -1 ? 'selected' : '')}
              onClick={function() { togglePaie('bank'); }}
            >
              <div className="auth-pay-logo" style={{background:'#E3F2FD'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3 22v-8"/><path d="M8 22V12"/><path d="M13 22V12"/><path d="M18 22v-8"/>
                  <path d="M2 12h20"/><path d="M12 2L2 7h20L12 2z"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-pay-name">Virement bancaire</div>
                <div className="auth-pay-desc">BICIGUI, Ecobank, UBA</div>
              </div>
              {paiements.indexOf('bank') !== -1 && (
                <div className="auth-pay-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>

            <div className="auth-btn-row" style={{marginTop:'14px'}}>
              <button className="auth-btn-outline" type="button" onClick={function() { setEtape(2); }} style={{flex:1}}>Retour</button>
              <button className="auth-btn-green" type="button" onClick={function() { setEtape(4); }} style={{flex:2}}>Continuer</button>
            </div>
          </div>
        )}

        {etape === 4 && (
          <div style={{textAlign:'center'}}>
            <div className="auth-success-icon auth-success-icon-green">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontSize:'17px',fontWeight:'500',color:'#111',marginBottom:'6px'}}>Espace proprietaire pret !</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'20px',lineHeight:'1.6'}}>
              Bienvenue sur Werdhe. Votre tableau de bord est configure. Commencez par ajouter votre premier bien.
            </div>

            <div className="auth-quick-actions">
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/></svg>
                </div>
                <div className="auth-quick-action-label">Ajouter un bien</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="auth-quick-action-label">Ajouter un locataire</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="auth-quick-action-label">Creer un bail</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div className="auth-quick-action-label">Enregistrer un paiement</div>
              </div>
            </div>

            <button className="auth-btn-green" type="button" onClick={onDone}>
              Acceder a mon tableau de bord
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ================================
// ONBOARDING LOCATAIRE
// ================================
function OnboardingLocataire({ onDone }) {
  var [etape, setEtape] = useState(1);
  var equipementsDispos = ['Eau courante', 'Gardiennage', 'Parking', 'WiFi', 'Meuble', 'Climatisation'];
  var [equipements, setEquipements] = useState(['Eau courante', 'WiFi']);

  function toggleEquip(eq) {
    setEquipements(function(prev) {
      if (prev.indexOf(eq) !== -1) {
        return prev.filter(function(e) { return e !== eq; });
      }
      return prev.concat([eq]);
    });
  }

  function getDotClass(i) {
    if (i < etape) return 'auth-step-dot done-b';
    if (i === etape) return 'auth-step-dot active-b';
    return 'auth-step-dot pending';
  }

  function getLineClass(i) {
    if (i < etape) return 'auth-step-line done-b';
    return 'auth-step-line';
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-progress">
          {[1,2,3,4].map(function(i) {
            return (
              <span key={i} style={{display:'flex',alignItems:'center',flex: i < 4 ? '1' : 'none'}}>
                <span className={getDotClass(i)}>
                  {i < etape ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i}
                </span>
                {i < 4 && <span className={getLineClass(i)} style={{flex:1}}></span>}
              </span>
            );
          })}
        </div>

        {etape === 1 && (
          <div>
            <div className="auth-step-label">Etape 1 sur 4 - Locataire</div>
            <div className="auth-step-title">Votre profil locataire</div>
            <div className="auth-step-desc">Ces infos aident les proprietaires a evaluer votre dossier.</div>

            <div className="auth-field">
              <label>Nom complet</label>
              <input type="text" placeholder="Fatoumata Camara" />
            </div>
            <div className="auth-field">
              <label>Profession</label>
              <select>
                <option>Fonctionnaire</option>
                <option>Commercant(e)</option>
                <option>Salarie(e) prive</option>
                <option>Etudiant(e)</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="auth-field">
              <label>Budget mensuel max (GNF)</label>
              <select>
                <option>500 000</option>
                <option>1 000 000</option>
                <option>2 000 000</option>
                <option>5 000 000</option>
                <option>Plus de 5 000 000</option>
              </select>
            </div>

            <button className="auth-btn-blue" type="button" onClick={function() { setEtape(2); }}>
              Continuer
            </button>
          </div>
        )}

        {etape === 2 && (
          <div>
            <div className="auth-step-label">Etape 2 sur 4 - Locataire</div>
            <div className="auth-step-title">Vos criteres de recherche</div>
            <div className="auth-step-desc">Personnalisez votre recherche pour voir les logements correspondants.</div>

            <div className="auth-field">
              <label>Quartier / Ville souhaite</label>
              <select>
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
              <select>
                <option>Tous types</option>
                <option>Appartement</option>
                <option>Villa</option>
                <option>Studio / Chambre</option>
                <option>Maison</option>
              </select>
            </div>
            <div className="auth-field">
              <label>Disponibilite souhaitee</label>
              <select>
                <option>Immediate</option>
                <option>Dans 1 mois</option>
                <option>Dans 3 mois</option>
              </select>
            </div>

            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'12px',color:'#555',fontWeight:'500',marginBottom:'8px'}}>Equipements souhaites</div>
              <div className="auth-equip-tags">
                {equipementsDispos.map(function(eq) {
                  var sel = equipements.indexOf(eq) !== -1;
                  return (
                    <span
                      key={eq}
                      className={'auth-equip-tag ' + (sel ? 'selected' : '')}
                      onClick={function() { toggleEquip(eq); }}
                    >
                      {eq}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="auth-btn-row">
              <button className="auth-btn-outline" type="button" onClick={function() { setEtape(1); }} style={{flex:1}}>Retour</button>
              <button className="auth-btn-blue" type="button" onClick={function() { setEtape(3); }} style={{flex:2}}>Continuer</button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div>
            <div className="auth-step-label">Etape 3 sur 4 - Locataire</div>
            <div className="auth-step-title">Documents de dossier</div>
            <div className="auth-step-desc">Un dossier complet augmente vos chances d'obtenir un logement rapidement.</div>

            <div className="auth-doc-item">
              <div className="auth-doc-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-doc-name">Piece d'identite (CNI)</div>
                <div className="auth-doc-desc">Photo recto-verso</div>
              </div>
              <span className="auth-doc-badge">Recommande</span>
            </div>

            <div className="auth-doc-item">
              <div className="auth-doc-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-doc-name">Justificatif de revenus</div>
                <div className="auth-doc-desc">Fiche de paie, attestation employeur</div>
              </div>
            </div>

            <div className="auth-doc-item">
              <div className="auth-doc-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <div className="auth-doc-name">Contact de garant</div>
                <div className="auth-doc-desc">Optionnel mais recommande</div>
              </div>
            </div>

            <div className="auth-btn-row" style={{marginTop:'16px'}}>
              <button className="auth-btn-outline" type="button" onClick={function() { setEtape(2); }} style={{flex:1}}>Retour</button>
              <button className="auth-btn-blue" type="button" onClick={function() { setEtape(4); }} style={{flex:2}}>Terminer</button>
            </div>
            <p style={{fontSize:'11px',color:'#aaa',textAlign:'center',marginTop:'10px',cursor:'pointer'}} onClick={function() { setEtape(4); }}>
              Ignorer cette etape
            </p>
          </div>
        )}

        {etape === 4 && (
          <div style={{textAlign:'center'}}>
            <div className="auth-success-icon auth-success-icon-blue">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontSize:'17px',fontWeight:'500',color:'#111',marginBottom:'6px'}}>Votre espace locataire est pret !</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'20px',lineHeight:'1.6'}}>
              Nous avons trouve <span style={{fontWeight:'500',color:'#1A4FA0'}}>12 logements</span> correspondant a vos criteres a Ratoma.
            </div>

            <div className="auth-quick-actions">
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div className="auth-quick-action-label">Voir les logements</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="auth-quick-action-label">Mes messages</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </div>
                <div className="auth-quick-action-label">Mes factures</div>
              </div>
              <div className="auth-quick-action">
                <div className="auth-quick-action-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className="auth-quick-action-label">Faire une reclamation</div>
              </div>
            </div>

            <button className="auth-btn-blue" type="button" onClick={onDone}>
              Rechercher des logements
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ================================
// ECRAN INSCRIPTION PRINCIPAL
// ================================
function EcranInscription({ onOTP, role, setRole }) {
  var [searchParams] = useSearchParams();
  var roleInitial = searchParams.get('role') || 'proprietaire';
  var [formData, setFormData] = useState({
    prenom: '', nom: '', email: '',
    telephone: '', mot_de_passe: '',
    role: role || roleInitial
  });
  var [mdpForce, setMdpForce] = useState(0);
  var [cgu, setCgu] = useState(false);
  var [loading, setLoading] = useState(false);
  var [erreur, setErreur] = useState('');
  var { login } = useAuth();
  var navigate = useNavigate();

  function calculerForce(mdp) {
    var score = 0;
    if (mdp.length >= 6) score++;
    if (mdp.length >= 10) score++;
    if (/[A-Z]/.test(mdp) || /[0-9]/.test(mdp)) score++;
    if (/[^a-zA-Z0-9]/.test(mdp)) score++;
    return score;
  }

  function getForceLabel() {
    if (mdpForce === 0) return '';
    if (mdpForce <= 1) return 'Faible';
    if (mdpForce <= 2) return 'Moyen';
    return 'Fort';
  }

  function getForceClass() {
    if (mdpForce <= 1) return 'weak';
    if (mdpForce <= 2) return 'medium';
    return 'strong';
  }

  function getBarClass(i) {
    if (mdpForce === 0) return 'auth-strength-bar';
    if (mdpForce <= 1) return i <= 1 ? 'auth-strength-bar weak' : 'auth-strength-bar';
    if (mdpForce <= 2) return i <= 2 ? 'auth-strength-bar medium' : 'auth-strength-bar';
    return 'auth-strength-bar strong';
  }

  function handleChange(e) {
    var nouv = Object.assign({}, formData, { [e.target.name]: e.target.value });
    setFormData(nouv);
    if (e.target.name === 'mot_de_passe') {
      setMdpForce(calculerForce(e.target.value));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cgu) { setErreur('Veuillez accepter les CGU'); return; }
    setLoading(true);
    setErreur('');
    try {
      var payload = Object.assign({}, formData, { role: role });
      var res = await api.post('/auth/register', payload);
      login(res.data.user, res.data.token);
      toast.success('Compte cree !');
      onOTP(formData.telephone, role);
    } catch (err) {
      setErreur(err.response && err.response.data ? err.response.data.erreur : 'Erreur inscription');
    } finally {
      setLoading(false);
    }
  }

  var isProprietaire = role === 'proprietaire';

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>

        <h2 className="auth-title">Creer votre compte</h2>
        <p className="auth-subtitle">Gratuit · Sans carte bancaire</p>

        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'12px',color:'#888',marginBottom:'8px',fontWeight:'500'}}>Je m'inscris en tant que</div>
          <div className="auth-role-cards">
            <div
              className={'auth-role-card ' + (isProprietaire ? 'selected-green' : '')}
              onClick={function() { setRole('proprietaire'); }}
            >
              <div className="auth-role-icon" style={{background:'#E8F5E9'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B6B3A" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <div className="auth-role-title">Proprietaire</div>
              <div className="auth-role-desc">Je gere des biens locatifs</div>
            </div>
            <div
              className={'auth-role-card ' + (!isProprietaire ? 'selected-blue' : '')}
              onClick={function() { setRole('locataire'); }}
            >
              <div className="auth-role-icon" style={{background:'#E3F2FD'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="auth-role-title">Locataire</div>
              <div className="auth-role-desc">Je cherche un logement</div>
            </div>
          </div>
        </div>

        {erreur && (
          <div className="auth-erreur">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'0'}}>
            <div className="auth-field">
              <label>Prenom</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Alpha" required />
            </div>
            <div className="auth-field">
              <label>Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Barry" required />
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="vous@email.com" required />
          </div>

          <div className="auth-field">
            <label>Telephone</label>
            <div className="auth-phone-wrap">
              <div className="auth-phone-prefix">
                <span>🇬🇳</span>
                <span style={{fontSize:'12px',color:'#555'}}>+224</span>
              </div>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="622 00 00 00"
                className="auth-phone-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password"
              name="mot_de_passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              placeholder="Minimum 6 caracteres"
              required
            />
            {formData.mot_de_passe && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  <div className={getBarClass(1)}></div>
                  <div className={getBarClass(2)}></div>
                  <div className={getBarClass(3)}></div>
                  <div className={getBarClass(4)}></div>
                </div>
                <div className={'auth-strength-label ' + getForceClass()}>
                  {getForceLabel()}
                </div>
              </div>
            )}
          </div>

          <div className="auth-cgu">
            <input
              type="checkbox"
              id="cgu-check"
              checked={cgu}
              onChange={function(e) { setCgu(e.target.checked); }}
            />
            <label htmlFor="cgu-check">
              J'accepte les <span className="auth-cgu-link">Conditions d'utilisation</span> et la <span className="auth-cgu-link">Politique de confidentialite</span>
            </label>
          </div>

          <button
            type="submit"
            className={isProprietaire ? 'auth-btn-green' : 'auth-btn-blue'}
            disabled={loading}
          >
            {loading ? 'Creation...' : 'Creer mon compte'}
          </button>
        </form>

        <p className="auth-switch">
          Deja un compte ?{' '}
          <Link to="/login" className="auth-switch-link">Se connecter</Link>
        </p>

      </div>
    </div>
  );
}

// ================================
// COMPOSANT PRINCIPAL REGISTER
// ================================
export default function Register() {
  var navigate = useNavigate();
  var [ecran, setEcran] = useState('form');
  var [role, setRole] = useState('proprietaire');
  var [telephone, setTelephone] = useState('');

  function handleOTP(tel, r) {
    setTelephone(tel);
    setRole(r);
    setEcran('otp');
  }

  function handleVerifOTP() {
    if (role === 'proprietaire') {
      setEcran('ob-p');
    } else {
      setEcran('ob-l');
    }
  }

  function handleDone() {
    navigate('/dashboard');
  }

  function handleDoneLocataire() {
    navigate('/logements');
  }

  if (ecran === 'otp') {
    return (
      <EcranOTP
        telephone={telephone}
        onVerif={handleVerifOTP}
        onBack={function() { setEcran('form'); }}
      />
    );
  }

  if (ecran === 'ob-p') {
    return <OnboardingProprio onDone={handleDone} />;
  }

  if (ecran === 'ob-l') {
    return <OnboardingLocataire onDone={handleDoneLocataire} />;
  }

  return (
    <EcranInscription
      onOTP={handleOTP}
      role={role}
      setRole={setRole}
    />
  );
}