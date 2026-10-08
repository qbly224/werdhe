/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Home, User, Mail, Phone, Lock, Eye, EyeOff,
  Check, ChevronRight, ChevronLeft, ArrowRight, Building2, Search, Gift
} from 'lucide-react';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';

export default function Register() {
  var t             = useTranslation('public').t;
  var navigate      = useNavigate();
  var { login }     = useAuth();
  var [params]      = useSearchParams();
  var roleInitial   = params.get('role') || 'locataire';
  var refCode       = params.get('ref')  || '';
  var planInitial   = params.get('plan') || '';

  var [etape, setEtape]         = useState(1); // 1=rôle, 2=infos, 3=sécurité
  var [role, setRole]           = useState(roleInitial);
  var [prenom, setPrenom]       = useState('');
  var [nom, setNom]             = useState('');
  var [email, setEmail]         = useState('');
  var [telephone, setTelephone] = useState('');
  var [password, setPassword]   = useState('');
  var [showPwd, setShowPwd]     = useState(false);
  var [cgu, setCgu]             = useState(false);
  var [codeParrainage, setCodeParrainage] = useState(refCode);
  var [loading, setLoading]     = useState(false);
  var [erreur, setErreur]       = useState('');

  // Validation temps réel
  var emailValide    = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  var prenomValide   = prenom.trim().length >= 2;
  var nomValide      = nom.trim().length >= 2;
  var pwdForce       = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  var pwdLabels  = ['', t('register.pwd.tropCourt'), t('register.pwd.faible'), t('register.pwd.moyen'), t('register.pwd.fort')];
  var pwdColors  = ['', '#E53935', '#FB8C00', '#1565C0', '#1B6B3A'];

  var etape2Valide = prenomValide && nomValide && emailValide && telephone.length >= 8;
  var etape3Valide = password.length >= 6 && cgu;

  var estProprio = role === 'proprietaire';
  var couleur    = estProprio ? '#1B6B3A' : '#1565C0';
  var couleurBg  = estProprio ? '#E8F5E9' : '#E3F2FD';

  async function soumettre() {
    if (!etape3Valide) return;
    setLoading(true);
    setErreur('');
    try {
      var res = await api.post('/auth/register', {
        nom, prenom, email,
        telephone: '+224' + telephone.replace(/\s/g, ''),
        mot_de_passe: password,
        role,
        code_parrainage: codeParrainage || undefined
      });
      var utilisateur = res.data.user;
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(utilisateur));
        if (login) login(utilisateur, res.data.token);
      }

      // Démarrer directement l'essai gratuit 1 mois si un plan a été choisi
      // depuis la page tarifs (Pro ou Agence)
      if (role === 'proprietaire' && ['pro', 'agence'].includes(planInitial)) {
        try {
          await api.post('/abonnements/essai', { plan: planInitial });
          utilisateur = Object.assign({}, utilisateur, { plan: planInitial });
          localStorage.setItem('user', JSON.stringify(utilisateur));
          if (login) login(utilisateur, res.data.token);
        } catch (essaiErr) {
          // Non bloquant : le compte est créé, l'essai pourra être démarré depuis le dashboard
        }
      }

      toast.success(t('register.compteCreeSucces'));
      navigate(role === 'proprietaire' ? '/onboarding/proprietaire' : '/onboarding/locataire');
    } catch (err) {
      setErreur(err.response && err.response.data ? err.response.data.erreur : t('register.erreurCreation'));
      setEtape(2);
    } finally {
      setLoading(false);
    }
  }

  // Barre de progression
  var ETAPES = [t('register.etapes.role'), t('register.etapes.infos'), t('register.etapes.securite')];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8F7', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Logo size={34} showText={true} darkBg={false} />
        </Link>
        <span style={{ fontSize: 13, color: '#888' }}>
          {t('register.dejaCompte')}{' '}
          <Link to="/login" style={{ color: couleur, fontWeight: 700, textDecoration: 'none' }}>{t('register.seConnecter')}</Link>
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px 48px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Étapes */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {ETAPES.map(function(e, i) {
              var num   = i + 1;
              var actif = etape === num;
              var fait  = etape > num;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < ETAPES.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: fait ? '#1B6B3A' : actif ? couleur : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                      {fait
                        ? <Check size={16} color="#fff" strokeWidth={2.5} />
                        : <span style={{ fontSize: 13, fontWeight: 700, color: actif ? '#fff' : '#aaa' }}>{num}</span>
                      }
                    </div>
                    <span style={{ fontSize: 10, color: actif ? couleur : fait ? '#1B6B3A' : '#aaa', fontWeight: actif ? 700 : 400, whiteSpace: 'nowrap' }}>{e}</span>
                  </div>
                  {i < ETAPES.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: fait ? '#1B6B3A' : '#E0E0E0', margin: '0 6px 16px', transition: 'all .3s' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Carte */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>

            {/* ═══ ÉTAPE 1 — Rôle ═══════════════════════════════ */}
            {etape === 1 && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px', letterSpacing: -0.5 }}>
                  {t('register.creerMonCompte')}
                </h1>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>
                  {t('register.gratuitSansCB')}
                </p>

                {/* Google OAuth */}
                <button
                  onClick={function() { window.location.href = 'https://api.werdhe.com/auth/google'; }}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: '#1B2B22', cursor: 'pointer', marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('register.continuerGoogle')}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
                  <span style={{ fontSize: 12, color: '#aaa' }}>{t('register.ouParEmail')}</span>
                  <div style={{ flex: 1, height: 0.5, background: '#E0E0E0' }} />
                </div>

                <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 10 }}>{t('register.jeSuis')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { val: 'proprietaire', icone: <Building2 size={28} strokeWidth={1} color="#1B6B3A" />, titre: t('register.roles.proprietaire.titre'),  desc: t('register.roles.proprietaire.desc'), couleur: '#1B6B3A', bg: '#E8F5E9' },
                    { val: 'locataire',    icone: <Search    size={28} strokeWidth={1} color="#1565C0" />, titre: t('register.roles.locataire.titre'),     desc: t('register.roles.locataire.desc'),    couleur: '#1565C0', bg: '#E3F2FD' },
                  ].map(function(r) {
                    var sel = role === r.val;
                    return (
                      <div key={r.val} onClick={function() { setRole(r.val); }}
                        style={{ padding: '16px 14px', borderRadius: 14, border: sel ? '2px solid ' + r.couleur : '1.5px solid #E0E0E0', background: sel ? r.bg : '#FAFAFA', cursor: 'pointer', transition: 'all .2s', textAlign: 'center' }}>
                          <div style={{ marginBottom: 8 }}>{r.icone}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: sel ? r.couleur : '#1B2B22', marginBottom: 4 }}>{r.titre}</div>
                        <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{r.desc}</div>
                        {sel && (
                          <div style={{ width: 20, height: 20, background: r.couleur, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 0' }}>
                            <Check size={12} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {role === 'proprietaire' && (
                  <div style={{ background: '#E8F5E9', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={14} strokeWidth={2} /> {t('register.essaiPlan', { plan: planInitial === 'agence' ? t('register.plans.agence') : t('register.plans.pro') })}
                  </div>
                )}
                {role === 'locataire' && (
                  <div style={{ background: '#E3F2FD', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1565C0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Gift size={14} strokeWidth={1.5} /> {t('register.gratuitLocataires')}
                  </div>
                )}

                <button onClick={function() { setEtape(2); }}
                  style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: couleur, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {t('register.continuer')} <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* ═══ ÉTAPE 2 — Informations ════════════════════════ */}
            {etape === 2 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>{t('register.vosInformations')}</h2>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
                  {t('register.compteType', { type: role === 'proprietaire' ? t('register.roles.proprietaire.titre') : t('register.roles.locataire.titre') })}
                </p>

                {erreur && (
                  <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B71C1C' }}>
                    {erreur}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('register.champPrenom')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" placeholder={t('register.placeholderPrenom')} value={prenom}
                        onChange={function(e) { setPrenom(e.target.value); }}
                        style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid ' + (prenom.length > 0 ? (prenomValide ? '#1B6B3A' : '#E53935') : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('register.champNom')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" placeholder={t('register.placeholderNom')} value={nom}
                        onChange={function(e) { setNom(e.target.value); }}
                        style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid ' + (nom.length > 0 ? (nomValide ? '#1B6B3A' : '#E53935') : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('register.champEmail')}</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="email" placeholder={t('register.placeholderEmail')} value={email}
                      onChange={function(e) { setEmail(e.target.value); }}
                      style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid ' + (email.length > 0 ? (emailValide ? '#1B6B3A' : '#E53935') : '#E0E0E0'), borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    {email.length > 0 && emailValide && (
                      <Check size={14} color="#1B6B3A" strokeWidth={2.5} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('register.champTelephone')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ background: '#F7F8F7', border: '1.5px solid #E0E0E0', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      🇬🇳 +224
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Phone size={14} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="tel" placeholder={t('register.placeholderTelephone')} value={telephone}
                        onChange={function(e) { setTelephone(e.target.value); }}
                        style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                {/* Code parrainage */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
                    {t('register.codeParrainage')} <span style={{ color: '#aaa', fontWeight: 400 }}>({t('register.optionnel')})</span>
                  </label>
                  <input type="text" placeholder={t('register.placeholderParrainage')} value={codeParrainage}
                    onChange={function(e) { setCodeParrainage(e.target.value.toUpperCase()); }}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'monospace', letterSpacing: 1, boxSizing: 'border-box' }} />
                  {codeParrainage && (
                    <div style={{ fontSize: 12, color: '#1B6B3A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Gift size={13} strokeWidth={1.5} /> {t('register.creditParrainage')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={function() { setEtape(1); }}
                    style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft size={16} strokeWidth={2} /> {t('register.retour')}
                  </button>
                  <button onClick={function() { if (etape2Valide) setEtape(3); }}
                    disabled={!etape2Valide}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: etape2Valide ? couleur : '#E0E0E0', color: etape2Valide ? '#fff' : '#aaa', fontSize: 14, fontWeight: 700, cursor: etape2Valide ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {t('register.continuer')} <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ ÉTAPE 3 — Sécurité ════════════════════════════ */}
            {etape === 3 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2B22', margin: '0 0 6px' }}>{t('register.securisezCompte')}</h2>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>{t('register.choisissezMotDePasse')}</p>

                {/* Récapitulatif */}
                <div style={{ background: '#F7F8F7', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {role === 'proprietaire' ? <Home size={16} strokeWidth={1.5} /> : <Search size={16} strokeWidth={1.5} />}
                    <span style={{ fontWeight: 700, color: '#1B2B22' }}>{prenom} {nom}</span>
                    <span style={{ background: couleurBg, color: couleur, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {role === 'proprietaire' ? t('register.roles.proprietaire.titre') : t('register.roles.locataire.titre')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{email}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{t('register.champMotDePasse')}</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="#aaa" strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type={showPwd ? 'text' : 'password'} placeholder={t('register.placeholderMotDePasse')} value={password}
                      onChange={function(e) { setPassword(e.target.value); }}
                      style={{ width: '100%', padding: '10px 40px 10px 34px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={function() { setShowPwd(!showPwd); }}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0 }}>
                      {showPwd ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>

                  {/* Barre de force */}
                  {password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(function(i) {
                          return (
                            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwdForce ? pwdColors[pwdForce] : '#E0E0E0', transition: 'all .2s' }} />
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: pwdColors[pwdForce], fontWeight: 600 }}>{pwdLabels[pwdForce]}</div>
                    </div>
                  )}
                </div>

                {/* CGU */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                  <input type="checkbox" id="cgu" checked={cgu} onChange={function(e) { setCgu(e.target.checked); }}
                    style={{ marginTop: 2, width: 16, height: 16, accentColor: couleur, flexShrink: 0, cursor: 'pointer' }} />
                  <label htmlFor="cgu" style={{ fontSize: 13, color: '#555', lineHeight: 1.5, cursor: 'pointer' }}>
                    {t('register.jAccepteLes')}{' '}
                    <Link to="/cgu" target="_blank" style={{ color: couleur, textDecoration: 'none', fontWeight: 600 }}>{t('register.conditionsUtilisation')}</Link>
                    {' '}{t('register.etLa')}{' '}
                    <Link to="/confidentialite" target="_blank" style={{ color: couleur, textDecoration: 'none', fontWeight: 600 }}>{t('register.politiqueConfidentialite')}</Link>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={function() { setEtape(2); }}
                    style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E0E0E0', background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft size={16} strokeWidth={2} /> {t('register.retour')}
                  </button>
                  <button onClick={soumettre}
                    disabled={!etape3Valide || loading}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: etape3Valide && !loading ? couleur : '#E0E0E0', color: etape3Valide && !loading ? '#fff' : '#aaa', fontSize: 14, fontWeight: 700, cursor: etape3Valide && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading
                      ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {t('register.creationEnCours')}</>
                      : <>{t('register.creerMonCompteBtn')} <ArrowRight size={16} strokeWidth={2.5} /></>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 20 }}>
            {t('register.dejaCompte')}{' '}
            <Link to="/login" style={{ color: couleur, fontWeight: 700, textDecoration: 'none' }}>{t('register.seConnecter')}</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:focus { border-color: ${couleur} !important; box-shadow: 0 0 0 3px ${couleurBg} !important; }
      `}</style>
    </div>
  );
}