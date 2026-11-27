/* eslint-disable */
import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Smartphone, Check, X, Copy } from 'lucide-react';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };
var NOM_PLAN = { pro: 'Pro', agence: 'Agence' };
var STATUTS = {
  en_attente: { label: 'À vérifier', couleur: 'var(--warn)', fond: 'var(--warn-soft)' },
  confirmee:  { label: 'Confirmée', couleur: 'var(--green)', fond: 'var(--green-light)' },
  refusee:    { label: 'Refusée', couleur: 'var(--danger)', fond: 'var(--danger-soft)' },
  annulee:    { label: 'Annulée', couleur: 'var(--text-muted)', fond: 'var(--bg-tertiary)' },
};
var FILTRES = [
  { id: 'en_attente', label: 'À vérifier' }, { id: 'confirmee', label: 'Confirmées' },
  { id: 'refusee', label: 'Refusées' }, { id: 'tous', label: 'Toutes' },
];

function dateHeure(v) {
  var d = new Date(v);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Demandes d'abonnement payées par Orange Money : l'admin vérifie la réception puis confirme
// (l'abonnement est activé automatiquement) ou refuse avec un motif.
export default function DemandesAbonnement(props) {
  var [filtre, setFiltre] = useState('en_attente');
  var [liste, setListe] = useState(null);
  var [occupe, setOccupe] = useState(null);       // id en cours de traitement
  var [aConfirmer, setAConfirmer] = useState(null); // demande en cours de confirmation
  var [aRefuser, setARefuser] = useState(null);
  var [motif, setMotif] = useState('');

  var charger = useCallback(function() {
    api.get('/admin/demandes-abonnement' + (filtre === 'tous' ? '' : '?statut=' + filtre))
      .then(function(res) { setListe(res.data.demandes || []); })
      .catch(function() { setListe([]); toast.error('Impossible de charger les demandes'); });
  }, [filtre]);
  useEffect(function() { setListe(null); charger(); }, [charger]);

  function traiter(d, action, corps) {
    setOccupe(d.id);
    api.post('/admin/demandes-abonnement/' + d.id + '/' + action, corps || {})
      .then(function() {
        toast.success(action === 'confirmer' ? 'Abonnement activé pour ' + d.prenom + ' ' + d.nom : 'Demande refusée');
        setAConfirmer(null); setARefuser(null); setMotif('');
        charger();
        if (props.onChange) props.onChange();
      })
      .catch(function(err) {
        toast.error((err.response && err.response.data && err.response.data.erreur) || 'Erreur');
        setAConfirmer(null); charger();
      })
      .finally(function() { setOccupe(null); });
  }

  function copier(texte) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(function() { toast.success('Copié'); });
  }

  var nbAttente = liste && filtre === 'en_attente' ? liste.length : null;

  return (
    <section style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} aria-labelledby="demandes-abo-titre">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 id="demandes-abo-titre" style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Smartphone size={17} strokeWidth={1.8} /> Demandes d’abonnement (Orange Money)
        </h2>
        {nbAttente !== null && nbAttente > 0 && <span style={{ background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 16, padding: '3px 10px', fontSize: 12, fontWeight: 700 }} role="status">{nbAttente} à vérifier</span>}
      </div>

      <div role="tablist" aria-label="Filtrer les demandes" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTRES.map(function(f) {
          var actif = filtre === f.id;
          return (
            <button key={f.id} type="button" role="tab" aria-selected={actif} onClick={function() { setFiltre(f.id); }}
              style={{ padding: '7px 14px', minHeight: 36, borderRadius: 20, border: actif ? '1.5px solid var(--green)' : '1px solid var(--border)', background: actif ? 'var(--green-light)' : 'transparent', color: actif ? 'var(--green)' : 'var(--text-secondary)', fontSize: 13, fontWeight: actif ? 700 : 500, cursor: 'pointer' }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {liste === null && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chargement…</div>}
      {liste && liste.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>{filtre === 'en_attente' ? 'Aucune demande à vérifier.' : 'Aucune demande.'}</div>}

      <div style={{ display: 'grid', gap: 10 }}>
        {(liste || []).map(function(d) {
          var st = STATUTS[d.statut] || STATUTS.annulee;
          var occupee = occupe === d.id;
          return (
            <article key={d.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{d.prenom} {d.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>{d.email}{d.telephone ? ' · ' + d.telephone : ''}</div>
                </div>
                <span style={{ background: st.fond, color: st.couleur, borderRadius: 16, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{st.label}</span>
              </div>

              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 16px', fontSize: 13 }}>
                <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Abonnement demandé</dt><dd style={{ margin: 0, fontWeight: 600 }}>{NOM_PLAN[d.plan]} · {d.duree_mois} mois</dd></div>
                <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Montant attendu</dt><dd style={{ margin: 0, fontWeight: 700, color: 'var(--green)' }}>{GNF(d.montant)}</dd></div>
                <div>
                  <dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Référence du paiement</dt>
                  <dd style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 6, overflowWrap: 'anywhere' }}>
                    {d.reference_paiement}
                    <button type="button" onClick={function() { copier(d.reference_paiement); }} aria-label="Copier la référence" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}><Copy size={14} strokeWidth={1.75} /></button>
                  </dd>
                </div>
                {d.numero_expediteur && <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Payé depuis</dt><dd style={{ margin: 0, fontWeight: 600 }}>{d.numero_expediteur}</dd></div>}
                {d.code_promo && <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Code promo</dt><dd style={{ margin: 0, fontWeight: 600 }}>{d.code_promo}</dd></div>}
                <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Demande {d.code}</dt><dd style={{ margin: 0 }}>{dateHeure(d.cree_le)}</dd></div>
                <div><dt style={{ color: 'var(--text-muted)', fontSize: 11 }}>Plan actuel</dt><dd style={{ margin: 0 }}>{NOM_PLAN[d.plan_actuel] || 'Gratuit'}</dd></div>
              </dl>

              {d.statut === 'refusee' && d.motif_refus && <div style={{ fontSize: 13, color: 'var(--danger)' }}>Motif du refus : {d.motif_refus}</div>}
              {(d.statut === 'confirmee' || d.statut === 'refusee') && d.traite_le && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Traitée le {dateHeure(d.traite_le)}</div>}

              {d.statut === 'en_attente' && aRefuser !== d.id && aConfirmer !== d.id && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" disabled={occupee} onClick={function() { setAConfirmer(d.id); setARefuser(null); }}
                    style={{ flex: '1 1 180px', minHeight: 44, border: 'none', borderRadius: 10, background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Check size={16} strokeWidth={2} /> Confirmer le paiement
                  </button>
                  <button type="button" disabled={occupee} onClick={function() { setARefuser(d.id); setAConfirmer(null); setMotif(''); }}
                    style={{ flex: '1 1 120px', minHeight: 44, border: '1px solid var(--danger)', borderRadius: 10, background: 'transparent', color: 'var(--danger)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <X size={16} strokeWidth={2} /> Refuser
                  </button>
                </div>
              )}

              {aConfirmer === d.id && (
                <div role="alertdialog" aria-label="Confirmer l’activation" style={{ background: 'var(--green-light)', borderRadius: 10, padding: 12, display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>Avez-vous bien reçu <b>{GNF(d.montant)}</b> sur le numéro Orange Money avec la référence <b style={{ fontFamily: 'var(--font-mono)' }}>{d.reference_paiement}</b> ? L’abonnement <b>{NOM_PLAN[d.plan]}</b> ({d.duree_mois} mois) sera activé immédiatement et la facture envoyée par e-mail.</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" disabled={occupee} onClick={function() { traiter(d, 'confirmer'); }}
                      style={{ flex: '1 1 160px', minHeight: 44, border: 'none', borderRadius: 10, background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{occupee ? 'Activation…' : 'Oui, activer l’abonnement'}</button>
                    <button type="button" disabled={occupee} onClick={function() { setAConfirmer(null); }}
                      style={{ flex: '1 1 100px', minHeight: 44, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Retour</button>
                  </div>
                </div>
              )}

              {aRefuser === d.id && (
                <div style={{ background: 'var(--danger-soft)', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
                  <label htmlFor={'motif-' + d.id} style={{ fontSize: 13, fontWeight: 600 }}>Motif du refus (envoyé au propriétaire)</label>
                  <textarea id={'motif-' + d.id} value={motif} onChange={function(e) { setMotif(e.target.value); }} maxLength={500} rows={3}
                    placeholder="Ex. Paiement non reçu sur ce numéro, montant incorrect…" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', padding: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" disabled={occupee || motif.trim().length < 3} onClick={function() { traiter(d, 'refuser', { motif: motif.trim() }); }}
                      style={{ flex: '1 1 140px', minHeight: 44, border: 'none', borderRadius: 10, background: 'var(--danger)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: motif.trim().length < 3 ? 0.6 : 1 }}>Refuser la demande</button>
                    <button type="button" disabled={occupee} onClick={function() { setARefuser(null); }}
                      style={{ flex: '1 1 100px', minHeight: 44, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Retour</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
