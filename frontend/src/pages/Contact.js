/* eslint-disable */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Mail, Phone, MessageCircle,
  ChevronDown, ChevronUp, Send, Home
} from 'lucide-react';

var FAQ_CATEGORIES = [
  {
    categorie: '🏠 Pour les locataires',
    couleur: '#1565C0',
    bg: '#E3F2FD',
    questions: [
      {
        q: 'Est-ce que Werdhe est gratuit pour les locataires ?',
        r: 'Oui, l\'espace locataire est 100% gratuit et le restera toujours. Aucun frais d\'agence, aucune commission — vous payez uniquement votre loyer directement au propriétaire.'
      },
      {
        q: 'Comment postuler pour un logement ?',
        r: 'Cherchez un logement, cliquez sur "Candidater", remplissez le formulaire avec votre date d\'entrée souhaitée et la durée. Le propriétaire reçoit votre candidature et peut vous demander un dossier complet (CNI, justificatif d\'emploi, etc.).'
      },
      {
        q: 'Quels documents dois-je préparer ?',
        r: 'En général : une pièce d\'identité (CNI), un justificatif de revenus ou d\'emploi, et optionnellement les coordonnées d\'un garant. Certains propriétaires peuvent demander des fiches de paie.'
      },
      {
        q: 'Comment signer le bail en ligne ?',
        r: 'Une fois votre candidature acceptée et la caution payée, le propriétaire génère le bail. Vous recevez une notification, et vous pouvez signer électroniquement depuis votre espace "Mes Candidatures".'
      },
      {
        q: 'Comment suivre l\'état de ma candidature ?',
        r: 'Dans votre dashboard, section "Mes Candidatures", vous voyez en temps réel l\'état de chaque candidature : en attente, dossier demandé, en examen, acceptée, etc.'
      },
      {
        q: 'Que faire si le propriétaire ne répond pas ?',
        r: 'Si vous n\'avez pas de réponse après 48h, vous pouvez utiliser la messagerie intégrée pour relancer directement le propriétaire. Si le problème persiste, contactez notre support.'
      },
    ]
  },
  {
    categorie: '🔑 Pour les propriétaires',
    couleur: '#1B6B3A',
    bg: '#E8F5E9',
    questions: [
      {
        q: 'Combien coûte Werdhe pour les propriétaires ?',
        r: 'Le plan Gratuit permet de gérer jusqu\'à 2 biens. Le plan Pro (120 000 GNF/mois) permet jusqu\'à 25 biens avec des fonctionnalités avancées. Le plan Agence (300 000 GNF/mois) offre des biens illimités. Essai Pro 14 jours gratuit sans engagement.'
      },
      {
        q: 'Comment publier mon premier bien ?',
        r: 'Dans votre dashboard, cliquez sur "+ Ajouter un bien", remplissez les informations (titre, adresse, prix, superficie) et ajoutez des photos. Votre logement est publié immédiatement.'
      },
      {
        q: 'Comment fonctionne la commission Werdhe ?',
        r: 'Werdhe perçoit 5% sur chaque loyer encaissé via la plateforme. Cette commission est automatiquement calculée. Elle couvre l\'ensemble des services : génération de documents, alertes, messagerie, etc.'
      },
      {
        q: 'Puis-je gérer plusieurs logements ?',
        r: 'Oui. Avec le plan Pro, gérez jusqu\'à 25 biens. Le plan Agence offre des biens illimités avec gestion multi-utilisateurs. Depuis votre dashboard, chaque bien a sa propre fiche avec ses locataires et paiements.'
      },
      {
        q: 'Comment générer une quittance de loyer ?',
        r: 'Dans l\'onglet "Documents", sélectionnez le bien et le locataire, choisissez "Quittance de loyer" et cliquez "Générer". La quittance est créée en PDF et envoyée automatiquement au locataire par email.'
      },
      {
        q: 'Que se passe-t-il si un locataire ne paie pas ?',
        r: 'Le système envoie automatiquement une alerte à J+3 et une mise en demeure à J+5. Vous recevez une notification et un email. Des modèles de lettres officielles sont disponibles dans la section Documents.'
      },
    ]
  },
  {
    categorie: '💳 Paiements',
    couleur: '#E65100',
    bg: '#FFF3E0',
    questions: [
      {
        q: 'Quels modes de paiement sont acceptés ?',
        r: 'Orange Money, MTN MoMo, espèces et virement bancaire (BICIGUI, Ecobank). Les paiements Mobile Money sont disponibles à partir du plan Pro.'
      },
      {
        q: 'Comment la caution est-elle gérée ?',
        r: 'La caution représente 1 mois de loyer. Elle est versée directement au propriétaire lors de la confirmation de la location. Werdhe ne détient pas les fonds en séquestre (en cours d\'implémentation).'
      },
      {
        q: 'Puis-je annuler mon abonnement ?',
        r: 'Oui, à tout moment depuis vos paramètres. L\'annulation prend effet à la fin de la période en cours. Aucun remboursement prorata n\'est effectué.'
      },
    ]
  },
  {
    categorie: '🔒 Sécurité et confidentialité',
    couleur: '#7B1FA2',
    bg: '#F3E5F5',
    questions: [
      {
        q: 'Mes données sont-elles sécurisées ?',
        r: 'Oui. Toutes les données sont chiffrées en transit (HTTPS). Les mots de passe sont hachés (bcrypt). Les comptes admin sont protégés par une authentification à deux facteurs. Consultez notre politique de confidentialité pour plus de détails.'
      },
      {
        q: 'Puis-je supprimer mon compte ?',
        r: 'Oui, depuis Paramètres > Supprimer mon compte. Vos données personnelles sont supprimées dans un délai de 30 jours, sous réserve des obligations légales de conservation.'
      },
      {
        q: 'Werdhe vend-il mes données ?',
        r: 'Non, jamais. Werdhe ne vend pas vos données à des tiers à des fins commerciales. Les seuls partages sont avec nos prestataires techniques (hébergement, paiement) dans le cadre strict de nos services.'
      },
    ]
  },
];

