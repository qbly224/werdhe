import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './auth.css';

export default function OnboardingLocataire() {
  var navigate = useNavigate();
  var t = useTranslation('logements').t;
  var EQUIPEMENTS = [
    t('onboardingLocataire.equipements.eauCourante'),
    t('onboardingLocataire.equipements.gardiennage'),
    t('onboardingLocataire.equipements.parking'),
    t('onboardingLocataire.equipements.wifi'),
    t('onboardingLocataire.equipements.meuble'),
    t('onboardingLocataire.equipements.climatisation'),
  ];
  var TYPES_LOGEMENT = [
    t('onboardingLocataire.typesLogement.tousTypes'),
    t('onboardingLocataire.typesLogement.appartement'),
    t('onboardingLocataire.typesLogement.villa'),
    t('onboardingLocataire.typesLogement.studio'),
    t('onboardingLocataire.typesLogement.chambre'),
    t('onboardingLocataire.typesLogement.maison'),
    t('onboardingLocataire.typesLogement.duplex'),
    t('onboardingLocataire.typesLogement.bureau'),
    t('onboardingLocataire.typesLogement.boutique'),
  ];
  var [step, setStep] = useState(1);
  var [nomComplet, setNomComplet] = useState('');
  var [profession, setProfession] = useState(t('onboardingLocataire.etape1.professionOptions.fonctionnaire'));
  var [budget, setBudget] = useState('2 000 000');
  var [villeTexte, setVilleTexte] = useState('');
  var [typeLogement, setTypeLogement] = useState(t('onboardingLocataire.typesLogement.tousTypes'));
  var [dispo, setDispo] = useState(t('onboardingLocataire.etape2.dispoOptions.immediate'));
  var [equipements, setEquipements] = useState([t('onboardingLocataire.equipements.eauCourante'), t('onboardingLocataire.equipements.wifi')]);
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
          <div className="auth-step-label">{t('onboardingLocataire.etape1.label')}</div>
          <div className="auth-step-title">{t('onboardingLocataire.etape1.titre')}</div>
          <div className="auth-step-desc">{t('onboardingLocataire.etape1.desc')}</div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape1.nomComplet')}</label>
            <input type="text" placeholder={t('onboardingLocataire.etape1.nomCompletPlaceholder')}
              value={nomComplet}
              onChange={function(e) { setNomComplet(e.target.value); }} />
          </div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape1.profession')}</label>
            <select value={profession} onChange={function(e) { setProfession(e.target.value); }}>
              <option>{t('onboardingLocataire.etape1.professionOptions.fonctionnaire')}</option>
              <option>{t('onboardingLocataire.etape1.professionOptions.commercant')}</option>
              <option>{t('onboardingLocataire.etape1.professionOptions.salariePrive')}</option>
              <option>{t('onboardingLocataire.etape1.professionOptions.etudiant')}</option>
              <option>{t('onboardingLocataire.etape1.professionOptions.independant')}</option>
              <option>{t('onboardingLocataire.etape1.professionOptions.autre')}</option>
            </select>
          </div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape1.budgetMensuel')}</label>
            <select value={budget} onChange={function(e) { setBudget(e.target.value); }}>
              <option>500 000</option>
              <option>1 000 000</option>
              <option>2 000 000</option>
              <option>3 000 000</option>
              <option>5 000 000</option>
              <option>{t('onboardingLocataire.etape1.budgetOptions.plusDe5M')}</option>
            </select>
          </div>

          <button className="auth-btn-blue" onClick={function() { setStep(2); }} type="button">
            {t('onboardingLocataire.etape1.continuer')}
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
          <div className="auth-step-label">{t('onboardingLocataire.etape2.label')}</div>
          <div className="auth-step-title">{t('onboardingLocataire.etape2.titre')}</div>
          <div className="auth-step-desc">{t('onboardingLocataire.etape2.desc')}</div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape2.quartierVille')}</label>
            <input
              type="text"
              placeholder={t('onboardingLocataire.etape2.quartierVillePlaceholder')}
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
              {t('onboardingLocataire.etape2.ecrireLibrement')}
            </div>
          </div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape2.typeLogement')}</label>
            <select value={typeLogement} onChange={function(e) { setTypeLogement(e.target.value); }}>
              {TYPES_LOGEMENT.map(function(tl) { return <option key={tl}>{tl}</option>; })}
            </select>
          </div>

          <div className="auth-field">
            <label>{t('onboardingLocataire.etape2.disponibiliteSouhaitee')}</label>
            <select value={dispo} onChange={function(e) { setDispo(e.target.value); }}>
              <option>{t('onboardingLocataire.etape2.dispoOptions.immediate')}</option>
              <option>{t('onboardingLocataire.etape2.dispoOptions.dans1Mois')}</option>
              <option>{t('onboardingLocataire.etape2.dispoOptions.dans3Mois')}</option>
              <option>{t('onboardingLocataire.etape2.dispoOptions.dans6Mois')}</option>
            </select>
          </div>

          <div style={{marginBottom:'14px'}}>
            <div style={{fontSize:'12px', color:'#888', fontWeight:'500', marginBottom:'8px'}}>
              {t('onboardingLocataire.etape2.equipementsSouhaites')}
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
            <button className="auth-btn-outline" onClick={function() { setStep(1); }} type="button">{t('onboardingLocataire.etape2.retour')}</button>
            <button className="auth-btn-blue" onClick={function() { setStep(3); }} type="button">
              {t('onboardingLocataire.etape2.continuer')}
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
      { key: 'cni', titre: t('onboardingLocataire.etape3.docs.cniTitre'), desc: t('onboardingLocataire.etape3.docs.cniDesc'), badge: t('onboardingLocataire.etape3.docs.cniBadge'), accept: 'image/*,.pdf' },
      { key: 'revenus', titre: t('onboardingLocataire.etape3.docs.revenusTitre'), desc: t('onboardingLocataire.etape3.docs.revenusDesc'), badge: null, accept: '.pdf,.doc,.docx,image/*' },
      { key: 'garant', titre: t('onboardingLocataire.etape3.docs.garantTitre'), desc: t('onboardingLocataire.etape3.docs.garantDesc'), badge: null, accept: 'image/*,.pdf' }
    ];
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Stepper />
          <div className="auth-step-label">{t('onboardingLocataire.etape3.label')}</div>
          <div className="auth-step-title">{t('onboardingLocataire.etape3.titre')}</div>
          <div className="auth-step-desc">{t('onboardingLocataire.etape3.desc')}</div>

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
                          {uploaded ? t('onboardingLocataire.etape3.changer') : t('onboardingLocataire.etape3.cliquerPourAjouter')}
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
              {t('onboardingLocataire.etape3.chargement')}
            </div>
          )}

          <div className="auth-btn-row">
            <button className="auth-btn-outline" onClick={function() { setStep(2); }} type="button">{t('onboardingLocataire.etape3.retour')}</button>
            <button className="auth-btn-blue" onClick={function() { setStep(4); }} type="button">
              {t('onboardingLocataire.etape3.terminer')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <p className="auth-link-text" style={{cursor:'pointer'}} onClick={function() { setStep(4); }}>
            {t('onboardingLocataire.etape3.ignorerEtape')}
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
            {t('onboardingLocataire.etape4.titre')}
          </div>
          <div style={{fontSize:'12px', color:'#888', marginBottom:'20px', lineHeight:'1.6'}}>
            {t('onboardingLocataire.etape4.descConfigure')}
            {villeTexte && t('onboardingLocataire.etape4.descLogementsA', { ville: villeTexte })}
          </div>
          <div className="auth-quick-grid">
            <div className="auth-quick-action" onClick={function() { navigate('/logements'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">{t('onboardingLocataire.etape4.voirLesLogements')}</div>
            </div>
            <div className="auth-quick-action" onClick={function() { navigate('/dashboard'); }}>
              <div className="auth-quick-action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div className="auth-quick-action-label">{t('onboardingLocataire.etape4.monTableauDeBord')}</div>
            </div>
          </div>
          <button className="auth-btn-blue" onClick={function() { navigate('/logements'); }} type="button">
            {t('onboardingLocataire.etape4.rechercherDesLogements')}
          </button>
        </div>
      </div>
    </div>
  );
}