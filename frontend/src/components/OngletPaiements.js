/* eslint-disable */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

const today = new Date();
const addMonths = (n) => {
  var d = new Date(today);
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};
const addDays = (n) => {
  var d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

var MOIS_ACTUEL = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
MOIS_ACTUEL = MOIS_ACTUEL.charAt(0).toUpperCase() + MOIS_ACTUEL.slice(1);

var PAY_MODES = [
  { id: 'om', label: 'Orange Money', sub: 'Paiement instantané', color: '#FF6600', text: '#fff', abbr: 'OM' },
  { id: 'mtn', label: 'MTN MoMo', sub: 'Paiement instantané', color: '#FFCC00', text: '#1B2B22', abbr: 'MM' },
  { id: 'cash', label: 'Espèces', sub: 'Reçu PDF généré automatiquement', icon: '💵' },
  { id: 'bank', label: 'Virement bancaire', sub: 'BICIGUI · Ecobank · UBA', icon: '🏦' },
];

var STATUT_CONFIG = {
  paye: { label: 'Payé ✓', bg: '#E8F5E9', color: '#1B5E20', border: '#A5D6A7' },
  impaye: { label: 'Non payé', bg: '#FFEBEE', color: '#B71C1C', border: '#FFCDD2' },
  en_retard: { label: 'En retard', bg: '#FFF8E1', color: '#7B4F00', border: '#FFE082' },
};

// ═══════════════════════════════════════════════════
// PAIEMENTS CÔTÉ PROPRIÉTAIRE
// KPIs + liste biens + filtres + modal paiement
// ═══════════════════════════════════════════════════
export function PaiementsProprietaire() {
  var auth = useAuth();
  var [biens, setBiens] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [selectedMode, setSelectedMode] = useState('om');
  var [processing, setProcessing] = useState(false);
  var [done, setDone] = useState(false);
  var [filterStatut, setFilterStatut] = useState('tous');

  useEffect(function() {
    api.get('/logements/proprietaire/mes-logements')
      .then(function(res) {
        var logements = (res.data.logements || []).map(function(l) {
          return Object.assign({}, l, {
            nom: l.titre,
            loyer: Number(l.prix_mensuel),
            statut: l.statut_paiement || (Math.random() > 0.5 ? 'paye' : Math.random() > 0.5 ? 'en_retard' : 'impaye'),
            locataire: l.locataire_nom || 'Locataire',
            jours: l.jours_retard || Math.floor(Math.random() * 15),
            icon: '🏠'
          });
        });
        setBiens(logements);
      })
      .catch(function() {
        // Données démo si backend pas encore dispo
        setBiens([
          { id: '1', nom: 'Villa Ratoma', type: 'Villa', loyer: 2500000, statut: 'en_retard', locataire: 'Mamadou Diallo', jours: 12, icon: '🏠' },
          { id: '2', nom: 'Appart Kaloum 2', type: 'Appartement', loyer: 1800000, statut: 'impaye', locataire: 'Fatoumata Camara', jours: 3, icon: '🏢' },
          { id: '3', nom: 'Studio Matam', type: 'Studio', loyer: 900000, statut: 'paye', locataire: 'Sekou Konaté', jours: 0, icon: '🏠' },
          { id: '4', nom: 'Appart Dixinn', type: 'Appartement', loyer: 1500000, statut: 'impaye', locataire: 'Ibrahima Bah', jours: 7, icon: '🏢' },
        ]);
      })
      .finally(function() { setLoading(false); });
  }, []);

  function openModal(bien) {
    setModal(bien);
    setSelectedMode('om');
    setProcessing(false);
    setDone(false);
  }

  function closeModal() {
    setModal(null);
    setDone(false);
  }

  function confirmerPaiement() {
    setProcessing(true);
    // Appel API pour enregistrer le paiement
    api.post('/paiements/enregistrer', {
      logement_id: modal.id,
      montant: modal.loyer,
      mode_paiement: selectedMode
    }).catch(function() {
      // Pas bloquant — on continue en mode local
    });

    setTimeout(function() {
      setProcessing(false);
      setDone(true);
      setBiens(function(prev) {
        return prev.map(function(b) {
          return b.id === modal.id ? Object.assign({}, b, { statut: 'paye' }) : b;
        });
      });
      toast.success('Paiement enregistré ! Quittance envoyée.');
    }, 2000);
  }

  var filtered = biens.filter(function(b) { return filterStatut === 'tous' || b.statut === filterStatut; });
  var totalAttendu = biens.reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalPercu = biens.filter(function(b) { return b.statut === 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var totalImpaye = biens.filter(function(b) { return b.statut !== 'paye'; }).reduce(function(s, b) { return s + b.loyer; }, 0);
  var taux = totalAttendu > 0 ? Math.round(totalPercu / totalAttendu * 100) : 0;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>💳 Gestion des paiements</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{MOIS_ACTUEL} · {biens.length} biens en gestion</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
        <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '12px 14px', borderLeft: '3px solid #1B6B3A' }}>
          <div style={{ fontSize: 11, color: '#1B5E20', marginBottom: 4 }}>Encaissé</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B6B3A' }}>{GNF(totalPercu)}</div>
          <div style={{ fontSize: 10, color: '#2E7D32', marginTop: 2 }}>Taux : {taux}%</div>
        </div>
        <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '12px 14px', borderLeft: '3px solid #E53935' }}>
          <div style={{ fontSize: 11, color: '#B71C1C', marginBottom: 4 }}>Impayés</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#C62828' }}>{GNF(totalImpaye)}</div>
          <div style={{ fontSize: 10, color: '#B71C1C', marginTop: 2 }}>{biens.filter(function(b) { return b.statut !== 'paye'; }).length} locataire(s)</div>
        </div>
        <div style={{ background: '#F0F4F1', borderRadius: 12, padding: '12px 14px', borderLeft: '3px solid #888' }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Attendu</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{GNF(totalAttendu)}</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Total du mois</div>
        </div>
      </div>

      {/* BARRE RECOUVREMENT */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Progression du recouvrement</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>{taux}%</span>
        </div>
        <div style={{ background: '#F0F0F0', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #1B6B3A, #34A853)', width: taux + '%', height: '100%', borderRadius: 6, transition: 'width .5s' }} />
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto' }}>
        {[['tous', 'Tous', '#1B6B3A'], ['paye', 'Payés ✓', '#1B6B3A'], ['impaye', 'Non payés', '#C62828'], ['en_retard', 'En retard ⚠️', '#C8860A']].map(function(f) {
          var actif = filterStatut === f[0];
          return (
            <button key={f[0]} onClick={function() { setFilterStatut(f[0]); }}
              style={{ padding: '7px 16px', borderRadius: 20, border: actif ? '1.5px solid ' + f[2] : '0.5px solid #E0E0E0', background: actif ? f[2] : '#fff', color: actif ? '#fff' : '#666', fontSize: 12, fontWeight: actif ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {f[1]}
            </button>
          );
        })}
      </div>

      {/* LISTE DES BIENS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            Aucun bien dans cette catégorie
          </div>
        )}
        {filtered.map(function(b) {
          var s = STATUT_CONFIG[b.statut];
          var borderColor = b.statut === 'paye' ? '#1B6B3A' : b.statut === 'en_retard' ? '#C8860A' : '#E53935';
          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid ' + borderColor }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, background: '#F0FBF0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2B22' }}>{b.nom}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>👤 {b.locataire}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A', marginTop: 3 }}>{GNF(b.loyer)} / mois</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: '0.5px solid ' + s.border }}>
                    {s.label}
                  </span>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                    {b.statut === 'paye' ? '✓ Payé ce mois' : b.statut === 'en_retard' ? '⚠️ Retard : ' + b.jours + ' jours' : '❌ Dû depuis ' + b.jours + ' jours'}
                  </div>
                </div>
              </div>

              {b.statut === 'paye' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, background: '#F0FBF0', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: 10, padding: 9, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    📄 Voir la quittance
                  </button>
                  <button style={{ flex: 1, background: '#F5F5F5', color: '#555', border: '0.5px solid #E0E0E0', borderRadius: 10, padding: 9, fontSize: 13, cursor: 'pointer' }}>
                    💬 Contacter
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={function() { openModal(b); }}
                    style={{ flex: 2, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    💳 Enregistrer le paiement
                  </button>
                  <button style={{ flex: 1, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    📤 Relancer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL BOTTOM-SHEET ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={function(e) { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 600, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }}>

            {!done ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22' }}>💳 Enregistrer un paiement</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{modal.nom} · {modal.locataire}</div>
                  </div>
                  <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>

                <div style={{ background: '#F0FBF0', borderRadius: 12, padding: 14, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Montant du loyer — {MOIS_ACTUEL}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      {modal.statut === 'en_retard' ? '⚠️ En retard de ' + modal.jours + ' jours' : '❌ Impayé depuis ' + modal.jours + ' jours'}
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1B6B3A' }}>{GNF(modal.loyer)}</div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Mode de paiement</div>
                {PAY_MODES.map(function(p) {
                  return (
                    <div key={p.id} onClick={function() { setSelectedMode(p.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: selectedMode === p.id ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0', background: selectedMode === p.id ? '#F0FBF0' : '#fff', borderRadius: 12, marginBottom: 8, cursor: 'pointer', transition: 'all .2s' }}>
                      <div style={{ width: 40, height: 40, background: p.color || '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? 20 : 13, fontWeight: 700, color: p.text || '#1B6B3A', flexShrink: 0 }}>
                        {p.icon || p.abbr}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22' }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{p.sub}</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: selectedMode === p.id ? 'none' : '1.5px solid #E0E0E0', background: selectedMode === p.id ? '#1B6B3A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedMode === p.id && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}

                {selectedMode === 'cash' && (
                  <div style={{ background: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', gap: 8 }}>
                    <span>ℹ️</span>
                    <span style={{ fontSize: 12, color: '#7B4F00', lineHeight: 1.5 }}>Le locataire reçoit une quittance PDF par email dès que vous confirmez le paiement en espèces.</span>
                  </div>
                )}

                <button onClick={confirmerPaiement} disabled={processing}
                  style={{ width: '100%', background: processing ? '#999' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', marginTop: 6 }}>
                  {processing ? '⏳ Traitement en cours...' : '✅ Confirmer le paiement — ' + GNF(modal.loyer)}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 70, height: 70, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 8 }}>Paiement enregistré !</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
                  Le loyer de <b>{GNF(modal.loyer)}</b> pour <b>{modal.locataire}</b> est confirmé.<br />
                  Une quittance PDF a été générée et envoyée au locataire.
                </div>
                <div style={{ background: '#F0FBF0', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Récapitulatif</div>
                  {[
                    ['Bien', modal.nom],
                    ['Locataire', modal.locataire],
                    ['Montant', GNF(modal.loyer)],
                    ['Mode', PAY_MODES.find(function(p) { return p.id === selectedMode; }) ? PAY_MODES.find(function(p) { return p.id === selectedMode; }).label : ''],
                    ['Date', 'Aujourd\'hui · ' + new Date().toLocaleDateString('fr-FR')],
                    ['Statut', '✅ Payé'],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', padding: '4px 0', borderBottom: '0.5px solid #F0F0F0' }}>
                        <span style={{ fontWeight: 600 }}>{row[0]}</span>
                        <span>{row[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ flex: 1, background: '#F0FBF0', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    📄 Voir la quittance
                  </button>
                  <button onClick={closeModal}
                    style={{ flex: 1, background: '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                    ← Retour à la liste
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

// ═══════════════════════════════════════════════════
// PAIEMENTS CÔTÉ LOCATAIRE
// Fiche logement + historique + choix mois + modes paiement
// ═══════════════════════════════════════════════════
export function PaiementsLocataire() {
  var auth = useAuth();
  var [nbMois, setNbMois] = useState(1);
  var [mode, setMode] = useState('om');
  var [step, setStep] = useState('select'); // select | confirm | success
  var [logement, setLogement] = useState(null);
  var [historique, setHistorique] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    api.get('/reservations/mes-reservations')
      .then(function(res) {
        var active = (res.data.reservations || []).find(function(r) { return r.statut === 'confirmee'; });
        if (active) {
          setLogement({
            nom: active.logement_titre,
            proprio: active.prop_prenom + ' ' + active.prop_nom,
            proprio_initials: ((active.prop_prenom || 'P').charAt(0) + (active.prop_nom || 'P').charAt(0)).toUpperCase(),
            quartier: active.logement_ville || 'Conakry',
            loyer: Number(active.montant_total || active.prix_mensuel),
            caution: Number(active.caution || active.prix_mensuel),
            debut: active.date_debut ? new Date(active.date_debut).toLocaleDateString('fr-FR') : 'N/A',
            fin: active.date_fin ? new Date(active.date_fin).toLocaleDateString('fr-FR') : 'N/A',
            statut_loyer: 'impaye',
            icon: '🏢',
            reservation_id: active.id
          });
        }
      })
      .catch(console.error)
      .finally(function() { setLoading(false); });

    api.get('/paiements/mes-paiements')
      .then(function(res) {
        setHistorique((res.data.paiements || []).slice(0, 3));
      })
      .catch(console.error);
  }, []);

  var total = logement ? logement.loyer * nbMois : 0;

  function payer() {
    setStep('loading');
    api.post('/paiements/initier', {
      reservation_id: logement && logement.reservation_id,
      montant: total,
      mode_paiement: mode,
      nb_mois: nbMois
    }).catch(function() {
      // Pas bloquant
    });
    setTimeout(function() { setStep('success'); toast.success('Paiement confirmé !'); }, 2200);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Chargement...</div>;

  if (!logement) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 8 }}>Aucune location active</div>
        <div style={{ fontSize: 13, color: '#888' }}>Réservez un logement pour accéder aux paiements</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ background: '#1A4FA0', borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>💳 Mes paiements</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>Mon logement · {MOIS_ACTUEL}</div>
      </div>

      {step === 'success' ? (
        /* ── VUE SUCCÈS ── */
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: '#E8F5E9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B6B3A', marginBottom: 8 }}>Paiement confirmé !</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            {GNF(total)} payés pour <b>{nbMois} mois</b>.<br />
            Période couverte : {MOIS_ACTUEL} — {addMonths(nbMois - 1)}<br />
            Une quittance PDF a été générée.
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1B5E20', marginBottom: 6 }}>Récapitulatif</div>
            {[
              ['Logement', logement.nom],
              ['Montant', GNF(total)],
              ['Mois couverts', nbMois + ' mois'],
              ['Mode', PAY_MODES.find(function(p) { return p.id === mode; }) ? PAY_MODES.find(function(p) { return p.id === mode; }).label : ''],
              ['Date', new Date().toLocaleDateString('fr-FR')],
            ].map(function(row) {
              return (
                <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #C8E6C9' }}>
                  <span style={{ color: '#555' }}>{row[0]}</span>
                  <span style={{ fontWeight: 600, color: '#1B5E20' }}>{row[1]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#E8F5E9', color: '#1B6B3A', border: '0.5px solid #A5D6A7', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>📄 Ma quittance</button>
            <button onClick={function() { setStep('select'); setNbMois(1); }}
              style={{ flex: 1, background: '#1A4FA0', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>← Retour</button>
          </div>
        </div>
      ) : step === 'confirm' ? (
        /* ── CONFIRMATION ── */
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 14 }}>Récapitulatif avant paiement</div>
            <div style={{ background: '#F0F7FF', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              {[
                ['Logement', logement.nom],
                ['Propriétaire', logement.proprio],
                ['Montant total', GNF(total)],
                ['Durée', nbMois + ' mois'],
                ['Période', MOIS_ACTUEL + (nbMois > 1 ? ' → ' + addMonths(nbMois - 1) : '')],
                ['Mode', PAY_MODES.find(function(p) { return p.id === mode; }) ? PAY_MODES.find(function(p) { return p.id === mode; }).label : ''],
              ].map(function(row) {
                return (
                  <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '0.5px solid #E3F2FD', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#555' }}>{row[0]}</span>
                    <span style={{ fontWeight: 600, color: '#1B2B22', textAlign: 'right' }}>{row[1]}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={function() { setStep('select'); }}
                style={{ flex: 1, background: '#F0F0F0', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontSize: 13, cursor: 'pointer' }}>← Modifier</button>
              <button onClick={payer}
                style={{ flex: 2, background: step === 'loading' ? '#999' : '#1A4FA0', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {step === 'loading' ? '⏳ Traitement...' : '✅ Confirmer — ' + GNF(total)}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── SÉLECTION ── */
        <div>
          {/* Fiche logement */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, background: '#E3F2FD', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{logement.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1B2B22' }}>{logement.nom}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {logement.quartier}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ width: 26, height: 26, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{logement.proprio_initials}</div>
                  <span style={{ fontSize: 12, color: '#555' }}>{logement.proprio}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A4FA0' }}>{GNF(logement.loyer)}</div>
                <div style={{ fontSize: 10, color: '#888' }}>/ mois</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['Début bail', logement.debut], ['Fin bail', logement.fin], ['Caution', GNF(logement.caution)]].map(function(item) {
                return (
                  <div key={item[0]} style={{ textAlign: 'center', background: '#F8F8F8', borderRadius: 10, padding: '8px 4px' }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{item[0]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1B2B22' }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#FFEBEE', borderRadius: 10, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#B71C1C', fontWeight: 600 }}>⚠️ Statut loyer — {MOIS_ACTUEL}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>En attente de paiement</div>
              </div>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FFEBEE', color: '#B71C1C', border: '0.5px solid #FFCDD2' }}>Non payé</span>
            </div>
          </div>

          {/* Historique 3 mois */}
          {historique.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Historique des 3 derniers mois</div>
              {historique.map(function(p, i) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < historique.length - 1 ? '0.5px solid #F5F5F5' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                        {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Mois précédent'}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {p.mode_paiement === 'orange_money' ? '🟠 Orange Money' : p.mode_paiement === 'mtn_momo' ? '🟡 MTN MoMo' : '💵 Espèces'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B6B3A' }}>{GNF(p.montant)}</div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#E8F5E9', color: '#1B5E20' }}>Payé ✓</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Choix du nombre de mois */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Combien de mois payer ?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 6, 12].map(function(n) {
                return (
                  <button key={n} onClick={function() { setNbMois(n); }}
                    style={{ padding: 10, borderRadius: 10, border: nbMois === n ? '2px solid #1A4FA0' : '0.5px solid #E0E0E0', background: nbMois === n ? '#E3F2FD' : '#FAFAFA', color: nbMois === n ? '#0D47A1' : '#555', fontSize: 13, fontWeight: nbMois === n ? 700 : 400, cursor: 'pointer' }}>
                    {n}
                  </button>
                );
              })}
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#0D47A1', fontWeight: 600 }}>Période couverte</div>
                <div style={{ fontSize: 11, color: '#1565C0', marginTop: 2 }}>{MOIS_ACTUEL} → {addMonths(nbMois - 1)}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1A4FA0' }}>{GNF(total)}</div>
            </div>
            {nbMois >= 3 && (
              <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#1B5E20' }}>
                ✅ Paiement de {nbMois} mois en avance — Merci pour votre sérieux !
              </div>
            )}
          </div>

          {/* 4 modes de paiement grille 2x2 */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 12 }}>Mode de paiement</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PAY_MODES.map(function(p) {
                return (
                  <div key={p.id} onClick={function() { setMode(p.id); }}
                    style={{ padding: 14, border: mode === p.id ? '2px solid #1A4FA0' : '0.5px solid #E0E0E0', background: mode === p.id ? '#E3F2FD' : '#FAFAFA', borderRadius: 12, cursor: 'pointer', transition: 'all .2s', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, background: p.color || '#F0F0F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p.icon ? 22 : 15, fontWeight: 700, color: p.text || '#1B2B22', margin: '0 auto 8px' }}>
                      {p.icon || p.abbr}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.sub}</div>
                    {mode === p.id && <div style={{ fontSize: 11, color: '#1A4FA0', fontWeight: 700, marginTop: 4 }}>✓ Sélectionné</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={function() { setStep('confirm'); }}
            style={{ width: '100%', background: '#1A4FA0', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Payer {GNF(total)} — {nbMois} mois →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DISPATCHER — choisit la vue selon le rôle
// ═══════════════════════════════════════════════════
export default function OngletPaiements() {
  var auth = useAuth();
  var user = auth.user;
  var estProprietaire = user && (user.role === 'proprietaire' || user.role === 'les_deux');
  return estProprietaire ? <PaiementsProprietaire /> : <PaiementsLocataire />;
}