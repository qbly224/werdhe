/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const GNF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' GNF';

export default function Reserver() {
  var { id: logementId } = useParams();
  var navigate = useNavigate();
  var auth = useAuth();
  var user = auth.user;

  // ── Données du formulaire ──────────────────────────────────────
  var [dateDebut, setDateDebut] = useState('');
  var [duree, setDuree] = useState('12');
  var [message, setMessage] = useState('');
  var [envoi, setEnvoi] = useState(false); // true pendant l'appel API

  // ── Données réelles du logement chargées depuis l'API ──────────
  var [logement, setLogement] = useState(null);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    if (!logementId) return;
    api.get('/logements/' + logementId)
      .then(function(res) {
        setLogement(res.data.logement || res.data);
        setLoading(false);
      })
      .catch(function(err) {
        console.error(err);
        toast.error('Logement introuvable');
        navigate('/logements');
      });
  }, [logementId]);

  function envoyerDemande(e) {
    e.preventDefault();
    if (!dateDebut) { toast.error('Choisissez une date d\'entrée'); return; }
    if (!message.trim()) { toast.error('Écrivez un message au propriétaire'); return; }

    setEnvoi(true);

    api.post('/reservations', {
      logement_id: logementId,
      date_debut: dateDebut,
      duree_mois: parseInt(duree),
      message_locataire: message,
      type_location: 'longue_duree',
    })
      .then(function(res) {
        var resa = res.data.reservation || res.data;
        toast.success('Demande envoyée ! Le propriétaire a 48h pour répondre.');
        // Redirection vers le flux réel — ReservationLocataire.js
        navigate('/reservation/' + resa.id);
      })
      .catch(function(err) {
        setEnvoi(false);
        var msg = err.response && err.response.data && err.response.data.erreur
          ? err.response.data.erreur
          : 'Erreur lors de l\'envoi';
        toast.error(msg);
      });
  }

  // ── Chargement ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: 20, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 15, color: '#888' }}>Chargement du logement...</div>
      </div>
    );
  }

  if (!logement) return null;

  var loyer = Number(logement.prix_mensuel || 0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '0 auto', padding: '12px 16px', background: '#F7F8F7', minHeight: '100vh' }}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{ background: '#1B6B3A', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={function() { navigate(-1); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 22, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ←
          </button>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Candidature de location</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Étape 1 / 7 — Côté locataire</div>
          </div>
        </div>
      </div>

      {/* ── FICHE LOGEMENT (données réelles) ───────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 64, height: 56, background: '#E8F5E9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            🏠
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1B2B22' }}>
              {logement.titre}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
              📍 {logement.adresse}{logement.ville ? ', ' + logement.ville : ''}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1B6B3A', marginTop: 4 }}>
              {GNF(loyer)} / mois
            </div>
          </div>
          <div style={{ background: '#E8F5E9', color: '#1B5E20', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            Disponible
          </div>
        </div>

        {/* Caractéristiques */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {logement.nb_chambres && (
            <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
              {logement.nb_chambres} chambre{logement.nb_chambres > 1 ? 's' : ''}
            </span>
          )}
          {logement.nb_salles_bain && (
            <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
              {logement.nb_salles_bain} salle{logement.nb_salles_bain > 1 ? 's' : ''} de bain
            </span>
          )}
          {logement.superficie && (
            <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
              {logement.superficie} m²
            </span>
          )}
          {logement.categorie && (
            <span style={{ background: '#F5F5F5', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
              {logement.categorie}
            </span>
          )}
        </div>

        {/* Propriétaire */}
        <div style={{ background: '#F8F8F8', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Propriétaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {logement.prop_prenom ? logement.prop_prenom.charAt(0).toUpperCase() : 'P'}
              {logement.prop_nom ? logement.prop_nom.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2B22' }}>
                {logement.prop_prenom || ''} {logement.prop_nom || 'Propriétaire'}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>Membre vérifié · Werdhe</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FORMULAIRE DE DEMANDE ──────────────────────────────── */}
      <form onSubmit={envoyerDemande}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22', marginBottom: 16 }}>Votre demande</div>

          {/* Date d'entrée */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6, fontWeight: 600 }}>
              Date d'entrée souhaitée *
            </div>
            <input
              type="date"
              value={dateDebut}
              onChange={function(e) { setDateDebut(e.target.value); }}
              min={new Date().toISOString().split('T')[0]}
              required
              style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }} />
          </div>

          {/* Durée */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 8, fontWeight: 600 }}>Durée envisagée</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['6', '6 mois'], ['12', '12 mois'], ['24', '24 mois']].map(function(opt) {
                return (
                  <button
                    key={opt[0]}
                    type="button"
                    onClick={function() { setDuree(opt[0]); }}
                    style={{
                      padding: '10px 0', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                      border: duree === opt[0] ? '2px solid #1B6B3A' : '0.5px solid #E0E0E0',
                      background: duree === opt[0] ? '#E8F5E9' : '#FAFAFA',
                      color: duree === opt[0] ? '#1B5E20' : '#555',
                      fontWeight: duree === opt[0] ? 700 : 400
                    }}>
                    {opt[1]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6, fontWeight: 600 }}>
              Message au propriétaire *
            </div>
            <textarea
              value={message}
              onChange={function(e) { setMessage(e.target.value); }}
              placeholder="Présentez-vous : emploi, composition familiale, pourquoi ce logement..."
              rows={4}
              required
              style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '0.5px solid #E0E0E0', fontSize: 13, resize: 'none', fontFamily: 'system-ui', boxSizing: 'border-box', outline: 'none', background: '#FAFAFA' }} />
          </div>

          {/* Info */}
          <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: 12, color: '#0D47A1', lineHeight: 1.5 }}>
              Aucun paiement à cette étape. Le propriétaire a 48h pour répondre. Vous suivrez l'avancement directement dans votre tableau de bord.
            </span>
          </div>
        </div>

        {/* ── BOUTON ENVOI ──────────────────────────────────────── */}
        <button
          type="submit"
          disabled={envoi}
          style={{
            width: '100%', border: 'none', borderRadius: 12, padding: 15,
            fontSize: 15, fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer',
            background: envoi ? '#999' : '#1B6B3A', color: '#fff'
          }}>
          {envoi ? '⏳ Envoi en cours...' : '📤 Envoyer ma candidature au propriétaire'}
        </button>
      </form>

      <div style={{ height: 30 }} />
    </div>
  );
}