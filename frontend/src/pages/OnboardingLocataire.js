import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

var EQUIPEMENTS = ['Eau courante', 'Gardiennage', 'Parking', 'WiFi', 'Meuble', 'Climatisation'];
var TYPES_LOGEMENT = ['Tous types', 'Appartement', 'Villa', 'Studio', 'Chambre', 'Maison', 'Duplex', 'Bureau', 'Boutique'];

export default function OnboardingLocataire() {
  var navigate = useNavigate();
  var [step, setStep] = useState(1);
  var [nomComplet, setNomComplet] = useState('');
  var [profession, setProfession] = useState('Fonctionnaire');
  var [budget, setBudget] = useState('2 000 000');
  var [villeTexte, setVilleTexte] = useState('');
  var [typeLogement, setTypeLogement] = useState('Tous types');
  var [dispo, setDispo] = useState('Immediate');
  var [equipements, setEquipements] = useState(['Eau courante', 'WiFi']);
  var [docs, setDocs] = useState({ cni: null, revenus: null, garant: null });
  var [uploading, setUploading] = useState(false);

  function toggleEquipement(eq) {
    var next = equipements.slice();
    var idx = next.indexOf(eq);
    if (idx >= 0) { next.splice(idx, 1); } else { next.push(eq); }
    setEquipements(next);
  }

  function handleDocUpload(key, file) {
    if (!file) return;
    setUploading(true);
    setTimeout(function() {
      setDocs(function(prev) {
        var next = Object.assign({}, prev);
        next[key] = file;
        return next;
      });
      setUploading(false);
    }, 500);
  }

  function Stepper() {
    var steps = [1, 2, 3, 4];
    return (
      <div className="auth-stepper">
        {steps.map(function(s) {
          var dotClass = s < step ? 'auth-step-dot done-blue' : s === step ? 'auth-step-dot active-blue' : 'auth-step-dot pending';
          var lineClass = s < step ? 'auth-step-line done-blue' : 'auth-step-line';
          return (
            <div key={s} style={{display:'flex', alignItems:'center', flex: s < 4 ? '1' : 'none'}}>
              <div className={dotClass}>
                {s < step ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
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
              <option>Independant(e)</option>
              <option>Autre</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Budget mensuel max (GNF)</label>
            <select value={budget} onChange={function(e) { setBudget(e.target.value); }}>
              <option>500 000</option>
              <option>1 000 000</option>
              <option>2 000 000</option>
              <option>3 000 000</option>
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
            <input
              type="text"
              placeholder="Ex: Ratoma, Conakry ou Labe..."
              value={villeTexte}
              onChange={function(e) { setVilleTexte(e.target.value); }}
              list="villes-list"
            />
            <datalist id="villes-list">
              <option value="Ratoma, Conakry" />
              <option value="Kaloum, Conakry" />
              <option value="Matam, Conakry" />
              <option value="Dixinn, Conakry" />
              <option value="Matoto, Conakry" />
              <option value="Lambanyi, Conakry" />
              <option value="Hamdallaye, Conakry" />
              <option value="Cosa, Conakry" />
              <option value="Nongo, Conakry" />
              <option value="Kobaya, Conakry" />
              <option value="Bambeto, Conakry" />
              <option value="Kaporo, Conakry" />
              <option value="Sonfonia, Conakry" />
              <option value="Labe" />
              <option value="Kankan" />
              <option value="Nzerekore" />
              <option value="Kindia" />
              <option value="Mamou" />
              <option value="Boke" />
              <option value="Faranah" />
              <option value="Siguiri" />
              <option value="Kissidougou" />
              <option value="Gueckedou" />
              <option value="Pita" />
              <option value="Fria" />
              <option value="Boffa" />
              <option value="Coyah" />
            </datalist>
            <div style={{fontSize:'11px', color:'#aaa', marginTop:'4px'}}>
              Ecrivez librement ou choisissez dans la liste
            </div>
          </div>

          <div className="auth-field">
            <label>Type de logement</label>
            <select value={typeLogement} onChange={function(e) { setTypeLogement(e.target.value); }}>
              {TYPES_LOGEMENT.map(function(t) { return <option key={t}>{t}</option>; })}
            </select>
          </div>

          <div className="auth-field">
            <label>Disponibilite souhaitee</label>
            <select value={dispo} onChange={function(e) { setDispo(e.target.value); }}>
              <option>Immediate</option>
              <option>Dans 1 mois</option>
              <option>Dans 3 mois</option>
              <option>Dans 6 mois</option>
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
            <button className="auth-btn-outline" onClick={function() { setStep(1); }} type="button">Retour</button>
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
    var docsList = [
      { key: 'cni', titre: "Piece d'identite (CNI)", desc: 'Photo recto-verso', badge: 'Recommande', accept: 'image/*,.pdf' },
      { key: 'revenus', titre: 'Justificatif de revenus', desc: 'Fiche de paie, attestation employeur', badge: null, accept: '.pdf,.doc,.docx,image/*' },
      { key: 'garant', titre: 'Contact de garant', desc: 'Optionnel mais recommande', badge: null, accept: 'image/*,.pdf' }
    ];
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">Etape 3 sur 4 · Locataire</div>
          <div className="auth-step-title">Documents de dossier</div>
          <div className="auth-step-desc">Un dossier complet augmente vos chances d'obtenir un logement rapidement.</div>

          <div style={{marginBottom:'16px'}}>
            {docsList.map(function(doc) {
              var uploaded = docs[doc.key];
              return (
                <div key={doc.key} style={{marginBottom:'10px'}}>
                  <label style={{cursor:'pointer', display:'block'}}>
                    <div
                      className="auth-doc-item"
                      style={{
                        borderColor: uploaded ? '#1A4FA0' : '#e0e0e0',
                        background: uploaded ? '#f0f4fb' : '#fff',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div className="auth-doc-icon" style={{background: uploaded ? '#E3F2FD' : '#f5f5f5'}}>
                        {uploaded ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                          </svg>
                        )}
                      </div>
                      <div style={{flex:1}}>
                        <div className="auth-doc-title" style={{color: uploaded ? '#1A4FA0' : '#111'}}>
                          {doc.titre}
                        </div>
                        <div className="auth-doc-desc">
                          {uploaded ? ('✓ ' + uploaded.name) : doc.desc}
                        </div>
                      </div>
                      <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px'}}>
                        {doc.badge && !uploaded && (
                          <span className="auth-doc-badge">{doc.badge}</span>
                        )}
                        <span style={{
                          fontSize:'11px',
                          color: uploaded ? '#1A4FA0' : '#1B6B3A',
                          fontWeight:'600',
                          background: uploaded ? '#E3F2FD' : '#E8F5E9',
                          borderRadius:'20px',
                          padding:'2px 10px'
                        }}>
                          {uploaded ? 'Changer' : 'Cliquer pour ajouter'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept={doc.accept}
                        style={{display:'none'}}
                        onChange={function(e) {
                          if (e.target.files && e.target.files[0]) {
                            handleDocUpload(doc.key, e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {uploading && (
            <div style={{textAlign:'center', fontSize:'12px', color:'#1A4FA0', marginBottom:'10px'}}>
              Chargement...
            </div>
          )}

          <div className="auth-btn-row">
            <button className="auth-btn-outline" onClick={function() { setStep(2); }} type="button">Retour</button>
            <button className="auth-btn-blue" onClick={function() { setStep(4); }} type="button">
              Terminer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <p className="auth-link-text" style={{cursor:'pointer'}} onClick={function() { setStep(4); }}>
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
            Nous avons configure votre profil.
            {villeTexte && (' Logements disponibles a ' + villeTexte + '.')}
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
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">Mon tableau de bord</div>
            </div>
          </div>
          <button className="auth-btn-blue" onClick={function() { navigate('/logements'); }} type="button">
            Rechercher des logements
          </button>
        </div>
      </div>
    </div>
  );
}