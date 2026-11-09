/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FileSignature, Lock, Download, Send, AlertTriangle, Plus, Eye, Copy, Trash2 } from 'lucide-react';
import { SignatureForm } from './EtatDesLieux';

// ================================================
// ACTES À SIGNER : avenant, décompte de restitution, cautionnement.
// Même parcours que l'état des lieux : le bailleur prépare et signe, l'autre
// partie (et le garant, sans compte) signent, puis le document est généré et
// verrouillé.
// ================================================

var COULEURS_STATUT = { brouillon: ['#FFF3E0', '#8A4F05'], a_valider: ['#E3F2FD', '#0D47A1'], signe: ['#E8F5E9', '#1B5E20'], genere: ['#ECEFF1', '#37474F'] };

function erreurServeur(err, defaut) {
  return err && err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : defaut;
}
function gnf(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0)) + ' GNF'; }
function dateFr(d) { return d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'; }

export default function ActesSignature({ reservationId, type, onFermer }) {
  var t = useTranslation('dashboard').t;
  var [liste, setListe] = useState(null);
  var [courant, setCourant] = useState(null);
  var [local, setLocal] = useState(null);
  var [sale, setSale] = useState(false);
  var [charge, setCharge] = useState(true);
  var [action, setAction] = useState(false);
  var [modal, setModal] = useState(null);
  var [motif, setMotif] = useState('');
  var [apercu, setApercu] = useState(null);
  var [lienGarant, setLienGarant] = useState(null);

  function chargerListe() {
    return api.get('/actes/reservation/' + reservationId)
      .then(function(res) { setListe(res.data); })
      .catch(function(err) { toast.error(erreurServeur(err, t('actes.erreurChargement'))); })
      .finally(function() { setCharge(false); });
  }
  useEffect(function() { chargerListe(); }, [reservationId]);

  function appliquer(acte) {
    setCourant(acte);
    setLocal(acte.droits.modifier ? JSON.parse(JSON.stringify(acte.donnees)) : null);
    setSale(false); setModal(null); setApercu(null);
  }

  function ouvrir(id) {
    api.get('/actes/' + id).then(function(res) { appliquer(res.data.acte); })
      .catch(function(err) { toast.error(erreurServeur(err, t('actes.erreurChargement'))); });
  }

  function creer(typeActe, sourceId) {
    setAction(true);
    api.post('/actes', { type: typeActe, reservation_id: reservationId, source_id: sourceId })
      .then(function(res) { appliquer(res.data.acte); })
      .catch(function(err) { toast.error(erreurServeur(err, t('actes.erreur'))); })
      .finally(function() { setAction(false); });
  }

  function retourListe() { setCourant(null); setLocal(null); setSale(false); setModal(null); setApercu(null); setLienGarant(null); setMotif(''); chargerListe(); }

  function lancer(fn) {
    setAction(true);
    return fn().catch(function(err) { toast.error(erreurServeur(err, t('actes.erreur'))); }).finally(function() { setAction(false); });
  }

  function enregistrer(silencieux) {
    return api.put('/actes/' + courant.id, { version: courant.version, donnees: local })
      .then(function(res) { appliquer(res.data.acte); if (!silencieux) toast.success(t('actes.brouillonEnregistre')); return res.data.acte; });
  }

  function envoyer(signature) {
    lancer(function() {
      return (sale ? enregistrer(true) : Promise.resolve(courant)).then(function(a) {
        return api.post('/actes/' + a.id + '/envoyer', { signature: signature });
      }).then(function(res) {
        appliquer(res.data.acte);
        if (res.data.lien_garant) setLienGarant({ lien: res.data.lien_garant, envoye: res.data.lien_garant_envoye });
        toast.success(t('actes.toastEnvoye'));
      });
    });
  }

  function renvoyerLien() {
    lancer(function() {
      return api.post('/actes/' + courant.id + '/garant/renvoyer', {}).then(function(res) {
        appliquer(res.data.acte); setLienGarant({ lien: res.data.lien_garant, envoye: res.data.lien_garant_envoye });
        toast.success(t('actes.lienRenvoye'));
      });
    });
  }

  function simple(chemin, corps, message) {
    lancer(function() {
      return api.post('/actes/' + courant.id + '/' + chemin, corps || {}).then(function(res) {
        appliquer(res.data.acte); if (message) toast.success(t(message));
      });
    });
  }

  function signer(signature) { simple('signer', { signature: signature }, 'actes.toastSigne'); }
  function corriger() { lancer(function() { return api.post('/actes/' + courant.id + '/corriger', { motif: motif }).then(function(res) { appliquer(res.data.acte); setMotif(''); toast.success(t('actes.toastCorrection')); }); }); }
  function generer() { simple('generer', {}, 'actes.toastGenere'); }
  function abandonner() { lancer(function() { return api.post('/actes/' + courant.id + '/annuler').then(function() { toast.success(t('actes.toastAbandonne')); retourListe(); }); }); }

  function voirApercu() {
    if (apercu) { setApercu(null); return; }
    api.get('/actes/' + courant.id + '/apercu').then(function(res) { setApercu(res.data.html); })
      .catch(function(err) { toast.error(erreurServeur(err, t('actes.erreur'))); });
  }

  function telecharger() {
    api.get('/documents/' + courant.document_id + '/telecharger?format=pdf', { responseType: 'blob' })
      .then(function(r) {
        var pdf = (r.headers && r.headers['content-type'] || '').indexOf('pdf') !== -1;
        var url = window.URL.createObjectURL(new Blob([r.data], { type: pdf ? 'application/pdf' : 'text/html; charset=utf-8' }));
        var a = document.createElement('a'); a.href = url; a.download = t('actes.type.' + courant.type) + (pdf ? '.pdf' : '.html');
        document.body.appendChild(a); a.click(); a.remove();
      }).catch(function() { toast.error(t('actes.erreurTelechargement')); });
  }

  function copier(texte) {
    try { navigator.clipboard.writeText(texte).then(function() { toast.success(t('actes.lienCopie')); }); } catch (e) { toast.error(t('actes.erreur')); }
  }

  function maj(champ, valeur) { setLocal(function(l) { return Object.assign({}, l, { [champ]: valeur }); }); setSale(true); }
  function majGarant(champ, valeur) { setLocal(function(l) { return Object.assign({}, l, { garant: Object.assign({}, l.garant, { [champ]: valeur }) }); }); setSale(true); }
  function majRetenue(i, champ, valeur) {
    setLocal(function(l) { return Object.assign({}, l, { retenues: l.retenues.map(function(r, k) { return k === i ? Object.assign({}, r, { [champ]: valeur }) : r; }) }); }); setSale(true);
  }
  function ajouterRetenue() { setLocal(function(l) { return Object.assign({}, l, { retenues: l.retenues.concat([{ item_id: null, libelle: '', montant: 0, commentaire: '' }]) }); }); setSale(true); }
  function retirerRetenue(i) { setLocal(function(l) { return Object.assign({}, l, { retenues: l.retenues.filter(function(r, k) { return k !== i; }) }); }); setSale(true); }

  var carte = { background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
  var champ = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, boxSizing: 'border-box' };
  var etiquette = { fontSize: 11, color: '#666', display: 'block' };

  if (charge) return <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>{t('actes.chargement')}</div>;

  // ── Liste ──
  if (!courant) {
    var sug = (liste && liste.suggestions) || { avenants: [], decompte: null, cautionnement: false };
    var actes = ((liste && liste.actes) || []).filter(function(a) { return !type || a.type === type; });
    var aucuneCreation = !(type ? (type === 'avenant' ? sug.avenants.length : type === 'decompte' ? sug.decompte : sug.cautionnement) : (sug.avenants.length || sug.decompte || sug.cautionnement));
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#37474F', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><FileSignature size={15} strokeWidth={1.75} /> {type ? t('actes.type.' + type) : t('actes.titre')}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 }}>{liste && liste.logement ? liste.logement.titre : ''}</div>
          </div>
          {onFermer && <button onClick={onFermer} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>{t('actes.fermer')}</button>}
        </div>
        <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#7B4F00' }}>{t('actes.explication')}</div>

        {actes.map(function(a) {
          var c = COULEURS_STATUT[a.statut] || COULEURS_STATUT.brouillon;
          return (
            <div key={a.id} style={carte}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{t('actes.type.' + a.type)}</div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ background: c[0], color: c[1], borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 11 }}>{t('actes.statut.' + a.statut)}</span>
                {a.droits.signer && <b style={{ color: '#B3261E', fontSize: 12, marginLeft: 8 }}>{t('actes.aVousDeSigner')}</b>}
              </div>
              <button onClick={function() { ouvrir(a.id); }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {a.statut === 'genere' ? t('actes.consulter') : t('actes.continuer')}
              </button>
            </div>
          );
        })}

        {(!type || type === 'avenant') && sug.avenants.map(function(rn) {
          return (
            <div key={rn.id} style={carte}>
              <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>{t('actes.avenantProposition', { n: rn.nouvelle_duree_mois, loyer: rn.nouveau_prix ? gnf(rn.nouveau_prix) : t('actes.loyerInchange') })}</div>
              <button disabled={action} onClick={function() { creer('avenant', rn.id); }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#37474F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} strokeWidth={2} /> {t('actes.preparer.avenant')}</span></button>
            </div>
          );
        })}
        {(!type || type === 'decompte') && sug.decompte && (
          <div style={carte}>
            <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>{t('actes.decompteExplication')}</div>
            <button disabled={action} onClick={function() { creer('decompte'); }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#37474F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} strokeWidth={2} /> {t('actes.preparer.decompte')}</span></button>
          </div>
        )}
        {(!type || type === 'cautionnement') && sug.cautionnement && (
          <div style={carte}>
            <div style={{ fontSize: 13, color: '#444', marginBottom: 8 }}>{t('actes.cautionExplication')}</div>
            <button disabled={action} onClick={function() { creer('cautionnement'); }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#37474F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} strokeWidth={2} /> {t('actes.preparer.cautionnement')}</span></button>
          </div>
        )}
        {actes.length === 0 && aucuneCreation && <div style={{ ...carte, color: '#888', fontSize: 13 }}>{t(type ? 'actes.rien.' + type : 'actes.rienDuTout')}</div>}
      </div>
    );
  }

  // ── Détail ──
  var a = courant, d = a.droits, edition = d.modifier && local;
  var x = edition ? local : a.donnees;
  var c = COULEURS_STATUT[a.statut] || COULEURS_STATUT.brouillon;
  var totalLocal = a.type === 'decompte' && edition ? local.retenues.reduce(function(s, r) { return s + (Number(r.montant) || 0); }, 0) : null;

  var ligne = function(label, valeur) {
    return <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #F0F0F0' }}><span style={{ color: '#888' }}>{label}</span><b style={{ textAlign: 'right' }}>{valeur}</b></div>;
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#37474F', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}><FileSignature size={15} strokeWidth={1.75} /> {t('actes.type.' + a.type)}</div>
          <button onClick={retourListe} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>← {t('actes.retour')}</button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>{a.logement.titre} · {t('actes.preparePar', { nom: a.redacteur.nom })}</div>
      </div>
      <div style={{ marginBottom: 12 }}><span style={{ background: c[0], color: c[1], borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: 11 }}>{a.statut === 'genere' ? <Lock size={10} strokeWidth={2.2} style={{ verticalAlign: -1, marginRight: 4 }} /> : null}{t('actes.statut.' + a.statut)}</span></div>

      {a.statut === 'brouillon' && a.corrections.length > 0 && <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B71C1C' }}><b>{t('actes.correctionDemandee')}</b> {a.corrections[a.corrections.length - 1].motif}</div>}
      {a.statut === 'brouillon' && !d.modifier && <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0D47A1' }}>{t('actes.msg.brouillonAutre', { nom: a.redacteur.nom })}</div>}
      {a.statut === 'a_valider' && d.signer && <div style={{ background: '#FFF8E1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#7B4F00' }}>{t('actes.msg.aSigner', { nom: a.redacteur.nom })}</div>}
      {a.statut === 'a_valider' && !d.signer && <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0D47A1' }}>{t('actes.msg.attente')}</div>}
      {a.statut === 'signe' && <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#1B5E20' }}>{d.generer ? t('actes.msg.pretAGenerer') : t('actes.msg.attenteGeneration', { nom: a.redacteur.nom })}</div>}
      {a.statut === 'genere' && <div style={{ background: '#ECEFF1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#37474F' }}>{t('actes.msg.genere')}</div>}

      {/* ── Contenu selon le type ── */}
      <div style={carte}>
        {a.type === 'avenant' && (
          <div>
            {ligne(t('actes.avenant.duree'), t('actes.avenant.moisSupp', { n: a.donnees.duree_ajoutee_mois }))}
            {ligne(t('actes.avenant.finAvant'), dateFr(a.donnees.date_fin_avant))}
            {ligne(t('actes.avenant.finApres'), dateFr(a.donnees.date_fin_apres))}
            {ligne(t('actes.avenant.loyerAvant'), a.donnees.loyer_avant == null ? '—' : gnf(a.donnees.loyer_avant))}
            {ligne(t('actes.avenant.loyerApres'), gnf(a.donnees.loyer_apres))}
            <div style={{ marginTop: 12 }}>
              <label style={etiquette}>{t('actes.avenant.dateEffet')}</label>
              {edition ? <input type="date" value={x.date_effet || ''} onChange={function(e) { maj('date_effet', e.target.value); }} style={champ} /> : <b style={{ fontSize: 13 }}>{dateFr(a.donnees.date_effet)}</b>}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={etiquette}>{t('actes.avenant.clause')}</label>
              {edition ? (<div><textarea value={x.clause_libre || ''} maxLength={200} onChange={function(e) { maj('clause_libre', e.target.value); }} style={Object.assign({}, champ, { height: 70, resize: 'none', fontFamily: 'inherit' })} /><div style={{ fontSize: 11, color: '#999', textAlign: 'right' }}>{(x.clause_libre || '').length}/200</div></div>) : <div style={{ fontSize: 13 }}>{a.donnees.clause_libre || <span style={{ color: '#999' }}>{t('actes.aucune')}</span>}</div>}
            </div>
          </div>
        )}

        {a.type === 'decompte' && (
          <div>
            {ligne(t('actes.decompte.depot'), gnf(a.donnees.depot))}
            <div style={{ fontSize: 12, fontWeight: 700, margin: '12px 0 6px' }}>{t('actes.decompte.retenues')}</div>
            {(x.retenues || []).map(function(r, i) {
              var constat = (a.donnees.constats || []).find(function(cc) { return cc.item_id && cc.item_id === r.item_id; });
              return (
                <div key={i} style={{ border: '1px solid #EEE', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  {edition ? (
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input type="text" maxLength={40} value={r.libelle} onChange={function(e) { majRetenue(i, 'libelle', e.target.value); }} placeholder={t('actes.decompte.libelle')} style={champ} />
                        <input type="number" min={0} value={r.montant} onChange={function(e) { majRetenue(i, 'montant', e.target.value); }} placeholder="GNF" style={Object.assign({}, champ, { width: 130 })} />
                        <button onClick={function() { retirerRetenue(i); }} style={{ background: 'none', border: 'none', color: '#B3261E', cursor: 'pointer' }}><Trash2 size={14} strokeWidth={1.75} /></button>
                      </div>
                      <input type="text" maxLength={60} value={r.commentaire || ''} onChange={function(e) { majRetenue(i, 'commentaire', e.target.value); }} placeholder={t('actes.decompte.commentaire')} style={champ} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{r.libelle}{r.commentaire ? <span style={{ color: '#888' }}> · {r.commentaire}</span> : null}</span><b>{gnf(r.montant)}</b></div>
                  )}
                  {constat && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{t('actes.decompte.constat', { entree: t('edl.etat.' + constat.entree), sortie: t('edl.etat.' + constat.sortie) })}</div>}
                </div>
              );
            })}
            {edition && (x.retenues || []).length < 8 && <button onClick={ajouterRetenue} style={{ padding: '7px 12px', borderRadius: 8, border: '1px dashed #B0BEC5', background: '#FAFAFA', color: '#607D8B', fontSize: 12, cursor: 'pointer' }}>+ {t('actes.decompte.ajouter')}</button>}
            {ligne(t('actes.decompte.total'), gnf(edition ? totalLocal : a.donnees.total_retenues))}
            {ligne(t('actes.decompte.aRestituer'), gnf(edition ? a.donnees.depot - totalLocal : a.donnees.a_restituer))}
            <div style={{ marginTop: 10 }}>
              <label style={etiquette}>{t('actes.decompte.note')}</label>
              {edition ? <input type="text" maxLength={120} value={x.note || ''} onChange={function(e) { maj('note', e.target.value); }} style={champ} /> : <div style={{ fontSize: 13 }}>{a.donnees.note || <span style={{ color: '#999' }}>{t('actes.aucune')}</span>}</div>}
            </div>
          </div>
        )}

        {a.type === 'cautionnement' && (
          <div>
            {edition ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                <label style={etiquette}>{t('actes.caution.nature')}<select value={x.nature} onChange={function(e) { maj('nature', e.target.value); }} style={champ}><option value="solidaire">{t('actes.caution.solidaire')}</option><option value="simple">{t('actes.caution.simple')}</option></select></label>
                <label style={etiquette}>{t('actes.caution.montant')}<input type="number" min={1} value={x.montant_max} onChange={function(e) { maj('montant_max', e.target.value); }} style={champ} /></label>
                <label style={etiquette}>{t('actes.caution.duree')}<input type="number" min={1} max={60} value={x.duree_mois} onChange={function(e) { maj('duree_mois', e.target.value); }} style={champ} /></label>
                <label style={etiquette}>{t('actes.caution.lien')}<input type="text" maxLength={30} value={x.lien || ''} onChange={function(e) { maj('lien', e.target.value); }} placeholder={t('actes.caution.lienPlaceholder')} style={champ} /></label>
                <label style={etiquette}>{t('actes.caution.garantNom')}<input type="text" maxLength={60} value={(x.garant || {}).nom || ''} onChange={function(e) { majGarant('nom', e.target.value); }} style={champ} /></label>
                <label style={etiquette}>{t('actes.caution.garantEmail')} *<input type="email" maxLength={80} value={(x.garant || {}).email || ''} onChange={function(e) { majGarant('email', e.target.value); }} style={champ} /></label>
                <label style={etiquette}>{t('actes.caution.garantTel')}<input type="text" maxLength={24} value={(x.garant || {}).telephone || ''} onChange={function(e) { majGarant('telephone', e.target.value); }} style={champ} /></label>
              </div>
            ) : (
              <div>
                {ligne(t('actes.caution.nature'), t('actes.caution.' + a.donnees.nature))}
                {ligne(t('actes.caution.montant'), gnf(a.donnees.montant_max))}
                {ligne(t('actes.caution.duree'), t('actes.caution.moisN', { n: a.donnees.duree_mois }))}
                {ligne(t('actes.caution.garantNom'), (a.donnees.garant && a.donnees.garant.nom) || '—')}
                {ligne(t('actes.caution.garantEmail'), (a.donnees.garant && a.donnees.garant.email) || '—')}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#666', marginTop: 10 }}>{t('actes.caution.explicationGarant')}</div>
          </div>
        )}
      </div>

      {/* Lien du garant */}
      {a.type === 'cautionnement' && a.garant_lien && (a.statut === 'a_valider' || a.statut === 'signe') && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('actes.caution.lienTitre')}</div>
          <div style={{ fontSize: 12, color: a.garant_lien.signe ? '#1B5E20' : '#8A4F05', marginBottom: 8 }}>
            {a.garant_lien.signe ? t('actes.caution.garantAsigne') : t('actes.caution.garantAttendu', { date: dateFr(a.garant_lien.expire_at) })}
          </div>
          {lienGarant && (
            <div style={{ background: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12, wordBreak: 'break-all', marginBottom: 6 }}>{lienGarant.lien}</div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{lienGarant.envoye ? t('actes.caution.lienEnvoyeMail') : t('actes.caution.lienNonEnvoye')}</div>
              <button onClick={function() { copier(lienGarant.lien); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #CFD8DC', background: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Copy size={12} strokeWidth={1.75} /> {t('actes.caution.copier')}</button>
            </div>
          )}
          {d.renvoyer_lien && <button onClick={renvoyerLien} disabled={action} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CFD8DC', background: '#fff', color: '#37474F', fontSize: 12, cursor: 'pointer' }}>{t('actes.caution.renvoyer')}</button>}
        </div>
      )}

      {/* Signatures posées */}
      {Object.keys(a.signatures || {}).length > 0 && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t('actes.signatures')}</div>
          {Object.keys(a.signatures).map(function(role, i) {
            var s = a.signatures[role];
            return (
              <div key={role} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderTop: i ? '1px solid #F0F0F0' : 'none' }}>
                {s.mode === 'dessin' && s.image ? <img src={s.image} alt="" style={{ height: 40, maxWidth: 120, objectFit: 'contain', background: '#FAFAFA', borderRadius: 6 }} /> : <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1B3F8F', fontSize: 18 }}>{s.nom_complet}</span>}
                <div style={{ fontSize: 11, color: '#666' }}><b>{s.nom_complet}</b> · {t('actes.role.' + role)}<br />{new Date(s.signe_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            );
          })}
        </div>
      )}

      {apercu && (
        <div style={Object.assign({}, carte, { padding: 8, overflow: 'hidden' })}>
          <div style={{ width: '100%', maxWidth: 560, height: 1123 * Math.min(1, 560 / 794), margin: '0 auto', overflow: 'hidden', border: '1px solid #E0E0E0', borderRadius: 6 }}>
            <iframe title={t('actes.apercu')} srcDoc={apercu} sandbox="" style={{ width: 794, height: 1123, border: 0, transformOrigin: '0 0', transform: 'scale(' + Math.min(1, 560 / 794) + ')', background: '#fff' }} />
          </div>
        </div>
      )}

      {/* Formulaires d'action */}
      {modal === 'envoyer' && <SignatureForm titre={t('actes.signature.titreEnvoi')} nomCompte="" envoi={action} libelleBouton={t('edl.signature.signerEtEnvoyer')} onAnnuler={function() { setModal(null); }} onValider={envoyer} />}
      {modal === 'signer' && <SignatureForm titre={t('actes.signature.titreSigner', { type: t('actes.type.' + a.type) })} nomCompte="" envoi={action} libelleBouton={t('edl.signature.signer')} onAnnuler={function() { setModal(null); }} onValider={signer} />}
      {modal === 'corriger' && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{t('edl.correction.titre')}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{t('actes.correctionExplication')}</div>
          <input type="text" maxLength={300} value={motif} onChange={function(e) { setMotif(e.target.value); }} placeholder={t('edl.correction.placeholder')} style={Object.assign({}, champ, { marginBottom: 10 })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setModal(null); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#F0F0F0', color: '#555', cursor: 'pointer' }}>{t('edl.annuler')}</button>
            <button onClick={corriger} disabled={action || motif.trim().length < 3} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: motif.trim().length < 3 ? '#E0B5B1' : '#B3261E', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{t('edl.correction.envoyer')}</button>
          </div>
        </div>
      )}
      {modal === 'generer' && (
        <div style={carte}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#B3261E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} strokeWidth={1.75} /> {t('edl.generer.titre')}</div>
          <div style={{ fontSize: 12, color: '#55655B', marginBottom: 12 }}>{t('actes.genererAvertissement')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={function() { setModal(null); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#F0F0F0', color: '#555', cursor: 'pointer' }}>{t('edl.annuler')}</button>
            <button onClick={generer} disabled={action} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{action ? t('edl.enCours') : t('edl.generer.confirmer')}</button>
          </div>
        </div>
      )}

      {!modal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={voirApercu} style={{ padding: 11, borderRadius: 10, border: '1px solid #CFD8DC', background: '#fff', color: '#37474F', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Eye size={14} strokeWidth={1.75} /> {apercu ? t('actes.masquerApercu') : t('actes.voirApercu')}</button>
          {d.modifier && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { lancer(function() { return enregistrer(false); }); }} disabled={!sale || action} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #CFD8DC', background: '#fff', color: sale ? '#37474F' : '#AAA', fontSize: 13, fontWeight: 600, cursor: sale ? 'pointer' : 'default' }}>{t('edl.enregistrer')}</button>
              <button onClick={function() { setModal('envoyer'); }} disabled={action} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Send size={14} strokeWidth={1.75} /> {t('actes.signerEtEnvoyer')}</span></button>
            </div>
          )}
          {d.signer && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function() { setModal('corriger'); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #F0C9C5', background: '#fff', color: '#B3261E', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t('edl.demanderCorrection')}</button>
              <button onClick={function() { setModal('signer'); }} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('actes.relireEtSigner')}</button>
            </div>
          )}
          {d.retirer && <button onClick={function() { simple('retirer'); }} disabled={action} style={{ padding: 12, borderRadius: 10, border: '1px solid #CFD8DC', background: '#fff', color: '#37474F', fontSize: 13, cursor: 'pointer' }}>{t('edl.retirer')}</button>}
          {d.generer && <button onClick={function() { setModal('generer'); }} style={{ padding: 13, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Lock size={14} strokeWidth={1.75} /> {t('edl.generer.bouton')}</span></button>}
          {d.telecharger && <button onClick={telecharger} style={{ padding: 13, borderRadius: 10, border: 'none', background: '#37474F', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Download size={14} strokeWidth={1.75} /> {t('edl.telecharger')}</span></button>}
          {d.annuler && <button onClick={abandonner} disabled={action} style={{ padding: 8, border: 'none', background: 'none', color: '#B3261E', fontSize: 12, cursor: 'pointer' }}>{t('actes.abandonner')}</button>}
        </div>
      )}
    </div>
  );
}
