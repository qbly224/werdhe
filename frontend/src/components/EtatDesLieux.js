/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Camera, ClipboardCheck, PenLine, Lock, Trash2, AlertTriangle, Download, Plus, Send } from 'lucide-react';

// ================================================
// ÉTAT DES LIEUX : parcours complet
//   brouillon → envoyé et signé par le rédacteur → signé par l'autre partie
//   → document généré et verrouillé.
// Chaque signature est posée par la personne connectée, depuis son compte.
// ================================================

var ETATS = ['neuf', 'bon', 'use', 'mauvais'];
var COULEURS = { neuf: '#2E7D32', bon: '#1565C0', use: '#E65100', mauvais: '#B71C1C' };
var LIM = { obs: 40, obsGen: 160, reserves: 160, piece: 18, element: 22, lignes: 20, photos: 12 };

function erreurServeur(err, defaut) {
  return err && err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : defaut;
}

// ─── SIGNATURE : dessinée ou nom tapé ─────────────────────────────
function SignatureForm({ titre, nomCompte, onValider, onAnnuler, envoi, libelleBouton }) {
  var t = useTranslation('dashboard').t;
  var canvasRef = useRef(null);
  var [mode, setMode] = useState('dessin');
  var [nom, setNom] = useState(nomCompte || '');
  var [accepte, setAccepte] = useState(false);
  var [trace, setTrace] = useState(false);
  var dessine = useRef(false);
  var dernier = useRef({ x: 0, y: 0 });

  function pos(e) {
    var c = canvasRef.current, r = c.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * (c.width / r.width), y: (p.clientY - r.top) * (c.height / r.height) };
  }
  function debut(e) { e.preventDefault(); dessine.current = true; dernier.current = pos(e); }
  function mouvement(e) {
    if (!dessine.current) return;
    e.preventDefault();
    var c = canvasRef.current, ctx = c.getContext('2d'), p = pos(e);
    ctx.beginPath(); ctx.moveTo(dernier.current.x, dernier.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#1B3F8F'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    dernier.current = p; setTrace(true);
  }
  function fin() { dessine.current = false; }
  function effacer() {
    var c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setTrace(false);
  }

  var pret = accepte && (mode === 'dessin' ? trace : nom.trim().length >= 3);

  function valider() {
    if (!pret) return;
    var signature = { mode: mode, accepte: true };
    if (mode === 'dessin') signature.image = canvasRef.current.toDataURL('image/png');
    else signature.nom = nom.trim();
    onValider(signature);
  }

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #E0E0E0' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><PenLine size={15} strokeWidth={1.75} /> {titre}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['dessin', 'texte'].map(function(m) {
          return (
            <button key={m} type="button" onClick={function() { setMode(m); }}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: mode === m ? '2px solid #1B6B3A' : '1px solid #E0E0E0', background: mode === m ? '#E8F5E9' : '#FAFAFA', color: mode === m ? '#1B5E20' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t('edl.signature.' + m)}
            </button>
          );
        })}
      </div>
      {mode === 'dessin' ? (
        <div>
          <div style={{ border: '1.5px dashed #1B6B3A', borderRadius: 10, background: '#FAFAFA', touchAction: 'none', position: 'relative' }}>
            <canvas ref={canvasRef} width={400} height={120}
              style={{ width: '100%', height: 120, display: 'block', cursor: 'crosshair', borderRadius: 10 }}
              onMouseDown={debut} onMouseMove={mouvement} onMouseUp={fin} onMouseLeave={fin}
              onTouchStart={debut} onTouchMove={mouvement} onTouchEnd={fin} />
            {!trace && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#bbb', fontSize: 13, pointerEvents: 'none' }}>{t('edl.signature.signezIci')}</div>}
          </div>
          <button type="button" onClick={effacer} style={{ marginTop: 6, background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer' }}>{t('edl.signature.effacer')}</button>
        </div>
      ) : (
        <div>
          <input type="text" value={nom} maxLength={80} onChange={function(e) { setNom(e.target.value); }} placeholder={t('edl.signature.nomPlaceholder')}
            style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 15, boxSizing: 'border-box', fontFamily: 'Georgia, serif', fontStyle: 'italic' }} />
        </div>
      )}
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '14px 0', fontSize: 13, color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={accepte} onChange={function(e) { setAccepte(e.target.checked); }} style={{ marginTop: 3 }} />
        <span>{t('edl.signature.luEtApprouve')}</span>
      </label>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>{t('edl.signature.preuve')}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onAnnuler} disabled={envoi} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#F0F0F0', color: '#555', fontSize: 13, cursor: 'pointer' }}>{t('edl.annuler')}</button>
        <button type="button" onClick={valider} disabled={!pret || envoi}
          style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: pret && !envoi ? '#1B6B3A' : '#CCC', color: '#fff', fontSize: 14, fontWeight: 700, cursor: pret && !envoi ? 'pointer' : 'not-allowed' }}>
          {envoi ? t('edl.enCours') : libelleBouton}
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────
export default function EtatDesLieux({ reservationId, onTermine, onFermer }) {
  var t = useTranslation('dashboard').t;
  var [liste, setListe] = useState(null);
  var [courant, setCourant] = useState(null);
  var [local, setLocal] = useState(null);       // modifications en cours (brouillon)
  var [sale, setSale] = useState(false);
  var [charge, setCharge] = useState(true);
  var [action, setAction] = useState(false);
  var [modal, setModal] = useState(null);        // 'envoyer' | 'signer' | 'corriger' | 'generer'
  var [reserves, setReserves] = useState('');
  var [motif, setMotif] = useState('');
  var [nouvelle, setNouvelle] = useState({ piece: '', element: '' });
  var [photoPour, setPhotoPour] = useState(null);
  var fichierRef = useRef(null);

  function chargerListe() {
    return api.get('/etats-des-lieux/reservation/' + reservationId)
      .then(function(res) { setListe(res.data); })
      .catch(function(err) { toast.error(erreurServeur(err, t('edl.erreurChargement'))); })
      .finally(function() { setCharge(false); });
  }

  useEffect(function() { chargerListe(); }, [reservationId]);

  function appliquer(etat) {
    setCourant(etat);
    setLocal(etat.droits.modifier ? { grille: etat.grille.map(function(x) { return Object.assign({}, x); }), releves: Object.assign({ eau: '', electricite: '', cles: '', badge: '' }, etat.releves), obs: etat.observations_generales || '' } : null);
    setSale(false);
    setModal(null);
  }

  function ouvrir(id) {
    api.get('/etats-des-lieux/' + id)
      .then(function(res) { appliquer(res.data.etat); })
      .catch(function(err) { toast.error(erreurServeur(err, t('edl.erreurChargement'))); });
  }

  function creer(type) {
    setAction(true);
    api.post('/etats-des-lieux', { reservation_id: reservationId, type: type })
      .then(function(res) { appliquer(res.data.etat); })
      .catch(function(err) {
        toast.error(erreurServeur(err, t('edl.erreur')));
        if (err.response && err.response.data && err.response.data.id) ouvrir(err.response.data.id);
      })
      .finally(function() { setAction(false); });
  }

  function retourListe() {
    setCourant(null); setLocal(null); setSale(false); setModal(null); setReserves(''); setMotif('');
    chargerListe();
  }

  function corpsSauvegarde() {
    return {
      version: courant.version,
      grille: local.grille.map(function(x) { return { id: x.id, etat: x.etat || '', obs: x.obs || '', piece: x.piece, element: x.element }; }),
      releves: local.releves,
      observations_generales: local.obs
    };
  }

  function enregistrer(silencieux) {
    if (!courant || !local) return Promise.resolve(courant);
    return api.put('/etats-des-lieux/' + courant.id, corpsSauvegarde())
      .then(function(res) { appliquer(res.data.etat); if (!silencieux) toast.success(t('edl.brouillonEnregistre')); return res.data.etat; });
  }

  function lancer(fn) {
    setAction(true);
    return fn()
      .catch(function(err) { toast.error(erreurServeur(err, t('edl.erreur'))); })
      .finally(function() { setAction(false); });
  }

  function envoyer(signature) {
    lancer(function() {
      return (sale ? enregistrer(true) : Promise.resolve(courant)).then(function(etat) {
        return api.post('/etats-des-lieux/' + etat.id + '/envoyer', { signature: signature });
      }).then(function(res) { appliquer(res.data.etat); toast.success(t('edl.toastEnvoye')); });
    });
  }

  function retirer() { lancer(function() { return api.post('/etats-des-lieux/' + courant.id + '/retirer').then(function(res) { appliquer(res.data.etat); }); }); }

  function corriger() {
    lancer(function() {
      return api.post('/etats-des-lieux/' + courant.id + '/corriger', { motif: motif }).then(function(res) { appliquer(res.data.etat); setMotif(''); toast.success(t('edl.toastCorrection')); });
    });
  }

  function signer(signature) {
    lancer(function() {
      return api.post('/etats-des-lieux/' + courant.id + '/signer', { signature: signature, reserves: reserves }).then(function(res) { appliquer(res.data.etat); toast.success(t('edl.toastSigne')); });
    });
  }

  function generer() {
    lancer(function() {
      return api.post('/etats-des-lieux/' + courant.id + '/generer').then(function(res) {
        appliquer(res.data.etat); toast.success(t('edl.toastGenere'));
        if (onTermine) onTermine(res.data.etat);
      });
    });
  }

  function abandonner() {
    lancer(function() { return api.post('/etats-des-lieux/' + courant.id + '/annuler').then(function() { toast.success(t('edl.toastAbandonne')); retourListe(); }); });
  }

  function telecharger() {
    api.get('/documents/' + courant.document_id + '/telecharger?format=pdf', { responseType: 'blob' })
      .then(function(r) {
        var pdf = (r.headers && r.headers['content-type'] || '').indexOf('pdf') !== -1;
        var url = window.URL.createObjectURL(new Blob([r.data], { type: pdf ? 'application/pdf' : 'text/html; charset=utf-8' }));
        var a = document.createElement('a'); a.href = url; a.download = 'Etat_des_lieux_' + courant.type + (pdf ? '.pdf' : '.html');
        document.body.appendChild(a); a.click(); a.remove();
      }).catch(function() { toast.error(t('edl.erreurTelechargement')); });
  }

  function televerserPhoto(fichier) {
    if (!fichier) return;
    var fd = new FormData();
    fd.append('photo', fichier);
    if (photoPour) fd.append('item_id', photoPour);
    var avant = sale ? enregistrer(true) : Promise.resolve(courant);
    lancer(function() {
      return avant.then(function() {
        return api.post('/etats-des-lieux/' + courant.id + '/photos', fd, { headers: { 'Content-Type': undefined } });
      }).then(function(res) { appliquer(res.data.etat); toast.success(t('edl.photoAjoutee')); });
    });
  }

  function supprimerPhoto(photoId) {
    lancer(function() { return api.delete('/etats-des-lieux/' + courant.id + '/photos/' + photoId).then(function(res) { appliquer(res.data.etat); }); });
  }

  function maj(fn) { setLocal(function(l) { return fn(l); }); setSale(true); }
  function majLigne(id, champ, valeur) { maj(function(l) { return Object.assign({}, l, { grille: l.grille.map(function(x) { return x.id === id ? Object.assign({}, x, { [champ]: valeur }) : x; }) }); }); }

  function ajouterLigne() {
    var piece = nouvelle.piece.trim(), element = nouvelle.element.trim();
    if (!piece || !element) { toast.error(t('edl.ligneIncomplete')); return; }
    if (local.grille.length >= LIM.lignes) { toast.error(t('edl.tropDeLignes', { n: LIM.lignes })); return; }
    var id = 'perso-' + Math.random().toString(36).slice(2, 10);
    maj(function(l) { return Object.assign({}, l, { grille: l.grille.concat([{ id: id, piece: piece, element: element, etat: '', obs: '', perso: true }]) }); });
    setNouvelle({ piece: '', element: '' });
  }
  function retirerLigne(id) { maj(function(l) { return Object.assign({}, l, { grille: l.grille.filter(function(x) { return x.id !== id; }) }); }); }

  // ── Présentation ──
  if (charge) return <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>{t('edl.chargement')}</div>;

  var carte = { background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };

  // ── Liste (entrée / sortie) ──
  if (!courant) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardCheck size={15} strokeWidth={1.75} /> {t('edl.titre')}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 }}>{liste && liste.logement ? liste.logement.titre : ''}</div>
          </div>
          {onFermer && <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>{t('edl.fermer')}</button>}
        </div>
        <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#7B4F00' }}>{t('edl.explication')}</div>
        {['entree', 'sortie'].map(function(type) {
          var etat = liste && liste.etats.find(function(x) { return x.type === type; });
          var peut = liste && liste.peut_creer[type];
          return (
            <div key={type} style={carte}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('edl.type.' + type)}</div>
              {etat ? (
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                    <span style={{ background: etat.statut === 'genere' ? '#E8F5E9' : '#FFF3E0', color: etat.statut === 'genere' ? '#1B5E20' : '#8A4F05', borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 11 }}>{t('edl.statut.' + etat.statut)}</span>
                    {' '}{etat.droits.signer ? <b style={{ color: '#B3261E' }}>{t('edl.aVousDeSigner')}</b> : null}
                  </div>
                  <button onClick={function() { ouvrir(etat.id); }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {etat.statut === 'genere' ? t('edl.consulter') : t('edl.continuer')}
                  </button>
                </div>
              ) : peut ? (
                <button onClick={function() { creer(type); }} disabled={action} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} strokeWidth={2} /> {t('edl.commencer.' + type)}</span>
                </button>
              ) : (
                <div style={{ fontSize: 12, color: '#999' }}>{t('edl.indisponible.' + type)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Détail d'un état des lieux ──
  var e = courant, d = e.droits, edition = d.modifier && local;
  var grille = edition ? local.grille : e.grille;
  var photos = e.photos || [];
  var nomCompte = e.ma_role === 'proprietaire' ? '' : '';
  var tousRenseignes = grille.length > 0 && grille.every(function(x) { return ETATS.indexOf(x.etat) !== -1; });

  function pastille(st) {
    var couleurs = { brouillon: ['#FFF3E0', '#8A4F05'], a_valider: ['#E3F2FD', '#0D47A1'], signe: ['#E8F5E9', '#1B5E20'], genere: ['#ECEFF1', '#37474F'] };
    var c = couleurs[st] || couleurs.brouillon;
    return <span style={{ background: c[0], color: c[1], borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 11 }}>{st === 'genere' ? <Lock size={10} strokeWidth={2.2} style={{ verticalAlign: -1, marginRight: 4 }} /> : null}{t('edl.statut.' + st)}</span>;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: e.type === 'sortie' ? '#C62828' : '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardCheck size={15} strokeWidth={1.75} /> {t('edl.type.' + e.type)}</div>
          <button onClick={retourListe} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>← {t('edl.retour')}</button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>{e.logement.titre} · {t('edl.redigePar', { nom: e.redacteur.nom })}</div>
      </div>

      <div style={{ marginBottom: 12 }}>{pastille(e.statut)}</div>

      {/* Message d'étape */}
      {e.statut === 'brouillon' && !d.modifier && <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0D47A1' }}>{t('edl.msg.brouillonAutre', { nom: e.redacteur.nom })}</div>}
      {e.statut === 'brouillon' && e.corrections.length > 0 && (
        <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B71C1C' }}>
          <b>{t('edl.msg.correctionDemandee')}</b> {e.corrections[e.corrections.length - 1].motif}
        </div>
      )}
      {e.statut === 'a_valider' && d.signer && <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#7B4F00' }}>{t('edl.msg.aSigner', { nom: e.redacteur.nom })}</div>}
      {e.statut === 'a_valider' && d.retirer && <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0D47A1' }}>{t('edl.msg.attenteAutre', { nom: e.autre_partie.nom })}</div>}
      {e.statut === 'signe' && d.generer && <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#1B5E20' }}>{t('edl.msg.pretAGenerer')}</div>}
      {e.statut === 'signe' && !d.generer && <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#1B5E20' }}>{t('edl.msg.attenteGeneration', { nom: e.redacteur.nom })}</div>}
      {e.statut === 'genere' && <div style={{ background: '#ECEFF1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#37474F' }}>{t('edl.msg.genere')}</div>}

      {/* Grille */}
      {grille.map(function(it) {
        var degrade = e.degradations.indexOf(it.id) !== -1;
        var photosLigne = photos.filter(function(p) { return p.item_id === it.id; });
        return (
          <div key={it.id} style={{ background: degrade ? '#FFF3E0' : '#fff', borderRadius: 12, padding: 12, marginBottom: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid ' + (ETATS.indexOf(it.etat) !== -1 ? COULEURS[it.etat] : '#E0E0E0') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22' }}>{it.piece} · {it.element}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.entree && <span style={{ fontSize: 11, color: '#666' }}>{t('edl.entreeLabel')} : <b>{t('edl.etat.' + it.entree)}</b>{degrade ? <span style={{ color: '#E65100', marginLeft: 4 }}>▼</span> : null}</span>}
                {edition && it.perso && <button onClick={function() { retirerLigne(it.id); }} title={t('edl.retirerLigne')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B3261E' }}><Trash2 size={14} strokeWidth={1.75} /></button>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
              {ETATS.map(function(k) {
                var actif = it.etat === k;
                return (
                  <button key={k} disabled={!edition} onClick={function() { majLigne(it.id, 'etat', k); }}
                    style={{ padding: '8px 2px', borderRadius: 8, border: actif ? '2px solid ' + COULEURS[k] : '1px solid #E0E0E0', background: actif ? COULEURS[k] + '1F' : '#FAFAFA', color: actif ? COULEURS[k] : '#666', fontSize: 12, fontWeight: actif ? 800 : 500, cursor: edition ? 'pointer' : 'default' }}>
                    {t('edl.etat.' + k)}
                  </button>
                );
              })}
            </div>
            {edition ? (
              <input type="text" maxLength={LIM.obs} value={it.obs || ''} onChange={function(ev) { majLigne(it.id, 'obs', ev.target.value); }} placeholder={t('edl.observationPlaceholder')}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 12, boxSizing: 'border-box' }} />
            ) : (it.obs ? <div style={{ fontSize: 12, color: '#444' }}>{it.obs}</div> : null)}
            {(photosLigne.length > 0 || edition) && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                {photosLigne.map(function(p) {
                  return (
                    <span key={p.id} style={{ position: 'relative' }}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', display: 'block' }} /></a>
                      {edition && <button onClick={function() { supprimerPhoto(p.id); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#B3261E', color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: '18px', padding: 0 }}>×</button>}
                    </span>
                  );
                })}
                {edition && photos.length < LIM.photos && (
                  <button onClick={function() { setPhotoPour(it.id); setTimeout(function() { fichierRef.current && fichierRef.current.click(); }, 0); }}
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1px dashed #B0BEC5', background: '#FAFAFA', color: '#607D8B', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Camera size={12} strokeWidth={1.75} /> {t('edl.photo')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <input ref={fichierRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={function(ev) { var f = ev.target.files[0]; ev.target.value = ''; televerserPhoto(f); }} />

      {/* Ajouter une ligne */}
      {edition && (
        <div style={Object.assign({}, carte, { padding: 12 })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('edl.ajouterLigne')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" maxLength={LIM.piece} value={nouvelle.piece} onChange={function(ev) { setNouvelle({ piece: ev.target.value, element: nouvelle.element }); }} placeholder={t('edl.piecePlaceholder')} style={{ flex: '1 1 120px', padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 12 }} />
            <input type="text" maxLength={LIM.element} value={nouvelle.element} onChange={function(ev) { setNouvelle({ piece: nouvelle.piece, element: ev.target.value }); }} placeholder={t('edl.elementPlaceholder')} style={{ flex: '1 1 140px', padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 12 }} />
            <button onClick={ajouterLigne} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#37474F', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('edl.ajouter')}</button>
          </div>
        </div>
      )}

      {/* Relevés */}
      <div style={carte}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('edl.releves.titre')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          {[['eau', 'text', 16], ['electricite', 'text', 16], ['cles', 'number', 2], ['badge', 'number', 2]].map(function(c) {
            var val = edition ? (local.releves[c[0]] == null ? '' : local.releves[c[0]]) : (e.releves[c[0]] == null || e.releves[c[0]] === '' ? '—' : e.releves[c[0]]);
            return (
              <label key={c[0]} style={{ fontSize: 11, color: '#666' }}>{t('edl.releves.' + c[0])}
                {edition ? (
                  <input type={c[1]} min={0} max={20} maxLength={c[2] === 16 ? 16 : undefined} value={val} onChange={function(ev) { var v = ev.target.value; maj(function(l) { return Object.assign({}, l, { releves: Object.assign({}, l.releves, { [c[0]]: v }) }); }); }}
                    style={{ display: 'block', width: '100%', marginTop: 3, padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box' }} />
                ) : <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginTop: 3 }}>{val}</div>}
              </label>
            );
          })}
        </div>
      </div>

      {/* Observations générales */}
      <div style={carte}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('edl.observationsGenerales')}</div>
        {edition ? (
          <div>
            <textarea value={local.obs} maxLength={LIM.obsGen} onChange={function(ev) { var v = ev.target.value; maj(function(l) { return Object.assign({}, l, { obs: v }); }); }} style={{ width: '100%', height: 70, padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }} />
            <div style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>{local.obs.length}/{LIM.obsGen}</div>
          </div>
        ) : <div style={{ fontSize: 13, color: '#444' }}>{e.observations_generales || <span style={{ color: '#999' }}>{t('edl.aucune')}</span>}</div>}
        {photos.filter(function(p) { return !p.item_id; }).length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {photos.filter(function(p) { return !p.item_id; }).map(function(p) {
              return <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} /></a>;
            })}
          </div>
        )}
      </div>

      {/* Réserves (lecture ou saisie par l'autre partie) */}
      {e.statut === 'a_valider' && d.signer && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('edl.reserves.titre')}</div>
          <textarea value={reserves} maxLength={LIM.reserves} onChange={function(ev) { setReserves(ev.target.value); }} placeholder={t('edl.reserves.placeholder')}
            style={{ width: '100%', height: 70, padding: '8px 10px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }} />
          <div style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>{reserves.length}/{LIM.reserves}</div>
        </div>
      )}
      {e.reserves && (e.statut === 'signe' || e.statut === 'genere') && (
        <div style={carte}><div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{t('edl.reserves.titre')}</div><div style={{ fontSize: 13, color: '#444' }}>{e.reserves}</div></div>
      )}

      {/* Signatures déjà posées */}
      {(e.signature_redacteur || e.signature_autre) && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>{t('edl.signatures')}</div>
          {[e.signature_redacteur, e.signature_autre].filter(Boolean).map(function(s, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderTop: i ? '1px solid #F0F0F0' : 'none' }}>
                {s.mode === 'dessin' && s.image ? <img src={s.image} alt="" style={{ height: 40, maxWidth: 120, objectFit: 'contain', background: '#FAFAFA', borderRadius: 6 }} /> : <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1B3F8F', fontSize: 18 }}>{s.nom_complet}</span>}
                <div style={{ fontSize: 11, color: '#666' }}><b>{s.nom_complet}</b> · {t('edl.role.' + s.role)}<br />{new Date(s.signe_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {modal === 'envoyer' && (
        <SignatureForm titre={t('edl.signature.titreEnvoi')} nomCompte="" envoi={action} libelleBouton={t('edl.signature.signerEtEnvoyer')} onAnnuler={function() { setModal(null); }} onValider={envoyer} />
      )}
      {modal === 'signer' && (
        <SignatureForm titre={t('edl.signature.titreSigner')} nomCompte="" envoi={action} libelleBouton={t('edl.signature.signer')} onAnnuler={function() { setModal(null); }} onValider={signer} />
      )}
      {modal === 'corriger' && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>{t('edl.correction.titre')}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{t('edl.correction.explication')}</div>
          <input type="text" maxLength={300} value={motif} onChange={function(ev) { setMotif(ev.target.value); }} placeholder={t('edl.correction.placeholder')} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setModal(null); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#F0F0F0', color: '#555', cursor: 'pointer' }}>{t('edl.annuler')}</button>
            <button onClick={corriger} disabled={action || motif.trim().length < 3} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: motif.trim().length < 3 ? '#E0B5B1' : '#B3261E', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{t('edl.correction.envoyer')}</button>
          </div>
        </div>
      )}
      {modal === 'generer' && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#B3261E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} strokeWidth={1.75} /> {t('edl.generer.titre')}</div>
          <div style={{ fontSize: 12, color: '#55655B', marginBottom: 12 }}>{t('edl.generer.avertissement')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setModal(null); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#F0F0F0', color: '#555', cursor: 'pointer' }}>{t('edl.annuler')}</button>
            <button onClick={generer} disabled={action} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{action ? t('edl.enCours') : t('edl.generer.confirmer')}</button>
          </div>
        </div>
      )}

      {!modal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
          {d.modifier && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { enregistrer(false).catch(function(err) { toast.error(erreurServeur(err, t('edl.erreur'))); }); }} disabled={!sale || action}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #CFD8DC', background: '#fff', color: sale ? '#37474F' : '#AAA', fontSize: 13, fontWeight: 600, cursor: sale ? 'pointer' : 'default' }}>{t('edl.enregistrer')}</button>
              <button onClick={function() { if (!tousRenseignes) { toast.error(t('edl.renseignezTout')); return; } setModal('envoyer'); }} disabled={action}
                style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: tousRenseignes ? '#1B6B3A' : '#B0BEC5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Send size={14} strokeWidth={1.75} /> {t('edl.signerEtEnvoyer', { nom: e.autre_partie.nom })}</span>
              </button>
            </div>
          )}
          {d.signer && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setModal('corriger'); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #F0C9C5', background: '#fff', color: '#B3261E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('edl.demanderCorrection')}</button>
              <button onClick={function() { setModal('signer'); }} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('edl.relireEtSigner')}</button>
            </div>
          )}
          {d.retirer && <button onClick={retirer} disabled={action} style={{ padding: 12, borderRadius: 10, border: '1px solid #CFD8DC', background: '#fff', color: '#37474F', fontSize: 13, cursor: 'pointer' }}>{t('edl.retirer')}</button>}
          {d.generer && <button onClick={function() { setModal('generer'); }} style={{ padding: 13, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Lock size={14} strokeWidth={1.75} /> {t('edl.generer.bouton')}</span></button>}
          {d.telecharger && <button onClick={telecharger} style={{ padding: 13, borderRadius: 10, border: 'none', background: '#37474F', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Download size={14} strokeWidth={1.75} /> {t('edl.telecharger')}</span></button>}
          {d.annuler && <button onClick={abandonner} disabled={action} style={{ padding: 8, border: 'none', background: 'none', color: '#B3261E', fontSize: 12, cursor: 'pointer' }}>{t('edl.abandonner')}</button>}
        </div>
      )}
    </div>
  );
}
