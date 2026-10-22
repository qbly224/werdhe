/* eslint-disable */
import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageCircle, X, Send, Home, Paperclip, History, Plus, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { urlPremierePhoto } from '../utils/photos';
import { useAuth } from '../context/AuthContext';

var GNF = function(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' GNF'; };

// Pages où le widget ne doit pas s'afficher (espace admin interne)
function estMasque(pathname) {
  return pathname.startsWith('/admin');
}

// Redimensionne/compresse côté navigateur avant envoi — évite d'envoyer des
// photos de 4-5 Mo brutes sur une connexion mobile lente.
function compresserImage(file) {
  return new Promise(function(resolve) {
    var img = new window.Image();
    var url = URL.createObjectURL(file);
    img.onload = function() {
      var maxDim = 1280;
      var ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(blob) {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = function() { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function ChatbotWidget() {
  var location = useLocation();
  var { t, i18n } = useTranslation('public');
  var { user } = useAuth();
  var [ouvert, setOuvert] = useState(false);
  var [vue, setVue] = useState('chat'); // 'chat' | 'historique'
  var [messages, setMessages] = useState([]);
  var [saisie, setSaisie] = useState('');
  var [envoi, setEnvoi] = useState(false);
  var [conversationId, setConversationId] = useState(null);
  var [imageFile, setImageFile] = useState(null);
  var [imagePreview, setImagePreview] = useState(null);
  var [sessions, setSessions] = useState([]);
  var [chargementSessions, setChargementSessions] = useState(false);
  var finRef = useRef(null);
  var fileInputRef = useRef(null);

  useEffect(function() {
    if (finRef.current) finRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, envoi, vue]);

  if (estMasque(location.pathname)) return null;

  function nouvelleConversation() {
    setMessages([]);
    setConversationId(null);
    setImageFile(null);
    setImagePreview(null);
    setVue('chat');
  }

  function ouvrirHistorique() {
    setVue('historique');
    setChargementSessions(true);
    api.get('/chatbot/sessions').then(function(res) {
      setSessions(res.data.sessions || []);
    }).catch(function() {
      setSessions([]);
    }).finally(function() {
      setChargementSessions(false);
    });
  }

  function ouvrirSession(id) {
    setChargementSessions(true);
    api.get('/chatbot/sessions/' + id).then(function(res) {
      var msgs = (res.data.messages || []).map(function(m) {
        return { role: m.role, content: m.contenu, image_url: m.image_url };
      });
      setMessages(msgs);
      setConversationId(id);
      setVue('chat');
    }).catch(function() {}).finally(function() {
      setChargementSessions(false);
    });
  }

  async function choisirImage(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    var compresse = await compresserImage(file);
    setImageFile(compresse);
    setImagePreview(URL.createObjectURL(compresse));
  }

  function envoyer(texte) {
    var contenu = (texte || saisie).trim();
    if ((!contenu && !imageFile) || envoi) return;
    if (!contenu && imageFile) contenu = t('chatbot.messageImage');

    var historique = messages.concat([{ role: 'user', content: contenu, image_url: imagePreview }]);
    setMessages(historique);
    setSaisie('');
    var fichierEnCours = imageFile;
    setImageFile(null);
    setImagePreview(null);
    setEnvoi(true);

    var form = new FormData();
    form.append('messages', JSON.stringify(historique.map(function(m) { return { role: m.role, content: m.content }; })));
    form.append('locale', i18n.language === 'en' ? 'en' : 'fr');
    if (conversationId) form.append('conversation_id', conversationId);
    if (fichierEnCours) form.append('image', fichierEnCours);

    api.post('/chatbot/message', form).then(function(res) {
      if (res.data.conversation_id) setConversationId(res.data.conversation_id);
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
          width: 'min(360px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 110px))',
          background: '#fff', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column', marginBottom: 14, overflow: 'hidden',
          border: '1px solid #ECE7D9'
        }}>
          {/* Header */}
          <div style={{ background: '#1B2B22', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {vue === 'historique' ? (
              <button onClick={function() { setVue('chat'); }} aria-label={t('chatbot.retour')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <ArrowLeft size={18} color="#fff" />
              </button>
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1B6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={16} color="#fff" strokeWidth={2} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5 }}>{vue === 'historique' ? t('chatbot.historique') : t('chatbot.titre')}</div>
              {vue === 'chat' && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{t('chatbot.statut')}</div>}
            </div>
            {vue === 'chat' && user && (
              <button onClick={ouvrirHistorique} aria-label={t('chatbot.historique')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
                <History size={17} color="rgba(255,255,255,0.75)" />
              </button>
            )}
            {vue === 'chat' && (messages.length > 0) && (
              <button onClick={nouvelleConversation} aria-label={t('chatbot.nouvelleConversation')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
                <Plus size={17} color="rgba(255,255,255,0.75)" />
              </button>
            )}
            <button onClick={function() { setOuvert(false); }} aria-label={t('chatbot.fermer')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
              <X size={18} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {vue === 'historique' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: '#FBFAF6' }}>
              {chargementSessions && <div style={{ fontSize: 12.5, color: '#999', textAlign: 'center', padding: 20 }}>…</div>}
              {!chargementSessions && sessions.length === 0 && (
                <div style={{ fontSize: 12.5, color: '#999', textAlign: 'center', padding: 20 }}>{t('chatbot.aucunHistorique')}</div>
              )}
              {sessions.map(function(s) {
                return (
                  <button key={s.id} onClick={function() { ouvrirSession(s.id); }}
                    style={{ textAlign: 'left', background: '#fff', border: '1px solid #ECE7D9', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1B2B22', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.titre || t('chatbot.sansTitre')}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{new Date(s.updated_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </button>
                );
              })}
            </div>
          ) : (
          <>
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
                  {m.image_url && (
                    <img src={m.image_url} alt="" style={{ maxWidth: '70%', borderRadius: 12, display: 'block' }} />
                  )}
                  {m.content && (
                    <div style={{
                      maxWidth: '88%', fontSize: 13, lineHeight: 1.5, padding: '9px 12px',
                      background: estUser ? '#1B6B3A' : (m.erreur ? '#FDEDEA' : '#F0F0EA'),
                      color: estUser ? '#fff' : (m.erreur ? '#B3261E' : '#1B2B22'),
                      borderRadius: estUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px'
                    }}>
                      {m.content}
                    </div>
                  )}
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

          {imagePreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid #ECE7D9', background: '#fff' }}>
              <img src={imagePreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
              <div style={{ flex: 1, fontSize: 11.5, color: '#888' }}>{t('chatbot.imagePrete')}</div>
              <button type="button" onClick={function() { setImageFile(null); setImagePreview(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <X size={15} color="#999" />
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={function(e) { e.preventDefault(); envoyer(); }}
            style={{ display: 'flex', gap: 8, padding: 12, borderTop: imagePreview ? 'none' : '1px solid #ECE7D9', flexShrink: 0, background: '#fff' }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={choisirImage} style={{ display: 'none' }} />
            <button type="button" onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
              disabled={envoi} aria-label={t('chatbot.joindreImage')}
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: '1px solid #E0DCCF', background: '#FBFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Paperclip size={15} color="#1B6B3A" strokeWidth={2} />
            </button>
            <input
              type="text"
              value={saisie}
              onChange={function(e) { setSaisie(e.target.value); }}
              placeholder={t('chatbot.placeholder')}
              disabled={envoi}
              style={{ flex: 1, minWidth: 0, border: '1px solid #E0DCCF', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#FBFAF6' }}
            />
            <button type="submit" disabled={envoi || (!saisie.trim() && !imageFile)}
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: envoi ? 'default' : 'pointer', opacity: envoi || (!saisie.trim() && !imageFile) ? 0.6 : 1 }}
              aria-label={t('chatbot.envoyer')}>
              <Send size={15} strokeWidth={2} />
            </button>
          </form>
          </>
          )}
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
