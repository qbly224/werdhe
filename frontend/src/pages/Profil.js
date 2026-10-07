import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './Profil.css';

const Profil = () => {
  const { user, login, token } = useAuth();
  const { t } = useTranslation('profil');

  const [onglet, setOnglet] = useState('infos');
  const [loading, setLoading] = useState(false);

  // Formulaire infos
  const [formInfos, setFormInfos] = useState({
    nom: '',
    prenom: '',
    telephone: ''
  });

  // Formulaire mot de passe
  const [formMdp, setFormMdp] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmation: ''
  });

  const [erreur, setErreur] = useState('');

  // Charger les infos au démarrage
  useEffect(() => {
    const chargerProfil = async () => {
      try {
        const res = await api.get('/auth/profil');
        const u = res.data.user;
        setFormInfos({
          nom: u.nom || '',
          prenom: u.prenom || '',
          telephone: u.telephone || ''
        });
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      }
    };
    chargerProfil();
  }, []);

  // Modifier les infos
  const handleInfosSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      const res = await api.put('/auth/profil', formInfos);
      // Mettre à jour le context avec les nouvelles infos
      login(res.data.user, token);
      toast.success(t('profil.infos.toastSucces'));
    } catch (err) {
      setErreur(err.response?.data?.erreur || t('profil.erreurServeur'));
    } finally {
      setLoading(false);
    }
  };

  // Changer le mot de passe
  const handleMdpSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (formMdp.nouveau_mot_de_passe !== formMdp.confirmation) {
      return setErreur(t('profil.motDePasse.erreurCorrespondance'));
    }

    if (formMdp.nouveau_mot_de_passe.length < 6) {
      return setErreur(t('profil.motDePasse.erreurMinimum'));
    }

    setLoading(true);

    try {
      await api.put('/auth/changer-mot-de-passe', {
        ancien_mot_de_passe: formMdp.ancien_mot_de_passe,
        nouveau_mot_de_passe: formMdp.nouveau_mot_de_passe
      });
      toast.success(t('profil.motDePasse.toastSucces'));
      setFormMdp({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation: ''
      });
    } catch (err) {
      setErreur(err.response?.data?.erreur || t('profil.erreurServeur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="profil-page">
        <div className="container">

          {/* Header profil */}
          <div className="profil-header">
            <div className="profil-avatar">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div>
              <h1>{user?.prenom} {user?.nom}</h1>
              <p>{user?.email}</p>
              <span className="profil-role">
                {user?.role === 'proprietaire' && t('profil.header.proprietaire')}
                {user?.role === 'locataire' && t('profil.header.locataire')}
                {user?.role === 'les_deux' && t('profil.header.proprietaireEtLocataire')}
              </span>
            </div>
          </div>

          {/* Onglets */}
          <div className="onglets">
            <button
              className={`onglet ${onglet === 'infos' ? 'active' : ''}`}
              onClick={() => { setOnglet('infos'); setErreur(''); }}
            >
              {t('profil.onglets.infos')}
            </button>
            <button
              className={`onglet ${onglet === 'mdp' ? 'active' : ''}`}
              onClick={() => { setOnglet('mdp'); setErreur(''); }}
            >
              {t('profil.onglets.motDePasse')}
            </button>
          </div>

          <div className="profil-card">

            {erreur && <div className="error">{erreur}</div>}

            {/* Onglet infos */}
            {onglet === 'infos' && (
              <form onSubmit={handleInfosSubmit}>
                <h2>{t('profil.infos.titre')}</h2>

                <div className="form-row">
                  <div>
                    <label>{t('profil.infos.prenom')}</label>
                    <input
                      type="text"
                      value={formInfos.prenom}
                      onChange={(e) => setFormInfos({
                        ...formInfos, prenom: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label>{t('profil.infos.nom')}</label>
                    <input
                      type="text"
                      value={formInfos.nom}
                      onChange={(e) => setFormInfos({
                        ...formInfos, nom: e.target.value
                      })}
                    />
                  </div>
                </div>

                <label>{t('profil.infos.telephone')}</label>
                <input
                  type="tel"
                  value={formInfos.telephone}
                  onChange={(e) => setFormInfos({
                    ...formInfos, telephone: e.target.value
                  })}
                  placeholder={t('profil.infos.telephonePlaceholder')}
                />

                <label>{t('profil.infos.email')}</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <small style={{color: 'var(--gray)', fontSize: '12px'}}>
                  {t('profil.infos.emailNonModifiable')}
                </small>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                  disabled={loading}
                >
                  {loading ? t('profil.infos.sauvegarde') : t('profil.infos.sauvegarder')}
                </button>
              </form>
            )}

            {/* Onglet mot de passe */}
            {onglet === 'mdp' && (
              <form onSubmit={handleMdpSubmit}>
                <h2>{t('profil.motDePasse.titre')}</h2>

                <label>{t('profil.motDePasse.actuel')}</label>
                <input
                  type="password"
                  value={formMdp.ancien_mot_de_passe}
                  onChange={(e) => setFormMdp({
                    ...formMdp, ancien_mot_de_passe: e.target.value
                  })}
                  placeholder={t('profil.motDePasse.actuelPlaceholder')}
                  required
                />

                <label>{t('profil.motDePasse.nouveau')}</label>
                <input
                  type="password"
                  value={formMdp.nouveau_mot_de_passe}
                  onChange={(e) => setFormMdp({
                    ...formMdp, nouveau_mot_de_passe: e.target.value
                  })}
                  placeholder={t('profil.motDePasse.nouveauPlaceholder')}
                  required
                />

                <label>{t('profil.motDePasse.confirmation')}</label>
                <input
                  type="password"
                  value={formMdp.confirmation}
                  onChange={(e) => setFormMdp({
                    ...formMdp, confirmation: e.target.value
                  })}
                  placeholder={t('profil.motDePasse.confirmationPlaceholder')}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading ? t('profil.motDePasse.miseAJour') : t('profil.motDePasse.changer')}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;