import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Home, ChevronRight } from 'lucide-react';
import './CommentCaMarche.css';

// Durée d'affichage de chaque étape avant de passer à la suivante (ms).
var DUREE_ETAPE = 6000;
var PREFIX = 'landingPage.howItWorks.';

var SIGNATURE_PATH = 'M4 32 C 14 6, 22 4, 24 22 S 32 36, 42 18 S 54 6, 58 24 S 68 36, 80 16 C 86 8, 94 12, 90 24 S 104 36, 124 14';

function Coche() {
  return <Check className="ic" size={13} aria-hidden="true" />;
}

function Signature(props) {
  return (
    <div className="ccm-sig a" style={{ '--i': props.i }}>
      <svg viewBox="0 0 130 44" aria-hidden="true"><path d={SIGNATURE_PATH} /></svg>
      <span className="ccm-stamp">{props.signe}</span>
    </div>
  );
}

function Fenetre(props) {
  return (
    <div className="ccm-win">
      <div className="ccm-win-h"><b>{props.titre}</b><span className="ccm-ex">{props.exemple}</span></div>
      {props.children}
    </div>
  );
}

function Ligne(props) {
  return <div className="ccm-fld a" style={{ '--i': props.i }}><span>{props.label}</span><b>{props.val}</b></div>;
}

function Ok(props) {
  return <span className="ccm-ok a" style={{ '--i': props.i }}><Coche />{props.children}</span>;
}

function Case(props) {
  return <div className="ccm-tick t" style={{ '--i': props.i }}><i><Check className="ic" size={12} aria-hidden="true" /></i><span>{props.children}</span></div>;
}

// Contenu (illustratif) de l'écran de chaque étape. Les noms et montants sont des exemples.
function ecran(role, etape, t) {
  var P = PREFIX + 'panels.' + role + '.p' + etape + '.';
  var ex = t(PREFIX + 'exemple');
  if (role === 'owner') {
    if (etape === 0) {
      return (
        <Fenetre titre={t(P + 'titre')} exemple={ex}>
          <div className="ccm-photo a" style={{ '--i': 0 }}><Home className="ic" size={34} aria-hidden="true" /></div>
          <Ligne i={1} label={t(P + 'champTitre')} val={t(P + 'valTitre')} />
          <Ligne i={2} label={t(P + 'champLoyer')} val={t(P + 'valLoyer')} />
          <Ligne i={3} label={t(P + 'champCaution')} val={t(P + 'valCaution')} />
          <Ok i={4}>{t(P + 'ok')}</Ok>
        </Fenetre>
      );
    }
    if (etape === 1) {
      return (
        <Fenetre titre={t(P + 'titre')} exemple={ex}>
          <div className="ccm-person a" style={{ '--i': 0 }}><span className="ccm-av">MD</span><div>Mamadou D.<small>{t(P + 'complet')}</small></div><span className="ccm-acc go">{t(P + 'accepter')}</span></div>
          <div className="ccm-person a" style={{ '--i': 1 }}><span className="ccm-av b">AB</span><div>Aïssatou B.<small>{t(P + 'complet')}</small></div><span className="ccm-acc">{t(P + 'voir')}</span></div>
          <div className="ccm-person a" style={{ '--i': 2 }}><span className="ccm-av c">IS</span><div>Ibrahima S.<small>{t(P + 'incomplet')}</small></div><span className="ccm-acc">{t(P + 'voir')}</span></div>
        </Fenetre>
      );
    }
    return (
      <Fenetre titre={t(P + 'titre')} exemple={ex}>
        <Ligne i={0} label={t(P + 'bailleur')} val="Aïssatou Barry" />
        <Ligne i={1} label={t(P + 'locataire')} val="Mamadou Diallo" />
        <Signature i={2} signe={t(P + 'signe')} />
        <Ok i={5}>{t(P + 'ok')}</Ok>
      </Fenetre>
    );
  }
  if (etape === 0) {
    return (
      <Fenetre titre={t(P + 'titre')} exemple={ex}>
        <div className="ccm-chips-f a" style={{ '--i': 0 }}><span className="s">Conakry</span><span>≤ 2 000 000</span><span>F3</span></div>
        <div className="ccm-res a" style={{ '--i': 1 }}><div className="th" /><div>{t(P + 'appart')}<small>Kipé</small></div><b className="pr">1 850 000</b></div>
        <div className="ccm-res a" style={{ '--i': 2 }}><div className="th" /><div>{t(P + 'studio')}<small>Ratoma</small></div><b className="pr">950 000</b></div>
        <div className="ccm-res a" style={{ '--i': 3 }}><div className="th" /><div>{t(P + 'villa')}<small>Lambanyi</small></div><b className="pr">3 200 000</b></div>
      </Fenetre>
    );
  }
  if (etape === 1) {
    return (
      <Fenetre titre={t(P + 'titre')} exemple={ex}>
        <Case i={0}>{t(P + 'identite')}</Case>
        <Case i={1}>{t(P + 'revenus')}</Case>
        <Case i={2}>{t(P + 'message')}</Case>
        <Ok i={6}>{t(P + 'ok')}</Ok>
      </Fenetre>
    );
  }
  return (
    <Fenetre titre={t(P + 'titre')} exemple={ex}>
      <Case i={0}>{t(P + 'murs')}</Case>
      <Case i={1}>{t(P + 'cuisine')}</Case>
      <Signature i={2} signe={t(P + 'signe')} />
      <Ok i={5}>{t(P + 'ok')}</Ok>
    </Fenetre>
  );
}

