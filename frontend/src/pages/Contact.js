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
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';

function getFaqCategories(t) {
  return [
    {
      categorie: t('contact.faq.0.categorie'),
      couleur: '#1565C0',
      bg: '#E3F2FD',
      questions: [
        { q: t('contact.faq.0.questions.0.q'), r: t('contact.faq.0.questions.0.r') },
        { q: t('contact.faq.0.questions.1.q'), r: t('contact.faq.0.questions.1.r') },
        { q: t('contact.faq.0.questions.2.q'), r: t('contact.faq.0.questions.2.r') },
        { q: t('contact.faq.0.questions.3.q'), r: t('contact.faq.0.questions.3.r') },
        { q: t('contact.faq.0.questions.4.q'), r: t('contact.faq.0.questions.4.r') },
        { q: t('contact.faq.0.questions.5.q'), r: t('contact.faq.0.questions.5.r') },
      ]
    },
    {
      categorie: t('contact.faq.1.categorie'),
      couleur: '#1B6B3A',
      bg: '#E8F5E9',
      questions: [
        { q: t('contact.faq.1.questions.0.q'), r: t('contact.faq.1.questions.0.r') },
        { q: t('contact.faq.1.questions.1.q'), r: t('contact.faq.1.questions.1.r') },
        { q: t('contact.faq.1.questions.2.q'), r: t('contact.faq.1.questions.2.r') },
        { q: t('contact.faq.1.questions.3.q'), r: t('contact.faq.1.questions.3.r') },
        { q: t('contact.faq.1.questions.4.q'), r: t('contact.faq.1.questions.4.r') },
        { q: t('contact.faq.1.questions.5.q'), r: t('contact.faq.1.questions.5.r') },
      ]
    },
    {
      categorie: t('contact.faq.2.categorie'),
      couleur: '#E65100',
      bg: '#FFF3E0',
      questions: [
        { q: t('contact.faq.2.questions.0.q'), r: t('contact.faq.2.questions.0.r') },
        { q: t('contact.faq.2.questions.1.q'), r: t('contact.faq.2.questions.1.r') },
        { q: t('contact.faq.2.questions.2.q'), r: t('contact.faq.2.questions.2.r') },
      ]
    },
    {
      categorie: t('contact.faq.3.categorie'),
      couleur: '#7B1FA2',
      bg: '#F3E5F5',
      questions: [
        { q: t('contact.faq.3.questions.0.q'), r: t('contact.faq.3.questions.0.r') },
        { q: t('contact.faq.3.questions.1.q'), r: t('contact.faq.3.questions.1.r') },
        { q: t('contact.faq.3.questions.2.q'), r: t('contact.faq.3.questions.2.r') },
      ]
    },
  ];
}

function getContacts(t) {
  return [
    { icon: <Mail size={22} strokeWidth={1.5} />, label: t('contact.contacts.email'), valeur: 'contact@werdhe.com', href: 'mailto:contact@werdhe.com', couleur: '#1B6B3A' },
    { icon: <MessageCircle size={22} strokeWidth={1.5} />, label: t('contact.contacts.whatsapp'), valeur: '+33 07 66 68 74 85', href: 'https://wa.me/330766687485', couleur: '#25D366' },
  ];
}

export default function Contact() {
  var t = useTranslation('public').t;
  var FAQ_CATEGORIES = getFaqCategories(t);
  var CONTACTS = getContacts(t);
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
      toast.error(t('contact.erreurChampsObligatoires'));
      return;
    }
    setLoading(true);
    // Envoyer via email (Resend côté backend)
    api.post('/auth/contact', form)
      .then(function() {
        toast.success(t('contact.messageEnvoye'));
        setForm({ nom: '', email: '', sujet: '', message: '' });
      })
      .catch(function() {
        // Fallback : ouvrir le client email
        window.location.href = 'mailto:contact@werdhe.com?subject=' + encodeURIComponent(form.sujet || t('contact.sujetParDefaut')) + '&body=' + encodeURIComponent(form.message);
        toast.success(t('contact.ouvertureClientEmail'));
      })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre={t('contact.seo.titre')}
        description={t('contact.seo.description')}
        url="https://werdhe.com/contact"
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={function() { navigate(-1); }}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronLeft size={16} strokeWidth={2} /> {t('contact.retour')}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={30} showText={true} darkBg={true} />
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
            {t('contact.titre')}
          </h1>
          <p style={{ fontSize: 16, color: '#888', margin: 0 }}>{t('contact.sousTitre')}</p>
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
              <div style={{ fontSize: 12, color: '#888', marginBottom: 3 }}>{t('contact.horairesSupport')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2B22' }}>{t('contact.horaires')}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* FAQ */}
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 20px', letterSpacing: -0.5 }}>
              {t('contact.questionsFrequentes')}
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
              {t('contact.nousEcrire')}
            </h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <form onSubmit={envoyerMessage}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('contact.champNom')}</label>
                    <input type="text" placeholder="Mamadou Diallo" value={form.nom}
                      onChange={function(e) { setForm(Object.assign({}, form, { nom: e.target.value })); }}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('contact.champEmail')}</label>
                    <input type="email" placeholder={t('contact.placeholderEmail')} value={form.email}
                      onChange={function(e) { setForm(Object.assign({}, form, { email: e.target.value })); }}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('contact.champSujet')}</label>
                  <select value={form.sujet} onChange={function(e) { setForm(Object.assign({}, form, { sujet: e.target.value })); }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                    <option value="">{t('contact.selectionnerSujet')}</option>
                    <option value="Question locataire">{t('contact.sujets.questionLocataire')}</option>
                    <option value="Question propriétaire">{t('contact.sujets.questionProprietaire')}</option>
                    <option value="Problème technique">{t('contact.sujets.problemeTechnique')}</option>
                    <option value="Abonnement et facturation">{t('contact.sujets.abonnementFacturation')}</option>
                    <option value="Signalement">{t('contact.sujets.signalement')}</option>
                    <option value="Partenariat">{t('contact.sujets.partenariat')}</option>
                    <option value="Autre">{t('contact.sujets.autre')}</option>
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('contact.champMessage')}</label>
                  <textarea rows="5" placeholder={t('contact.placeholderMessage')} value={form.message}
                    onChange={function(e) { setForm(Object.assign({}, form, { message: e.target.value })); }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? t('contact.envoiEnCours') : <><Send size={16} strokeWidth={2} /> {t('contact.envoyerMessage')}</>}
                </button>
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 12 }}>
                  {t('contact.delaiReponse')}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}