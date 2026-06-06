/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

var STATUT_CONFIG = {
  paye:      { label: 'Paye ✓',   bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7', barColor: '#1B6B3A' },
  impaye:    { label: 'Non paye', bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2', barColor: '#E53935' },
  en_retard: { label: 'En retard',bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082', barColor: '#C8860A' },
};

var PAY_MODES = [
  { id: 'om',   label: 'Orange Money',     sub: 'Paiement instantane',           color: '#FF6600', text: '#fff',    abbr: 'OM' },
  { id: 'mtn',  label: 'MTN MoMo',         sub: 'Paiement instantane',           color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
  { id: 'cash', label: 'Especes',           sub: 'Recu PDF genere automatiquement', icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA',       icon: '🏦' },
];

var MON_LOGEMENT_MOCK = {
  nom:      'Mon logement',
  proprio:  'Proprietaire',
  quartier: 'Conakry',
  loyer:    1500000,
  caution:  1500000,
  debut:    '1er juillet 2025',
  fin:      '30 juin 2026',
};

// ─── ONGLET PAIEMENTS PROPRIÉTAIRE ───────────────────────────────────────────
export function OngletPaiementsProprietaire(props) {
  var stats = props.stats || { paiements: [], logements: [] };

  // Construire la liste des biens avec statut de paiement
  var biens = stats.logements.map(function(l) {
    var dernierPaie = stats.paiements.find(function(p) {
      return p.logement_id === l.id && p.statut === 'complete';
    });
    var enAttente = stats.paiements.find(function(p) {
      return p.logement_id === l.id && p.statut === 'en_attente';
    });
    var statutPaie = dernierPaie ? 'paye' : enAttente ? 'en_retard' : 'impaye';
    var joursRetard = enAttente ? 5 : 0;
    return {
      id:        l.id,
      nom:       l.titre,
      locataire: '—',
      quartier:  l.ville,
      loyer:     Number(l.prix_mensuel),
      statut:    l.statut === 'loue' ? statutPaie : 'impaye',
      jours:     joursRetard,
      icon:      '🏠',
    };
  });

  // Données de démonstration si pas de logements
  if (biens.length === 0) {
    biens = [
      { id: '1', nom: 'Villa Ratoma',    locataire: 'Mamadou Diallo',    quartier: 'Ratoma', loyer: 2500000, statut: 'en_retard', jours: 12, icon: '🏠' },
      { id: '2', nom: 'Appart Kaloum 2', locataire: 'Fatoumata Camara',  quartier: 'Kaloum', loyer: 1800000, statut: 'impaye',    jours: 3,  icon: '🏢' },
      { id: '3', nom: 'Studio Matam',    locataire: 'Sekou Konate',      quartier: 'Matam',  loyer: 900000,  statut: 'paye',      jours: 0,  icon: '🏠' },
    ];
  }

  var [biensList,     setBiensList]     = useState(biens);
  var [filterStatut,  setFilterStatut]  = useState('tous');
  var [modal,         setModal]         = useState(null);
  var [selectedMode,  setSelectedMode]  = useState('om');
  var [processing,    setProcessing]    = useState(false);
  var [done,          setDone]          = useState(false);

  function openModal(bien) {
    setModal(bien);
    setSelectedMode('om');
    setProcessing(false);
    setDone(false);
  }

  function closeModal() { setModal(null); setDone(false); }

  function confirmerPaiement() {
    setProcessing(true);
    setTimeout(function() {
      setProcessing(false);
      setDone(true);
      setBiensList(function(prev) {
        return prev.map(function(b) { return b.id === modal.id ? Object.assign({}, b, { statut: 'paye', jours: 0 }) : b; });
      });
      // Enregistrer en base si ID réel
      if (modal.id && typeof modal.id !== 'string') {
        api.post('/paiements', { logement_id: modal.id, montant: modal.loyer, mode_paiement: selectedMode }).catch(console.error);
      }
    }, 2000);
  }

  function exporter() {
    var lignes = ['Bien,Locataire,Montant,Statut'];
    biensList.forEach(function(b) { lignes.push([b.nom, b.locataire, b.loyer, b.statut].join(',')); });
    var blob = new Blob([lignes.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url; link.download = 'paiements_werdhe.csv';
    document.body.appendChild(link); link.click(); link.remove();
    toast.success('Export CSV lance !');
  }

  var totalAttendu  = biensList.reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalPercu    = biensList.filter(function(b) { return b.statut === 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalImpaye   = biensList.filter(function(b) { return b.statut !== 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var tauxRecouv    = totalAttendu > 0 ? Math.round(totalPercu / totalAttendu * 100) : 0;

  var moisActuel    = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  var filtered      = filterStatut === 'tous' ? biensList : biensList.filter(function(b) { return b.statut === filterStatut; });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px', padding: '0' }}>

      {/* HEADER */}
      <div style={{ background: '#1B6B3A', borderRadius: '14px', padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', marginBottom: '2px' }}>Gestion des paiements</div>
        <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px' }}>{moisActuel} · {biensList.length} biens en gestion</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
        <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '12px 14px', borderLeft: '3px solid #1B6B3A' }}>
          <div style={{ fontSize: '11px', color: '#1B5E20', marginBottom: '4px' }}>Encaisse</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(totalPercu)}</div>
          <div style={{ fontSize: '10px', color: '#2E7D32', marginTop: '2px' }}>Taux : {tauxRecouv}%</div>
        </div>
        <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '12px 14px', borderLeft: '3px solid #E53935' }}>
          <div style={{ fontSize: '11px', color: '#B71C1C', marginBottom: '4px' }}>Impayes</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#C62828' }}>{GNF(totalImpaye)}</div>
          <div style={{ fontSize: '10px', color: '#B71C1C', marginTop: '2px' }}>{biensList.filter(function(b) { return b.statut !== 'paye'; }).length} locataire(s)</div>
        </div>
        <div style={{ background: '#F0F4F1', borderRadius: '12px', padding: '12px 14px', borderLeft: '3px solid #888' }}>
          <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>Attendu</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#333' }}>{GNF(totalAttendu)}</div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Total du mois</div>
        </div>
      </div>

      {/* BARRE DE RECOUVREMENT */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Progression du recouvrement</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1B6B3A' }}>{tauxRecouv}%</span>
        </div>
        <div style={{ background: '#F0F0F0', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: tauxRecouv + '%', height: '100%', borderRadius: '6px', transition: 'width .5s' }} />
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto' }}>
        {[['tous','Tous','#1B6B3A'],['paye','Payes','#1B6B3A'],['impaye','Non payes','#C62828'],['en_retard','En retard','#C8860A']].map(function(f) {
          return (
            <button key={f[0]} type="button" onClick={function() { setFilterStatut(f[0]); }}
              style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                border:      filterStatut === f[0] ? '1.5px solid ' + f[2] : '0.5px solid #E0E0E0',
                background:  filterStatut === f[0] ? f[2] : '#fff',
                color:       filterStatut === f[0] ? '#fff' : '#666',
                fontWeight:  filterStatut === f[0] ? 700 : 400,
              }}>
              {f[1]}
            </button>
          );
        })}
        <button type="button" onClick={exporter}
          style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, border: '0.5px solid #1B6B3A', background: '#fff', color: '#1B6B3A', fontWeight: '600' }}>
          Exporter CSV
        </button>
      </div>

      {/* LISTE DES BIENS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '14px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            Aucun bien dans cette categorie
          </div>
        )}
        {filtered.map(function(b) {
          var s = STATUT_CONFIG[b.statut] || STATUT_CONFIG.impaye;
          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)', borderLeft: '4px solid ' + s.barColor }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: '#F0F4F1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>{b.nom}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{b.locataire} · {b.quartier}</div>
                  </div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color, border: '0.5px solid ' + s.border, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#F8F8F8', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '10px', color: '#888' }}>Loyer mensuel</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(b.loyer)}</div>
                </div>
                <div style={{ background: '#F8F8F8', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '10px', color: '#888' }}>Situation</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: s.color }}>
                    {b.statut === 'paye' ? 'Paye ce mois' : b.statut === 'en_retard' ? 'Retard : ' + b.jours + ' jours' : 'Du depuis ' + b.jours + ' jours'}
                  </div>
                </div>
              </div>

              {b.statut === 'paye' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" style={{ flex: 1, background: '#F0F4F1', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: '10px', padding: '9px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                    Voir la quittance
                  </button>
                  <button type="button" style={{ flex: 1, background: '#F5F5F5', color: '#555', border: '0.5px solid #E0E0E0', borderRadius: '10px', padding: '9px', fontSize: '13px', cursor: 'pointer' }}>
                    Contacter
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={function() { openModal(b); }}
                    style={{ flex: 2, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    Enregistrer le paiement
                  </button>
                  <button type="button" style={{ flex: 1, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                    Relancer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL PAIEMENT */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}
          onClick={function(e) { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: '600px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>

            {!done ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B2B22' }}>Enregistrer un paiement</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{modal.nom} · {modal.locataire}</div>
                  </div>
                  <button type="button" onClick={closeModal}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>

                <div style={{ background: '#F0F4F1', borderRadius: '12px', padding: '14px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#555' }}>Montant du loyer</div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                      {modal.statut === 'en_retard' ? 'En retard de ' + modal.jours + ' jours' : 'Impaye depuis ' + modal.jours + ' jours'}
                    </div>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(modal.loyer)}</div>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1B2B22', marginBottom: '12px' }}>Mode de paiement</div>
                {PAY_MODES.map(function(p) {
                  return (
                    <div key={p.id} onClick={function() { setSelectedMode(p.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                        border:     selectedMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                        background: selectedMode === p.id ? '#F0F4F1' : '#fff',
                        borderRadius: '12px', marginBottom: '8px', cursor: 'pointer', transition: 'all .2s',
                      }}>
                      <div style={{ width: '40px', height: '40px', background: p.color || '#E8F5E9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? '20px' : '13px', fontWeight: '700', color: p.text || '#1B6B3A', flexShrink: 0 }}>
                        {p.icon || p.abbr}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1B2B22' }}>{p.label}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>{p.sub}</div>
                      </div>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: selectedMode === p.id ? 'none' : '1.5px solid #E0E0E0', background: selectedMode === p.id ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedMode === p.id && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                      </div>
                    </div>
                  );
                })}

                {selectedMode === 'cash' && (
                  <div style={{ background: '#FFF8E1', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
                    <span>ℹ️</span>
                    <span style={{ fontSize: '12px', color: '#7B4F00', lineHeight: '1.5' }}>Le locataire recoit une quittance PDF par SMS des que vous confirmez le paiement en especes.</span>
                  </div>
                )}

                <button type="button" onClick={confirmerPaiement} disabled={processing}
                  style={{ width: '100%', background: processing ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: processing ? 'not-allowed' : 'pointer', marginTop: '6px' }}>
                  {processing ? 'Traitement en cours...' : 'Confirmer le paiement — ' + GNF(modal.loyer)}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '70px', height: '70px', background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '36px' }}>✅</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#1B6B3A', marginBottom: '8px' }}>Paiement enregistre !</div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                  Le loyer de <strong>{GNF(modal.loyer)}</strong> pour <strong>{modal.locataire || modal.nom}</strong> est confirme.<br/>
                  Une quittance PDF a ete generee et envoyee au locataire.
                </div>
                <div style={{ background: '#F0F4F1', borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Recapitulatif</div>
                  {[
                    ['Bien',      modal.nom],
                    ['Montant',   GNF(modal.loyer)],
                    ['Mode',      (PAY_MODES.find(function(p) { return p.id === selectedMode; }) || {}).label],
                    ['Date',      "Aujourd'hui · " + new Date().toLocaleDateString('fr-FR')],
                    ['Statut',    'Paye ✅'],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', padding: '4px 0', borderBottom: '0.5px solid #F0F0F0' }}>
                        <span style={{ fontWeight: '600' }}>{row[0]}</span><span>{row[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" style={{ flex: 1, background: '#F0F4F1', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                    Voir la quittance
                  </button>
                  <button type="button" onClick={closeModal}
                    style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
                    Retour a la liste
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ONGLET PAIEMENTS LOCATAIRE ───────────────────────────────────────────────
export function OngletPaiementsLocataire(props) {
  var stats = props.stats || { reservations: [], paiements: [] };
  var [nbMois,    setNbMois]    = useState(1);
  var [mode,      setMode]      = useState('om');
  var [stepPay,   setStepPay]   = useState('select'); // select | success
  var [monLogement, setMonLogement] = useState(null);

  useEffect(function() {
    var resaActive = (stats.reservations || []).find(function(r) { return r.statut === 'confirmee'; });
    if (resaActive) {
      setMonLogement({
        nom:     resaActive.logement_titre || 'Mon logement',
        proprio: (resaActive.proprietaire_prenom || '') + ' ' + (resaActive.proprietaire_nom || ''),
        propIni: ((resaActive.proprietaire_prenom || '').charAt(0) + (resaActive.proprietaire_nom || '').charAt(0)).toUpperCase() || 'P',
        quartier:resaActive.logement_ville  || 'Conakry',
        loyer:   Number(resaActive.montant_total) || 1500000,
        caution: Number(resaActive.montant_total) || 1500000,
        debut:   resaActive.date_debut ? new Date(resaActive.date_debut).toLocaleDateString('fr-FR') : '—',
        fin:     resaActive.date_fin   ? new Date(resaActive.date_fin).toLocaleDateString('fr-FR')   : '—',
      });
    } else {
      setMonLogement({
        nom: 'Appartement F3 — Ratoma', proprio: 'Mamadou Barry', propIni: 'MB',
        quartier: 'Ratoma, Conakry', loyer: 1500000, caution: 1500000,
        debut: '1er juillet 2025', fin: '30 juin 2026',
      });
    }
  }, [stats]);

  var addMonths = function(n) {
    var d = new Date(); d.setMonth(d.getMonth() + n);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  var moisActuel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  var total      = (monLogement ? monLogement.loyer : 0) * nbMois;
  var historiqueLocal = [
    { mois: 'Mois precedent',     montant: monLogement ? monLogement.loyer : 0, statut: 'paye', mode: 'Orange Money' },
    { mois: 'Il y a 2 mois',      montant: monLogement ? monLogement.loyer : 0, statut: 'paye', mode: 'Especes'       },
    { mois: 'Il y a 3 mois',      montant: monLogement ? monLogement.loyer : 0, statut: 'paye', mode: 'MTN MoMo'     },
  ];

  var paiementsReels = (stats.paiements || []).slice(0, 3).map(function(p) {
    return { mois: new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), montant: Number(p.montant), statut: p.statut === 'complete' ? 'paye' : 'en_attente', mode: p.mode_paiement === 'en_ligne' ? 'En ligne' : 'Especes' };
  });
  var historique = paiementsReels.length > 0 ? paiementsReels : historiqueLocal;

  if (!monLogement) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Chargement...</div>;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '600px' }}>

      {/* HEADER */}
      <div style={{ background: '#1A4FA0', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Mes paiements</div>
        <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '12px', marginTop: '2px' }}>Mon logement · {moisActuel}</div>
      </div>

      {/* FICHE LOGEMENT */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ width: '52px', height: '52px', background: '#E3F2FD', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🏢</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1B2B22' }}>{monLogement.nom}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>📍 {monLogement.quartier}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <div style={{ width: '26px', height: '26px', background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700' }}>{monLogement.propIni}</div>
              <span style={{ fontSize: '12px', color: '#555' }}>{monLogement.proprio}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1A4FA0' }}>{GNF(monLogement.loyer)}</div>
            <div style={{ fontSize: '10px', color: '#888' }}>/ mois</div>
          </div>
        </div>

        {/* Infos bail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[['Debut bail', monLogement.debut],['Fin bail', monLogement.fin],['Caution', GNF(monLogement.caution)]].map(function(row) {
            return (
              <div key={row[0]} style={{ background: '#F8F8F8', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: '#888' }}>{row[0]}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#333', marginTop: '2px' }}>{row[1]}</div>
              </div>
            );
          })}
        </div>

        {/* Statut loyer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: stepPay === 'success' ? '#E8F5E9' : '#FFEBEE', borderRadius: '10px', marginBottom: '14px', border: '0.5px solid ' + (stepPay === 'success' ? '#A5D6A7' : '#FFCDD2') }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: stepPay === 'success' ? '#1B6B3A' : '#B71C1C' }}>
              {stepPay === 'success' ? 'Loyer paye — ' + moisActuel : 'Loyer impaye — ' + moisActuel}
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              {stepPay === 'success' ? 'Quittance envoyee par SMS' : 'Du depuis 3 jours'}
            </div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: stepPay === 'success' ? '#1B6B3A' : '#C62828' }}>{GNF(monLogement.loyer)}</div>
        </div>

        {/* Historique */}
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2B22', marginBottom: '8px' }}>Historique recent</div>
        {historique.map(function(h, i) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F8F8F8', borderRadius: '8px', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2B22' }}>{h.mois}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{h.mode}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1B6B3A' }}>{GNF(h.montant)}</span>
                <span style={{ background: '#E8F5E9', color: '#1B5E20', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>Paye</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ZONE DE PAIEMENT */}
      {stepPay !== 'success' ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1B2B22', marginBottom: '14px' }}>Effectuer un paiement</div>

          {/* CHOIX NOMBRE DE MOIS */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2B22', marginBottom: '10px' }}>Combien de mois souhaitez-vous payer ?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[[1,'1 mois'],[2,'2 mois'],[3,'3 mois'],[6,'6 mois'],[12,'1 an']].map(function(opt) {
                return (
                  <button key={opt[0]} type="button" onClick={function() { setNbMois(opt[0]); }}
                    style={{ padding: '10px 4px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                      border:     nbMois === opt[0] ? '2px solid #1A4FA0' : '0.5px solid #E0E0E0',
                      background: nbMois === opt[0] ? '#E3F2FD' : '#FAFAFA',
                      color:      nbMois === opt[0] ? '#0D47A1' : '#555',
                      fontWeight: nbMois === opt[0] ? 700 : 400,
                    }}>
                    {opt[1]}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#0D47A1', fontWeight: '600' }}>Periode couverte</div>
                <div style={{ fontSize: '11px', color: '#1565C0', marginTop: '2px' }}>
                  {moisActuel} &rarr; {addMonths(nbMois - 1)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#888' }}>{nbMois} × {GNF(monLogement.loyer)}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1A4FA0' }}>{GNF(total)}</div>
              </div>
            </div>
          </div>

          {/* CHOIX MODE */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1B2B22', marginBottom: '10px' }}>Mode de paiement</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PAY_MODES.map(function(p) {
                return (
                  <div key={p.id} onClick={function() { setMode(p.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', cursor: 'pointer', transition: 'all .2s',
                      border:     mode === p.id ? '2px solid #1A4FA0' : '0.5px solid #E0E0E0',
                      background: mode === p.id ? '#E3F2FD' : '#fff',
                      borderRadius: '10px',
                    }}>
                    <div style={{ width: '34px', height: '34px', background: p.color || '#E8F5E9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? '18px' : '11px', fontWeight: '700', color: p.text || '#1B6B3A', flexShrink: 0 }}>
                      {p.icon || p.abbr}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2B22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>{p.sub}</div>
                    </div>
                    {mode === p.id && <span style={{ color: '#1A4FA0', fontSize: '14px', flexShrink: 0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECAP */}
          <div style={{ background: '#F8F8F8', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#1B2B22', marginBottom: '8px' }}>Recapitulatif</div>
            {[
              ['Bien',           monLogement.nom],
              ['Proprietaire',   monLogement.proprio],
              ['Nombre de mois', nbMois + ' mois (' + moisActuel + ' → ' + addMonths(nbMois - 1) + ')'],
              ['Mode',           (PAY_MODES.find(function(p) { return p.id === mode; }) || {}).label],
              ['Total a payer',  GNF(total)],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', padding: '4px 0', borderBottom: '0.5px solid #EFEFEF' }}>
                  <span style={{ color: '#888' }}>{row[0]}</span>
                  <span style={{ fontWeight: '600', color: row[0] === 'Total a payer' ? '#1A4FA0' : '#333', maxWidth: '200px', textAlign: 'right' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={function() { setStepPay('success'); toast.success('Paiement effectue ! Quittance generee.'); }}
            style={{ width: '100%', background: '#1A4FA0', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            Confirmer le paiement — {GNF(total)}
          </button>
        </div>
      ) : (
        <div style={{ background: '#E8F5E9', borderRadius: '14px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B6B3A', marginBottom: '6px' }}>Paiement effectue avec succes !</div>
          <div style={{ fontSize: '13px', color: '#2E7D32', lineHeight: '1.6', marginBottom: '16px' }}>
            {GNF(total)} paye pour <strong>{nbMois} mois</strong> via <strong>{(PAY_MODES.find(function(p) { return p.id === mode; }) || {}).label}</strong>.<br/>
            Une quittance PDF a ete envoyee par SMS.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button type="button" onClick={function() { setStepPay('select'); }}
              style={{ background: '#fff', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
              Voir quittance
            </button>
            <button type="button" onClick={function() { setStepPay('select'); }}
              style={{ background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}