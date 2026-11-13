/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Gift, Ban, Banknote, History, Receipt, RefreshCw } from 'lucide-react';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

var PRIX_MENSUEL = { pro: 120000, agence: 300000 };
var PLANS = [
  { id: 'gratuit', label: 'Gratuit' },
  { id: 'pro',     label: 'Pro' },
  { id: 'agence',  label: 'Agence' },
];
var DUREES_OFFRE = [
  { id: 1, label: '1 mois' }, { id: 3, label: '3 mois' }, { id: 6, label: '6 mois' },
  { id: 12, label: '12 mois' }, { id: 'illimite', label: 'Illimité' },
];
var DUREES_PAIEMENT = DUREES_OFFRE.slice(0, 4);
var MOTIFS = [
  { id: 'collaborateur',    label: 'Collaborateur' },
  { id: 'partenaire',       label: 'Partenaire' },
  { id: 'pilote',           label: 'Pilote' },
  { id: 'geste_commercial', label: 'Geste commercial' },
];
var MOYENS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'mtn_momo',     label: 'MTN MoMo' },
  { id: 'especes',      label: 'Espèces' },
  { id: 'virement',     label: 'Virement' },
];
var ACTIONS = {
  changer_plan:    'Changement de plan',
  offrir:          'Accès offert',
  revoquer:        'Accès révoqué',
  paiement_manuel: 'Paiement manuel',
  expiration_auto: 'Expiration automatique',
};

function libelle(liste, id) {
  var trouve = liste.filter(function(x) { return x.id === id; })[0];
  return trouve ? trouve.label : (id || '');
}

export function formaterDateJour(valeur) {
  if (!valeur) return '';
  var m = String(valeur).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[3] + '/' + m[2] + '/' + m[1];
  return new Date(valeur).toLocaleDateString('fr-FR');
}