var CONTACTS = [
  { icon: <Mail size={22} strokeWidth={1.5} />, label: 'Email', valeur: 'contact@werdhe.com', href: 'mailto:contact@werdhe.com', couleur: '#1B6B3A' },
  { icon: <MessageCircle size={22} strokeWidth={1.5} />, label: 'WhatsApp', valeur: '+224 621 00 00 00', href: 'https://wa.me/224621000000', couleur: '#25D366' },
];

export default function Contact() {
  var navigate = useNavigate();
  var [openFaq, setOpenFaq] = useState(null);
  var [form, setForm]       = useState({ nom: '', email: '', sujet: '', message: '' });
  var [loading, setLoading] = useState(false);

  function toggleFaq(key) {
    setOpenFaq(openFaq === key ? null : key);
  }

  function envoyerMessage(e) {
    e.preventDefault();
    if (!form.nom || !form.email || !form.message) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }
    setLoading(true);
    // Envoyer via email (Resend côté backend)
    api.post('/auth/contact', form)
      .then(function() {
        toast.success('Message envoyé ! Nous répondrons sous 24h.');
        setForm({ nom: '', email: '', sujet: '', message: '' });
      })
      .catch(function() {
        // Fallback : ouvrir le client email
        window.location.href = 'mailto:contact@werdhe.com?subject=' + encodeURIComponent(form.sujet || 'Contact Werdhe') + '&body=' + encodeURIComponent(form.message);
        toast.success('Ouverture de votre client email...');
      })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Contact et FAQ"
        description="Contactez l'équipe Werdhe ou consultez notre FAQ. Nous répondons sous 24h."
        url="https://werdhe.com/contact"
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={function() { navigate(-1); }}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronLeft size={16} strokeWidth={2} /> Retour
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#1B6B3A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Werdhe</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
            Comment pouvons-nous vous aider ?
          </h1>
          <p style={{ fontSize: 16, color: '#888', margin: 0 }}>Consultez la FAQ ou contactez notre équipe</p>
        </div>

        {/* Cards contact */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
          {CONTACTS.map(function(c, i) {
            return (
              <a key={i} href={c.href} target="_blank" rel="noreferrer"
                style={{ background: '#fff', borderRadius: 14, padding: '20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all .2s', border: '1px solid transparent' }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = c.couleur; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 44, height: 44, background: c.couleur + '15', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.couleur, flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{c.valeur}</div>
                </div>
              </a>
            );
          })}

          <div style={{ background: '#fff', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 44, height: 44, background: '#F3E5F5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Phone size={22} strokeWidth={1.5} color="#7B1FA2" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>Horaires support</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>Lun-Sam 8h-18h</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* FAQ */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 20px', letterSpacing: -0.5 }}>
              Questions fréquentes
            </h2>

            {FAQ_CATEGORIES.map(function(cat, ci) {
              return (
                <div key={ci} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: cat.bg, borderRadius: 20, padding: '6px 16px', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.couleur }}>{cat.categorie}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.questions.map(function(faq, fi) {
                      var key  = ci + '-' + fi;
                      var open = openFaq === key;
                      return (
                        <div key={fi} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: open ? '1px solid ' + cat.couleur + '40' : '1px solid transparent' }}>
                          <button
                            onClick={function() { toggleFaq(key); }}
                            style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1B2B22', lineHeight: 1.4 }}>{faq.q}</span>
                            <span style={{ color: cat.couleur, flexShrink: 0 }}>
                              {open ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
                            </span>
                          </button>
                          {open && (
                            <div style={{ padding: '0 18px 16px', fontSize: 14, color: '#555', lineHeight: 1.7, borderTop: '0.5px solid #F0F0F0', paddingTop: 14 }}>
                              {faq.r}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formulaire de contact */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 20px', letterSpacing: -0.5 }}>
              Nous écrire
            </h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <form onSubmit={envoyerMessage}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nom complet *</label>
                    <input type="text" placeholder="Mamadou Diallo" value={form.nom}
                      onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Email *</label>
                    <input type="email" placeholder="vous@email.com" value={form.email}
                      onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Sujet</label>
                  <select value={form.sujet} onChange={function(e) { setForm(Object.assign({}, form, { sujet: e.target.value })); }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option value="">Sélectionner un sujet</option>
                    <option value="Question locataire">Question locataire</option>
                    <option value="Question propriétaire">Question propriétaire</option>
                    <option value="Problème technique">Problème technique</option>
                    <option value="Abonnement et facturation">Abonnement et facturation</option>
                    <option value="Signalement">Signalement</option>
                    <option value="Partenariat">Partenariat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Message *</label>
                  <textarea rows="5" placeholder="Décrivez votre question ou problème en détail..." value={form.message}
                    onChange={function(e) { setForm(Object.assign({}, form, { message: e.target.value })); }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? '⏳ Envoi...' : <><Send size={16} strokeWidth={2} /> Envoyer le message</>}
                </button>
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 12 }}>
                  Nous répondons généralement sous 24h les jours ouvrables
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}