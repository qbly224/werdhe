/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageCircle, X, Send, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { urlPremierePhoto } from '../utils/photos';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

// Pages où le widget ne doit pas s'afficher (espace admin interne)
function estMasque(pathname) {
  return pathname.startsWith('/admin');
}

export default function ChatbotWidget() {
  var location = useLocation();
  var { t, i18n } = useTranslation('public');
  var [ouvert, setOuvert] = useState(false);
  var [messages, setMessages] = useState([]);
  var [saisie, setSaisie] = useState('');
  var [envoi, setEnvoi] = useState(false);
  var finRef = useRef(null);

  useEffect(function() {
    if (finRef.current) finRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, envoi]);

  if (estMasque(location.pathname)) return null;

  function envoyer(texte) {
    var contenu = (texte || saisie).trim();
    if (!contenu || envoi) return;

    var historique = messages.concat([{ role: 'user', content: contenu }]);
    setMessages(historique);
    setSaisie('');
    setEnvoi(true);

    api.post('/chatbot/message', {
      messages: historique.map(function(m) { return { role: m.role, content: m.content }; }),
      locale: i18n.language === 'en' ? 'en' : 'fr'
    }).then(function(res) {
      setMessages(historique.concat([{
        role: 'assistant',
        content: res.data.reply,
        logements: res.data.logements
      }]));
    }).catch(function() {
      setMessages(historique.concat([{ role: 'assistant', content: t('chatbot.erreur'), erreur: true }]));
    }).finally(function() {
      setEnvoi(false);
    });
  }

  var suggestions = [t('chatbot.suggestions.0'), t('chatbot.suggestions.1'), t('chatbot.suggestions.2')];

  return (
    <div style={{ position: 'fixed', right: 'max(18px, env(safe-area-inset-right, 0px))', bottom: 'max(18px, env(safe-area-inset-bottom, 0px))', zIndex: 2000 }}>
      {ouvert && (
        <div style={{
          width: 'min(360px, calc(100vw - 32px))', height: 'min(520px, calc(100vh - 110px))',
          background: '#fff', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column', marginBottom: 14, overflow: 'hidden',
          border: '1px solid #ECE7D9'
        }}>
          {/* Header */}
          <div style={{ background: '#1B2B22', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={16} color="#fff" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5 }}>{t('chatbot.titre')}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{t('chatbot.statut')}</div>
            </div>
            <button onClick={function() { setOuvert(false); }} aria-label={t('chatbot.fermer')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
              <X size={18} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FBFAF6' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '88%', background: '#F0F0EA', color: '#1B2B22', borderRadius: '4px 14px 14px 14px', padding: '9px 12px', fontSize: 13, lineHeight: 1.5 }}>
              {t('chatbot.accueil')}
            </div>

            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {suggestions.map(function(s, i) {
                  return (
                    <button key={i} onClick={function() { envoyer(s); }}
                      style={{ textAlign: 'left', background: '#fff', border: '1px solid #E0DCCF', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, color: '#1B6B3A', fontWeight: 600, cursor: 'pointer' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {messages.map(function(m, i) {
              var estUser = m.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: estUser ? 'flex-end' : 'flex-start', gap: 6 }}>
                  <div style={{
                    maxWidth: '88%', fontSize: 13, lineHeight: 1.5, padding: '9px 12px',
                    background: estUser ? '#1B6B3A' : (m.erreur ? '#FDEDEA' : '#F0F0EA'),
                    color: estUser ? '#fff' : (m.erreur ? '#B3261E' : '#1B2B22'),
                    borderRadius: estUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px'
                  }}>
                    {m.content}
                  </div>
                  {!estUser && Array.isArray(m.logements) && m.logements.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                      {m.logements.map(function(l) {
                        var photo = urlPremierePhoto(l.photos);
                        return (
                          <Link key={l.id} to={'/logements/' + l.id} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #ECE7D9', borderRadius: 10, padding: 8, textDecoration: 'none' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {photo ? <img src={photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Home size={16} color="#1B6B3A" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1B2B22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.titre}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{l.ville}{l.quartier ? ', ' + l.quartier : ''} · {GNF(l.prix_mensuel)}{t('chatbot.parMois')}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {envoi && (
              <div style={{ alignSelf: 'flex-start', fontSize: 11.5, color: '#999', padding: '2px 4px' }}>{t('chatbot.enTrainDecrire')}</div>
            )}
            <div ref={finRef} />
          </div>

          {/* Input */}
          <form onSubmit={function(e) { e.preventDefault(); envoyer(); }}
            style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #ECE7D9', flexShrink: 0, background: '#fff' }}>
            <input
              type="text"
              value={saisie}
              onChange={function(e) { setSaisie(e.target.value); }}
              placeholder={t('chatbot.placeholder')}
              disabled={envoi}
              style={{ flex: 1, minWidth: 0, border: '1px solid #E0DCCF', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#FBFAF6' }}
            />
            <button type="submit" disabled={envoi || !saisie.trim()}
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: envoi ? 'default' : 'pointer', opacity: envoi || !saisie.trim() ? 0.6 : 1 }}
              aria-label={t('chatbot.envoyer')}>
              <Send size={15} strokeWidth={2} />
            </button>
          </form>
        </div>
      )}

      <button onClick={function() { setOuvert(!ouvert); }}
        style={{
          width: 54, height: 54, borderRadius: '50%', border: 'none', background: '#1B6B3A', color: '#fff',
          boxShadow: '0 8px 24px rgba(27,107,58,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        aria-label={t('chatbot.bulle')}>
        {ouvert ? <X size={22} strokeWidth={2} /> : <MessageCircle size={22} strokeWidth={2} />}
      </button>
    </div>
  );
}
