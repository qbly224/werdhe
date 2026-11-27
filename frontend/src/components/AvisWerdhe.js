import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Pin, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AvisWerdhe.css';

var MIN = 10;
var MAX = 1000;

function Etoiles(props) {
  var n = props.note;
  return (
    <span className="avw-stars" role="img" aria-label={props.label}>
      {[1, 2, 3, 4, 5].map(function(i) {
        return <Star key={i} size={props.size || 14} strokeWidth={1.5} fill={i <= Math.round(n) ? '#F5A623' : 'none'} color="#F5A623" aria-hidden="true" />;
      })}
    </span>
  );
}

// Fenêtre « Donner mon avis » : un seul avis par compte, modifiable.
function FormulaireAvis(props) {
  var t = useTranslation('public').t;
  var P = 'avisWerdhe.form.';
  var { user } = useAuth();
  var [existant, setExistant] = useState(null);
  var [charge, setCharge] = useState(false);
  var [note, setNote] = useState(0);
  var [texte, setTexte] = useState('');
  var [envoi, setEnvoi] = useState(false);
  var [erreur, setErreur] = useState('');
  var zoneRef = useRef(null);
  var fermerRef = useRef(props.onClose);
  fermerRef.current = props.onClose;

  useEffect(function() {
    function surTouche(e) { if (e.key === 'Escape') fermerRef.current(); }
    document.addEventListener('keydown', surTouche);
    if (zoneRef.current) zoneRef.current.focus();
    return function() { document.removeEventListener('keydown', surTouche); };
  }, []);

  useEffect(function() {
    if (!user || user.role === 'admin') { setCharge(true); return; }
    var annule = false;
    api.get('/avis/mon-avis').then(function(res) {
      if (annule) return;
      var a = res.data.avis;
      setExistant(a);
      if (a) { setNote(a.note); setTexte(a.texte); }
    }).catch(function() {}).finally(function() { if (!annule) setCharge(true); });
    return function() { annule = true; };
  }, [user]);

  function envoyer(e) {
    e.preventDefault();
    setErreur('');
    if (note < 1) return setErreur(t(P + 'erreurNote'));
    if (texte.trim().length < MIN) return setErreur(t(P + 'erreurTexte', { min: MIN }));
    setEnvoi(true);
    api.post('/avis', { note: note, texte: texte.trim() })
      .then(function(res) {
        setExistant(res.data.avis);
        toast.success(t(P + 'toastEnvoye'));
        props.onClose();
      })
      .catch(function(err) { setErreur((err.response && err.response.data && err.response.data.erreur) || t(P + 'erreurGenerique')); })
      .finally(function() { setEnvoi(false); });
  }

  function retirer() {
    if (!window.confirm(t(P + 'confirmRetrait'))) return;
    api.delete('/avis/mon-avis')
      .then(function() { toast.success(t(P + 'toastRetire')); props.onClose(); })
      .catch(function() { setErreur(t(P + 'erreurGenerique')); });
  }

  var statut = existant ? existant.statut : null;

  return (
    <div className="avw-overlay" onMouseDown={function(e) { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="avw-dialog" role="dialog" aria-modal="true" aria-labelledby="avw-titre" ref={zoneRef} tabIndex={-1}>
        <button type="button" className="avw-close" onClick={props.onClose} aria-label={t(P + 'fermer')}><X size={18} strokeWidth={2} /></button>
        <h3 id="avw-titre">{t(P + 'titre')}</h3>

        {!user && (
          <div>
            <p className="avw-muted">{t(P + 'connexionRequise')}</p>
            <div className="avw-actions">
              <Link to="/login" className="ds-btn ds-btn--primary">{t(P + 'seConnecter')}</Link>
              <Link to="/inscription" className="ds-btn ds-btn--secondary">{t(P + 'creerCompte')}</Link>
            </div>
          </div>
        )}

        {user && user.role === 'admin' && <p className="avw-muted">{t(P + 'adminNonConcerne')}</p>}

        {user && user.role !== 'admin' && charge && (
          <form onSubmit={envoyer} noValidate>
            {statut && (
              <p className={'avw-statut avw-statut--' + statut}>{t(P + 'statut.' + statut)}</p>
            )}
            <p className="avw-muted">{t(P + 'intro')}</p>

            <div className="avw-label" id="avw-note-label">{t(P + 'votreNote')}</div>
            <div className="avw-picker" role="radiogroup" aria-labelledby="avw-note-label">
              {[1, 2, 3, 4, 5].map(function(i) {
                return (
                  <button key={i} type="button" role="radio" aria-checked={note === i}
                    aria-label={t(P + 'etoiles', { count: i })}
                    className={'avw-pick' + (i <= note ? ' on' : '')} onClick={function() { setNote(i); }}>
                    <Star size={28} strokeWidth={1.5} fill={i <= note ? '#F5A623' : 'none'} color="#F5A623" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <label className="avw-label" htmlFor="avw-texte">{t(P + 'votreAvis')}</label>
            <textarea id="avw-texte" className="ds-input" rows={5} maxLength={MAX} value={texte}
              placeholder={t(P + 'placeholder')} onChange={function(e) { setTexte(e.target.value); }} />
            <div className="avw-count">{texte.length}/{MAX}</div>

            <p className="avw-muted avw-note">{t(P + 'moderation')}</p>
            {erreur && <p className="avw-erreur" role="alert">{erreur}</p>}

            <div className="avw-actions">
              <button type="submit" className="ds-btn ds-btn--primary" disabled={envoi}>{existant ? t(P + 'modifier') : t(P + 'publier')}</button>
              {existant && <button type="button" className="ds-btn ds-btn--ghost" onClick={retirer}>{t(P + 'retirer')}</button>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Section « Avis » de l'accueil : vrais avis approuvés (épinglés d'abord), puis les témoignages
// statiques conservés. Le bouton ouvre le formulaire (compte requis).
export default function AvisWerdhe(props) {
  var t = useTranslation('public').t;
  var tr = useTranslation('public');
  var P = 'avisWerdhe.';
  var [donnees, setDonnees] = useState({ total: 0, moyenne: null, avis: [] });
  var [ouvert, setOuvert] = useState(false);

  var charger = useCallback(function() {
    api.get('/avis/public').then(function(res) {
      var d = res.data || {};
      setDonnees({ total: Number(d.total) || 0, moyenne: d.moyenne || null, avis: Array.isArray(d.avis) ? d.avis : [] });
    }).catch(function() { /* section statique seule */ });
  }, []);
  useEffect(function() { charger(); }, [charger]);

  function fermer() { setOuvert(false); charger(); }

  var locale = tr.i18n.language === 'en' ? 'en-GB' : 'fr-FR';
  var statiques = props.temoignages || [];

  return (
    <section id="avis" className="avw-section">
      <div className="avw-wrap">
        <div className="avw-head">
          <div className="ds-eyebrow">{t('landingPage.testimonialsSection.overline')}</div>
          <h2 className="ds-title">{t('landingPage.testimonialsSection.title')}</h2>

          {donnees.total > 0 && (
            <div className="avw-resume">
              <span className="avw-moy">{String(donnees.moyenne).replace('.', tr.i18n.language === 'en' ? '.' : ',')}</span>
              <Etoiles note={donnees.moyenne} size={18} label={t(P + 'noteMoyenne', { note: donnees.moyenne })} />
              <span className="avw-muted">{t(P + 'nbAvis', { count: donnees.total })}</span>
            </div>
          )}

          <button type="button" className="ds-btn ds-btn--secondary" onClick={function() { setOuvert(true); }}>
            <MessageSquare size={16} strokeWidth={2} aria-hidden="true" /> {t(P + 'donnerAvis')}
          </button>
        </div>

        <div className="avw-grid">
          {donnees.avis.map(function(a) {
            return (
              <article key={a.id} className={'avw-card' + (a.epingle ? ' avw-card--pin' : '')}>
                {a.epingle && <span className="avw-pin"><Pin size={12} strokeWidth={2} aria-hidden="true" /> {t(P + 'epingle')}</span>}
                <Etoiles note={a.note} label={t(P + 'etoilesSur5', { count: a.note })} />
                <p className="avw-texte">« {a.texte} »</p>
                <div className="avw-auteur">
                  <span className="avw-avatar" aria-hidden="true">{a.auteur.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="avw-nom">{a.auteur}</div>
                    <div className="avw-meta">{t(P + 'roles.' + a.role)} · {new Date(a.created_at).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                {a.reponse && (
                  <div className="avw-reponse">
                    <b>{t(P + 'reponseWerdhe')}</b>
                    <p>{a.reponse}</p>
                  </div>
                )}
              </article>
            );
          })}

          {statiques.map(function(s, i) {
            return (
              <article key={'s' + i} className="avw-card">
                <Etoiles note={5} label={t(P + 'etoilesSur5', { count: 5 })} />
                <p className="avw-texte">« {s.texte} »</p>
                <div className="avw-auteur">
                  <span className="avw-avatar" aria-hidden="true">{s.initiales}</span>
                  <div>
                    <div className="avw-nom">{s.nom}</div>
                    <div className="avw-meta">{s.role}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {ouvert && <FormulaireAvis onClose={fermer} />}
    </section>
  );
}