function formaterDateHeure(valeur) {
  var d = new Date(valeur);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function BadgeSource(props) {
  var source = props.source;
  if (source === 'offert') {
    var fin = props.offertJusqu ? 'jusqu’au ' + formaterDateJour(props.offertJusqu) : 'illimité';
    return (
      <span style={{ background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Gift size={11} strokeWidth={2} /> Offert · {fin}
      </span>
    );
  }
  if (source === 'essai') {
    return <span style={{ background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Essai</span>;
  }
  if (source === 'paye' && props.afficherPaye) {
    return <span style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Payé</span>;
  }
  return null;
}

function resumeAction(a) {
  var avant = a.ancien_etat || {};
  var apres = a.nouvel_etat || {};
  var parties = [];
  if (a.action === 'paiement_manuel') {
    if (apres.plan) parties.push(libelle(PLANS, apres.plan));
    if (apres.montant) parties.push(GNF(apres.montant));
    if (apres.moyen) parties.push(libelle(MOYENS, apres.moyen));
    if (apres.reference) parties.push('réf. ' + apres.reference);
  } else {
    if (avant.plan || apres.plan) parties.push(libelle(PLANS, avant.plan) + ' → ' + libelle(PLANS, apres.plan));
    if (a.action === 'offrir') {
      parties.push(apres.offert_jusqu_au ? 'jusqu’au ' + formaterDateJour(apres.offert_jusqu_au) : 'illimité');
    }
  }
  return parties.join(' · ');
}

var champ = { width: '100%', boxSizing: 'border-box', margin: 0, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #D5D5D5', fontSize: 13, outline: 'none', background: 'var(--bg-secondary)', fontFamily: 'inherit' };
var etiquette = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 };
var boutonPrincipal = function(couleur, desactive) {
  return { padding: '10px 16px', borderRadius: 8, border: 'none', background: desactive ? '#B0B8B3' : couleur, color: '#fff', fontSize: 13, fontWeight: 700, cursor: desactive ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
};
var boutonSecondaire = { padding: '10px 16px', borderRadius: 8, border: '0.5px solid #D5D5D5', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
var carte = { background: 'var(--surface-soft)', borderRadius: 12, padding: 14, marginTop: 14 };

function Section(props) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {props.icone} {props.titre}
      </div>
      {props.children}
    </div>
  );
}

export default function PanneauAbonnement(props) {
  var userId   = props.userId;
  var onClose  = props.onClose;
  var onChange = props.onChange;

  var [data, setData]       = useState(null);
  var [erreur, setErreur]   = useState(null);
  var [envoi, setEnvoi]     = useState(false);
  var [mode, setMode]       = useState(null);

  var [planCible, setPlanCible]     = useState('gratuit');
  var [motifPlan, setMotifPlan]     = useState('');

  var [offre, setOffre] = useState({ plan: 'pro', duree: 3, motif: '', message: '' });
  var [revocation, setRevocation] = useState({ motif: '', message: '' });
  var [paiement, setPaiement] = useState({ plan: 'pro', duree: 1, montant: PRIX_MENSUEL.pro, moyen: 'orange_money', reference: '' });
  var [montantModifie, setMontantModifie] = useState(false);

  var panneauRef = useRef(null);
  var declencheurRef = useRef(null);

  function charger() {
    setErreur(null);
    return api.get('/admin/proprietaires/' + userId + '/abonnement')
      .then(function(res) {
        setData(res.data);
        setPlanCible(res.data.proprietaire.plan || 'gratuit');
      })
      .catch(function(err) {
        setErreur(err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : 'Impossible de charger l’abonnement.');
      });
  }

  useEffect(function() {
    declencheurRef.current = document.activeElement;
    charger();
    var precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return function() {
      document.body.style.overflow = precedent;
      if (declencheurRef.current && declencheurRef.current.focus) declencheurRef.current.focus();
    };
  }, [userId]);

  useEffect(function() {
    if (panneauRef.current) panneauRef.current.focus();
  }, []);

  useEffect(function() {
    function surTouche(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panneauRef.current) return;
      var focalisables = panneauRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (focalisables.length === 0) return;
      var premier = focalisables[0];
      var dernier = focalisables[focalisables.length - 1];
      var actif = document.activeElement;
      if (e.shiftKey && (actif === premier || actif === panneauRef.current)) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && actif === dernier) { e.preventDefault(); premier.focus(); }
    }
    document.addEventListener('keydown', surTouche);
    return function() { document.removeEventListener('keydown', surTouche); };
  }, [onClose]);

  function majPaiement(patch) {
    var suivant = Object.assign({}, paiement, patch);
    if (!montantModifie && (patch.plan || patch.duree)) {
      suivant.montant = PRIX_MENSUEL[suivant.plan] * suivant.duree;
    }
    setPaiement(suivant);
  }

  function executer(requete) {
    if (envoi) return;
    setEnvoi(true);
    requete()
      .then(function(res) {
        toast.success(res.data && res.data.message ? res.data.message : 'Opération effectuée');
        setMode(null);
        return charger().then(function() { if (onChange) onChange(); });
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : 'Une erreur est survenue');
      })
      .finally(function() { setEnvoi(false); });
  }

  var base = '/admin/proprietaires/' + userId;

  function appliquerPlan() {
    executer(function() { return api.patch(base + '/plan', { plan: planCible, motif: motifPlan.trim() || undefined }); });
    setMotifPlan('');
  }
  function offrirAcces() {
    executer(function() {
      return api.post(base + '/offrir', { plan: offre.plan, duree: offre.duree, motif: offre.motif, message_proprietaire: offre.message.trim() || undefined });
    });
  }
  function revoquerAcces() {
    executer(function() {
      return api.post(base + '/revoquer', { motif: revocation.motif.trim() || undefined, message_proprietaire: revocation.message.trim() || undefined });
    });
  }
  function enregistrerPaiement() {
    executer(function() {
      return api.post(base + '/paiement-manuel', {
        plan: paiement.plan, duree: paiement.duree, montant: Number(paiement.montant),
        moyen: paiement.moyen, reference: paiement.reference.trim() || undefined,
      });
    });
  }

  var prop = data && data.proprietaire;
  var abo  = data && data.abonnement;
  var source = abo ? abo.source : null;
  var estOffert = source === 'offert';

  var echeance = '';
  if (estOffert) echeance = abo.offert_jusqu_au ? 'Offert jusqu’au ' + formaterDateJour(abo.offert_jusqu_au) : 'Offert, sans limite de durée';
  else if (abo && abo.date_fin) echeance = 'Échéance le ' + formaterDateJour(abo.date_fin);
  else echeance = 'Pas d’échéance';

  var referenceRequise = paiement.moyen !== 'especes';
  var paiementValide = Number(paiement.montant) > 0 && (!referenceRequise || paiement.reference.trim().length > 0);
  var changementPlan = prop && planCible !== (prop.plan || 'gratuit');

  return (
    <div>
      <div onClick={onClose} aria-hidden="true"
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,20,0.45)', zIndex: 1000 }} />
      <aside ref={panneauRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Abonnement du propriétaire"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 100vw)', background: 'var(--bg-secondary)', zIndex: 1001, overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.18)', outline: 'none', fontFamily: 'var(--font-body)', animation: 'panneauAboEntree .22s ease-out' }}>
        <style>{'@keyframes panneauAboEntree { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }'}</style>

        <div style={{ position: 'sticky', top: 0, background: '#1B2B22', color: '#fff', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, zIndex: 2 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Abonnement</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prop ? prop.prenom + ' ' + prop.nom : 'Chargement…'}
            </div>
            {prop && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.email}</div>}
          </div>
          <button onClick={onClose} aria-label="Fermer le panneau"
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 34, height: 34, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: '4px 18px 32px' }}>
          {erreur && (
            <div style={{ ...carte, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 13 }}>
              {erreur}
              <div><button onClick={charger} style={{ ...boutonSecondaire, marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}><RefreshCw size={13} /> Réessayer</button></div>
            </div>
          )}
          {!data && !erreur && <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</div>}

          {data && (
            <div>
              <div style={carte}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Plan {libelle(PLANS, prop.plan || 'gratuit')}</span>
                  <BadgeSource source={source} offertJusqu={abo && abo.offert_jusqu_au} afficherPaye={prop.plan !== 'gratuit'} />
                  {prop.abonnement_bloque && <span style={{ background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 16, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Bloqué (impayé)</span>}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.7 }}>
                  {echeance}
                  {estOffert && abo.offert_motif && <span> · Motif : {libelle(MOTIFS, abo.offert_motif)}</span>}
                  {estOffert && abo.offert_par_nom && <span> · Par {abo.offert_par_nom}</span>}
                  <br />
                  {data.nb_biens} bien{data.nb_biens > 1 ? 's' : ''}
                  {data.biens_masques > 0 && <span style={{ color: 'var(--warn)', fontWeight: 600 }}> dont {data.biens_masques} masqué{data.biens_masques > 1 ? 's' : ''} (limite du plan)</span>}
                </div>
              </div>

              <Section titre="Changer le plan">
                <div style={{ display: 'flex', gap: 8 }}>
                  <select aria-label="Plan" value={planCible} onChange={function(e) { setPlanCible(e.target.value); }} style={{ ...champ, flex: 1 }}>
                    {PLANS.map(function(p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
                  </select>
                  <button onClick={appliquerPlan} disabled={envoi || !changementPlan} style={boutonPrincipal('#1B6B3A', envoi || !changementPlan)}>Appliquer</button>
                </div>
                {changementPlan && (
                  <input type="text" aria-label="Motif du changement" placeholder="Motif (facultatif, interne)" value={motifPlan}
                    onChange={function(e) { setMotifPlan(e.target.value); }} style={{ ...champ, marginTop: 8 }} />
                )}
                <div style={{ fontSize: 11, color: '#999', marginTop: 6, lineHeight: 1.5 }}>
                  Sur un compte non offert, seule la rétrogradation vers Gratuit est possible. Pour monter de plan, utilisez « Offrir l’accès » ou « Paiement manuel ». Les biens au-delà de la limite sont masqués, jamais supprimés.
                </div>
              </Section>

              <Section titre="Actions" icone={null}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={function() { setMode(mode === 'offrir' ? null : 'offrir'); }} aria-expanded={mode === 'offrir'}
                    style={{ ...boutonPrincipal('#6A1B9A', false), opacity: mode && mode !== 'offrir' ? 0.7 : 1 }}>
                    <Gift size={14} strokeWidth={2} /> Offrir l’accès
                  </button>
                  {estOffert && (
                    <button onClick={function() { setMode(mode === 'revoquer' ? null : 'revoquer'); }} aria-expanded={mode === 'revoquer'}
                      style={{ ...boutonPrincipal('#B71C1C', false), opacity: mode && mode !== 'revoquer' ? 0.7 : 1 }}>
                      <Ban size={14} strokeWidth={2} /> Révoquer
                    </button>
                  )}
                  <button onClick={function() { setMode(mode === 'paiement' ? null : 'paiement'); }} aria-expanded={mode === 'paiement'}
                    style={{ ...boutonPrincipal('#1565C0', false), opacity: mode && mode !== 'paiement' ? 0.7 : 1 }}>
                    <Banknote size={14} strokeWidth={2} /> Paiement manuel
                  </button>
                </div>

                {mode === 'offrir' && (
                  <div style={{ ...carte, border: '1px solid #E1BEE7', background: '#FBF5FC' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)', marginBottom: 10 }}>Offrir l’accès</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={etiquette} htmlFor="offre-plan">Plan</label>
                        <select id="offre-plan" value={offre.plan} onChange={function(e) { setOffre(Object.assign({}, offre, { plan: e.target.value })); }} style={champ}>
                          <option value="pro">Pro</option>
                          <option value="agence">Agence</option>
                        </select>
                      </div>
                      <div>
                        <label style={etiquette} htmlFor="offre-duree">Durée</label>
                        <select id="offre-duree" value={String(offre.duree)} onChange={function(e) {
                          var v = e.target.value; setOffre(Object.assign({}, offre, { duree: v === 'illimite' ? v : Number(v) }));
                        }} style={champ}>
                          {DUREES_OFFRE.map(function(d) { return <option key={d.id} value={String(d.id)}>{d.label}</option>; })}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={etiquette} htmlFor="offre-motif">Motif (obligatoire, interne)</label>
                      <select id="offre-motif" value={offre.motif} onChange={function(e) { setOffre(Object.assign({}, offre, { motif: e.target.value })); }} style={champ}>
                        <option value="">Choisir un motif…</option>
                        {MOTIFS.map(function(m) { return <option key={m.id} value={m.id}>{m.label}</option>; })}
                      </select>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={etiquette} htmlFor="offre-message">Message au propriétaire (facultatif)</label>
                      <textarea id="offre-message" rows={3} value={offre.message} onChange={function(e) { setOffre(Object.assign({}, offre, { message: e.target.value })); }}
                        placeholder="Ex. : Merci pour votre confiance, profitez de Werdhe Pro !" style={{ ...champ, resize: 'vertical' }} />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4, lineHeight: 1.5 }}>
                        Envoyé par e-mail au propriétaire. Distinct du motif interne, qui n’est jamais communiqué.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={offrirAcces} disabled={envoi || !offre.motif} style={boutonPrincipal('#6A1B9A', envoi || !offre.motif)}>
                        {envoi ? 'Envoi…' : 'Confirmer l’offre'}
                      </button>
                      <button onClick={function() { setMode(null); }} style={boutonSecondaire}>Annuler</button>
                    </div>
                  </div>
                )}

                {mode === 'revoquer' && estOffert && (
                  <div style={{ ...carte, border: '1px solid var(--danger)', background: '#FFF8F8' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>Révoquer l’accès offert</div>
                    <div style={{ fontSize: 12, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>
                      Le compte repasse au plan Gratuit immédiatement. Aucune donnée n’est supprimée : les biens au-delà de la limite sont masqués.
                    </div>
                    <label style={etiquette} htmlFor="rev-motif">Motif (facultatif, interne)</label>
                    <input id="rev-motif" type="text" value={revocation.motif} onChange={function(e) { setRevocation(Object.assign({}, revocation, { motif: e.target.value })); }} style={champ} />
                    <div style={{ marginTop: 10 }}>
                      <label style={etiquette} htmlFor="rev-message">Message au propriétaire (facultatif)</label>
                      <textarea id="rev-message" rows={3} value={revocation.message} onChange={function(e) { setRevocation(Object.assign({}, revocation, { message: e.target.value })); }} style={{ ...champ, resize: 'vertical' }} />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4, lineHeight: 1.5 }}>
                        Envoyé par e-mail au propriétaire. Distinct du motif interne, qui n’est jamais communiqué.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={revoquerAcces} disabled={envoi} style={boutonPrincipal('#B71C1C', envoi)}>
                        {envoi ? 'Envoi…' : 'Confirmer la révocation'}
                      </button>
                      <button onClick={function() { setMode(null); }} style={boutonSecondaire}>Annuler</button>
                    </div>
                  </div>
                )}

                {mode === 'paiement' && (
                  <div style={{ ...carte, border: '1px solid var(--info)', background: '#F5FAFE' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)', marginBottom: 10 }}>Enregistrer un paiement manuel</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={etiquette} htmlFor="pai-plan">Plan</label>
                        <select id="pai-plan" value={paiement.plan} onChange={function(e) { majPaiement({ plan: e.target.value }); }} style={champ}>
                          <option value="pro">Pro</option>
                          <option value="agence">Agence</option>
                        </select>
                      </div>
                      <div>
                        <label style={etiquette} htmlFor="pai-duree">Durée</label>
                        <select id="pai-duree" value={String(paiement.duree)} onChange={function(e) { majPaiement({ duree: Number(e.target.value) }); }} style={champ}>
                          {DUREES_PAIEMENT.map(function(d) { return <option key={d.id} value={String(d.id)}>{d.label}</option>; })}
                        </select>
                      </div>
                      <div>
                        <label style={etiquette} htmlFor="pai-montant">Montant (GNF)</label>
                        <input id="pai-montant" type="number" min="1" step="1000" value={paiement.montant}
                          onChange={function(e) { setMontantModifie(true); setPaiement(Object.assign({}, paiement, { montant: e.target.value })); }} style={champ} />
                      </div>
                      <div>
                        <label style={etiquette} htmlFor="pai-moyen">Moyen</label>
                        <select id="pai-moyen" value={paiement.moyen} onChange={function(e) { setPaiement(Object.assign({}, paiement, { moyen: e.target.value })); }} style={champ}>
                          {MOYENS.map(function(m) { return <option key={m.id} value={m.id}>{m.label}</option>; })}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={etiquette} htmlFor="pai-ref">Référence{referenceRequise ? ' (obligatoire)' : ' (facultative pour les espèces)'}</label>
                      <input id="pai-ref" type="text" value={paiement.reference} onChange={function(e) { setPaiement(Object.assign({}, paiement, { reference: e.target.value })); }}
                        placeholder="N° de transaction ou de virement" style={champ} />
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 8, lineHeight: 1.5 }}>
                      Crée une facture payée et active le plan. Montant pré-rempli au tarif mensuel × durée, modifiable.
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      <button onClick={enregistrerPaiement} disabled={envoi || !paiementValide} style={boutonPrincipal('#1565C0', envoi || !paiementValide)}>
                        {envoi ? 'Envoi…' : 'Enregistrer le paiement'}
                      </button>
                      <button onClick={function() { setMode(null); }} style={boutonSecondaire}>Annuler</button>
                    </div>
                  </div>
                )}
              </Section>

              <Section titre="Historique des actions admin" icone={<History size={14} strokeWidth={2} />}>
                {data.historique.length === 0 && <div style={{ fontSize: 12, color: '#999' }}>Aucune action enregistrée.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.historique.map(function(a) {
                    var resume = resumeAction(a);
                    return (
                      <div key={a.id} style={{ borderLeft: '3px solid ' + (a.action === 'revoquer' || a.action === 'expiration_auto' ? '#E57373' : a.action === 'paiement_manuel' ? '#64B5F6' : '#BA68C8'), background: 'var(--surface-soft)', borderRadius: '0 10px 10px 0', padding: '8px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ACTIONS[a.action] || a.action}</span>
                          <span style={{ fontSize: 11, color: '#999' }}>{formaterDateHeure(a.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Par {a.admin_nom || 'Système'}{resume ? ' · ' + resume : ''}</div>
                        {a.motif && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Motif : {libelle(MOTIFS, a.motif)}</div>}
                        {a.message_proprietaire && <div style={{ fontSize: 11, color: '#999', marginTop: 2, fontStyle: 'italic' }}>Message envoyé au propriétaire</div>}
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section titre="Dernières factures" icone={<Receipt size={14} strokeWidth={2} />}>
                {data.factures.length === 0 && <div style={{ fontSize: 12, color: '#999' }}>Aucune facture.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.factures.map(function(f) {
                    return (
                      <div key={f.id} style={{ background: 'var(--surface-soft)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {libelle(PLANS, f.plan)} · {GNF(f.montant)}
                            {f.origine === 'manuel' && <span style={{ background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 16, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>Manuel</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {formaterDateJour(f.periode_debut)} → {formaterDateJour(f.periode_fin)}
                            {f.operateur ? ' · ' + libelle(MOYENS, f.operateur) : ''}
                            {f.reference_externe ? ' · réf. ' + f.reference_externe : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.statut === 'payee' ? 'var(--green)' : f.statut === 'annulee' ? 'var(--danger)' : 'var(--warn)', alignSelf: 'center' }}>
                          {f.statut === 'payee' ? 'Payée' : f.statut === 'annulee' ? 'Annulée' : 'Émise'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
