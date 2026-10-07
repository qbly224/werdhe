/* eslint-disable */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function AuthCallback() {
  var t               = useTranslation('public').t;
  var navigate       = useNavigate();
  var [params]       = useSearchParams();
  var auth           = useAuth();

  useEffect(function() {
    var token  = params.get('token');
    var error  = params.get('error');
    var prenom = params.get('prenom');
    var role   = params.get('role');

    if (error) {
      toast.error(t('authCallback.connexionEchouee'));
      navigate('/login');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    // Décoder le token pour récupérer les infos
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      var user = {
        id:                 payload.id,
        email:              payload.email,
        role:               payload.role,
        nom:                payload.nom,
        prenom:             payload.prenom,
        plan:               payload.plan || 'gratuit',
        onboarding_termine: payload.onboarding_termine || false
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (auth.login) auth.login(user, token);

      toast.success(t('authCallback.bienvenue', { prenom: prenom || user.prenom }));
      navigate('/dashboard');

    } catch (err) {
      console.error('[AuthCallback]', err.message);
      toast.error(t('authCallback.erreurConnexion'));
      navigate('/login');
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888', fontSize: 15 }}>{t('authCallback.connexionEnCours')}</p>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}