export default function CommentCaMarche() {
  var t = useTranslation('public').t;
  var navigate = useNavigate();
  var [profil, setProfil] = useState(0);        // 0 propriétaire, 1 locataire
  var [etape, setEtape] = useState(0);
  var [fige, setFige] = useState(false);        // l'utilisateur a choisi une étape : plus de défilement automatique
  var [survol, setSurvol] = useState(false);
  var [visible, setVisible] = useState(false);
  var racine = useRef(null);

  var reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var role = profil === 0 ? 'owner' : 'tenant';
  var auto = !reduit && !fige && !survol && visible;

  // Le défilement n'avance que lorsque la section est à l'écran.
  useEffect(function() {
    var el = racine.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    var io = new IntersectionObserver(function(entries) { setVisible(entries[0].isIntersecting); }, { threshold: 0.3 });
    io.observe(el);
    return function() { io.disconnect(); };
  }, []);

  useEffect(function() {
    if (!auto) return;
    var id = setTimeout(function() { setEtape(function(e) { return (e + 1) % 3; }); }, DUREE_ETAPE);
    return function() { clearTimeout(id); };
  }, [auto, etape, profil]);

  function changerProfil(p) { setProfil(p); setEtape(0); setFige(false); }
  function choisirEtape(i) { setEtape(i); setFige(true); }

  return (
    <div className="ccm" ref={racine}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="ccm-seg" data-on={profil} role="tablist" aria-label={t(PREFIX + 'profilAria')}>
          <button role="tab" aria-selected={profil === 0} onClick={function() { changerProfil(0); }}>{t(PREFIX + 'tabProprio')}</button>
          <button role="tab" aria-selected={profil === 1} onClick={function() { changerProfil(1); }}>{t(PREFIX + 'tabLocataire')}</button>
        </div>
      </div>

      <div className="ccm-split">
        <div className="ccm-steps" role="tablist" aria-label={t(PREFIX + 'etapesAria')}
          onMouseEnter={function() { setSurvol(true); }} onMouseLeave={function() { setSurvol(false); }}>
          {[0, 1, 2].map(function(i) {
            var actif = etape === i;
            return (
              <button key={role + i} className="ccm-step" role="tab" aria-selected={actif} onClick={function() { choisirEtape(i); }}>
                <span className="ccm-n">{i + 1}</span>
                <span>
                  <b>{t('landingPage.steps.' + role + '.' + i + '.titre')}</b>
                  <span className="ccm-d">{t('landingPage.steps.' + role + '.' + i + '.desc')}</span>
                  <span className="ccm-more"><span>
                    <span className="ccm-chip">{t(PREFIX + 'chips.' + role + '.' + i + '.0')}</span>
                    {t(PREFIX + 'chips.' + role + '.' + i + '.1') ? <span className="ccm-chip g">{t(PREFIX + 'chips.' + role + '.' + i + '.1')}</span> : null}
                  </span></span>
                </span>
                <span key={role + etape + (auto ? 'a' : 'p')} className={'ccm-prog' + (actif && auto ? ' run' : '')} style={{ '--ccm-dur': DUREE_ETAPE + 'ms' }} />
              </button>
            );
          })}
        </div>

        <div className="ccm-screen" aria-live="polite">
          {[0, 1, 2].map(function(i) {
            return <div key={role + i} className={'ccm-panel' + (etape === i ? ' on' : '')} aria-hidden={etape !== i}>{ecran(role, i, t)}</div>;
          })}
        </div>
      </div>

      <div className="ccm-cta">
        <button onClick={function() { navigate(profil === 0 ? '/inscription' : '/logements'); }}>
          {profil === 0 ? t(PREFIX + 'ctaProprio') : t(PREFIX + 'ctaLocataire')} <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
