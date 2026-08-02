/* eslint-disable */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Home, Users, FileText, Bell, CreditCard,
  Search, CalendarCheck, Key, ChevronRight,
  Check, X
} from 'lucide-react';

var ETAPES_PROPRIO = [
  {
    icon:    <Home size={48} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Bienvenue sur Werdhe 🎉',
    desc:    'Gérez tous vos logements depuis un seul tableau de bord. Candidatures, paiements, documents — tout est centralisé.',
    cta:     'Commencer',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
  },
  {
    icon:    <Home size={48} strokeWidth={1} color="#1565C0" />,
    titre:   'Ajoutez votre premier bien',
    desc:    'Publiez votre logement en 5 minutes. Ajoutez photos, prix, description et laissez les candidatures arriver.',
    cta:     'Suivant',
    couleur: '#1565C0',
    bg:      '#E3F2FD',
    action:  'ajouter_bien',
  },
  {
    icon:    <Users size={48} strokeWidth={1} color="#7B1FA2" />,
    titre:   'Gérez les candidatures',
    desc:    'Les locataires postulent directement. Vous recevez leurs dossiers, acceptez ou refusez en un clic.',
    cta:     'Suivant',
    couleur: '#7B1FA2',
    bg:      '#F3E5F5',
  },
  {
    icon:    <CreditCard size={48} strokeWidth={1} color="#E65100" />,
    titre:   'Suivez vos paiements',
    desc:    'Enregistrez les loyers reçus, générez des quittances automatiquement. Alertes automatiques en cas de retard.',
    cta:     'Suivant',
    couleur: '#E65100',
    bg:      '#FFF3E0',
  },
  {
    icon:    <Bell size={48} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Vous êtes prêt !',
    desc:    'Votre tableau de bord est configuré. Ajoutez votre premier bien et commencez à recevoir des candidatures dès aujourd\'hui.',
    cta:     'Accéder au tableau de bord',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
    dernier: true,
  },
];

var ETAPES_LOCATAIRE = [
  {
    icon:    <Search size={48} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Bienvenue sur Werdhe 🎉',
    desc:    'Trouvez votre logement idéal en Guinée. Filtrez par ville, prix, superficie. Sans intermédiaire, sans frais cachés.',
    cta:     'Commencer',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
  },
  {
    icon:    <CalendarCheck size={48} strokeWidth={1} color="#1565C0" />,
    titre:   'Candidatez en ligne',
    desc:    'Trouvez un logement et envoyez votre candidature directement au propriétaire. Dossier numérique, réponse rapide.',
    cta:     'Suivant',
    couleur: '#1565C0',
    bg:      '#E3F2FD',
  },
  {
    icon:    <FileText size={48} strokeWidth={1} color="#7B1FA2" />,
    titre:   'Dossier et signature',
    desc:    'Uploadez vos documents une seule fois. Le bail se signe électroniquement — plus besoin de se déplacer.',
    cta:     'Suivant',
    couleur: '#7B1FA2',
    bg:      '#F3E5F5',
  },
  {
    icon:    <Key size={48} strokeWidth={1} color="#1B6B3A" />,
    titre:   'Vous êtes prêt !',
    desc:    'L\'espace locataire est 100% gratuit, pour toujours. Commencez à chercher votre logement dès maintenant.',
    cta:     'Chercher un logement',
    couleur: '#1B6B3A',
    bg:      '#E8F5E9',
    dernier: true,
  },
];

export default function Onboarding({ onTermine }) {
  var auth     = useAuth();
  var user     = auth.user;
  var navigate = useNavigate();
  var [etape, setEtape]       = useState(0);
  var [quitter, setQuitter]   = useState(false);

  var estProprio = user && (user.role === 'proprietaire' || user.role === 'les_deux' || user.role === 'admin');
  var etapes     = estProprio ? ETAPES_PROPRIO : ETAPES_LOCATAIRE;
  var e          = etapes[etape];

  function marquerTermine() {
    api.patch('/auth/onboarding-termine').catch(console.warn);
    if (onTermine) onTermine();
  }

  function suivant() {
    if (etape < etapes.length - 1) {
      setEtape(etape + 1);
    }
  }

  function terminer() {
    marquerTermine();
    if (!estProprio) {
      navigate('/logements');
    }
  }

  function passer() {
    setQuitter(true);
  }

  function confirmerQuitter() {
    marquerTermine();
  }

  // Modal confirmation quitter
  if (quitter) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🤔</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Passer le tutoriel ?</h3>
          <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.6 }}>
            Vous pouvez y revenir depuis les paramètres. Mais quelques minutes maintenant vous en feront gagner beaucoup plus tard.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={function() { setQuitter(false); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #E0E0E0', background: '#fff', color: '#1B2B22', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Continuer
            </button>
            <button onClick={confirmerQuitter}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#F5F5F5', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Passer quand même
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, maxWidth: 440, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

        {/* Barre de progression */}
        <div style={{ background: '#F5F5F5', height: 4 }}>
          <div style={{ background: e.couleur, height: '100%', width: ((etape + 1) / etapes.length * 100) + '%', transition: 'width .4s ease' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>
            {etape + 1} / {etapes.length}
          </div>
          <button onClick={passer}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '4px 8px', borderRadius: 6 }}>
            <X size={14} strokeWidth={2} /> Passer
          </button>
        </div>

        {/* Contenu */}
        <div style={{ padding: '24px 28px 28px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, background: e.bg, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            {e.icon}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 12px', lineHeight: 1.2 }}>
            {e.titre}
          </h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, margin: '0 0 28px' }}>
            {e.desc}
          </p>

          {/* Points de navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {etapes.map(function(_, i) {
              return (
                <div key={i} style={{ width: i === etape ? 20 : 7, height: 7, borderRadius: 4, background: i === etape ? e.couleur : '#E0E0E0', transition: 'all .3s' }} />
              );
            })}
          </div>

          {/* Bouton principal */}
          <button
            onClick={e.dernier ? terminer : suivant}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: e.couleur, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {e.cta}
            {!e.dernier && <ChevronRight size={18} strokeWidth={2} />}
            {e.dernier && <Check size={18} strokeWidth={2.5} />}
          </button>

          {/* Bouton secondaire sur première étape */}
          {etape === 0 && (
            <button onClick={passer}
              style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 10, border: 'none', background: 'transparent', color: '#aaa', fontSize: 13, cursor: 'pointer' }}>
              Je connais déjà Werdhe — passer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}