/* eslint-disable */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import Logo from '../components/Logo';

export default function RejoindreEquipe() {
  var t = useTranslation('dashboard').t;
  var navigate = useNavigate();
  var [searchParams] = useSearchParams();
  var token = searchParams.get('token');
  var [invitation, setInvitation] = useState(null);
  var [loading, setLoading] = useState(true);
  var [erreur, setErreur] = useState(null);
  var [accepting, setAccepting] = useState(false);
  var [accepte, setAccepte] = useState(false);

  useEffect(function() {
    if (!token) { setErreur(t('rejoindreEquipe.lienInvalide')); setLoading(false); return; }
    api.get('/equipe/invitation/' + token)
      .then(function(res) { setInvitation(res.data.invitation); })
      .catch(function(err) { setErreur(err.response && err.response.data ? err.response.data.erreur : t('rejoindreEquipe.lienInvalide')); })
      .finally(function() { setLoading(false); });
  }, [token]);

  function accepter() {
    setAccepting(true);
    api.post('/equipe/invitation/' + token + '/accepter')
      .then(function() {
        setAccepte(true);
        toast.success(t('rejoindreEquipe.toastBienvenue'));
        setTimeout(function() { navigate('/dashboard'); }, 1800);
      })
      .catch(function(err) { toast.error(err.response && err.response.data ? err.response.data.erreur : t('rejoindreEquipe.erreurGenerique')); })
      .finally(function() { setAccepting(false); });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}><Logo /></div>

        {loading && <div style={{ color: '#888', fontSize: 14 }}>{t('rejoindreEquipe.chargement')}</div>}

        {!loading && erreur && (
          <div>
            <XCircle size={48} strokeWidth={1.2} color="#E53935" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 17, color: '#1B2B22', marginBottom: 8 }}>{t('rejoindreEquipe.titreErreur')}</h2>
            <p style={{ fontSize: 13, color: '#888' }}>{erreur}</p>
          </div>
        )}

        {!loading && !erreur && !accepte && invitation && (
          <div>
            <Users size={48} strokeWidth={1.2} color="#1B6B3A" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 17, color: '#1B2B22', marginBottom: 8 }}>{t('rejoindreEquipe.titre')}</h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
              {t('rejoindreEquipe.description', { prenom: invitation.agence_prenom, nom: invitation.agence_nom })}
            </p>
            <button onClick={accepter} disabled={accepting}
              style={{ width: '100%', padding: 13, background: accepting ? '#aaa' : '#1B6B3A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: accepting ? 'not-allowed' : 'pointer' }}>
              {accepting ? t('rejoindreEquipe.enCours') : t('rejoindreEquipe.rejoindre')}
            </button>
          </div>
        )}

        {accepte && (
          <div>
            <CheckCircle2 size={48} strokeWidth={1.2} color="#1B6B3A" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 17, color: '#1B2B22' }}>{t('rejoindreEquipe.bienvenue')}</h2>
          </div>
        )}
      </div>
    </div>
  );
}
