import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Profil.css';

const Profil = () => {
  const { user, login, token } = useAuth();

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
      toast.success('✅ Profil mis à jour !');
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  // Changer le mot de passe
  const handleMdpSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (formMdp.nouveau_mot_de_passe !== formMdp.confirmation) {
      return setErreur('Les mots de passe ne correspondent pas');
    }

    if (formMdp.nouveau_mot_de_passe.length < 6) {
      return setErreur('Minimum 6 caractères');
    }

    setLoading(true);

    try {
      await api.put('/auth/changer-mot-de-passe', {
        ancien_mot_de_passe: formMdp.ancien_mot_de_passe,
        nouveau_mot_de_passe: formMdp.nouveau_mot_de_passe
      });
      toast.success('✅ Mot de passe mis à jour !');
      setFormMdp({
        ancien_mot_de_passe: '',
        nouveau_mot_de_passe: '',
        confirmation: ''
      });
    } catch (err) {
      setErreur(err.response?.data?.erreur || 'Erreur serveur');
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
                {user?.role === 'proprietaire' && '🏠 Propriétaire'}
                {user?.role === 'locataire' && '🔍 Locataire'}
                {user?.role === 'les_deux' && '🔄 Propriétaire & Locataire'}
              </span>
            </div>
          </div>

          {/* Onglets */}
          <div className="onglets">
            <button
              className={`onglet ${onglet === 'infos' ? 'active' : ''}`}
              onClick={() => { setOnglet('infos'); setErreur(''); }}
            >
              👤 Mes informations
            </button>
            <button
              className={`onglet ${onglet === 'mdp' ? 'active' : ''}`}
              onClick={() => { setOnglet('mdp'); setErreur(''); }}
            >
              🔐 Mot de passe
            </button>
          </div>

          <div className="profil-card">

            {erreur && <div className="error">{erreur}</div>}

            {/* Onglet infos */}
            {onglet === 'infos' && (
              <form onSubmit={handleInfosSubmit}>
                <h2>👤 Mes informations</h2>

                <div className="form-row">
                  <div>
                    <label>Prénom</label>
                    <input
                      type="text"
                      value={formInfos.prenom}
                      onChange={(e) => setFormInfos({
                        ...formInfos, prenom: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label>Nom</label>
                    <input
                      type="text"
                      value={formInfos.nom}
                      onChange={(e) => setFormInfos({
                        ...formInfos, nom: e.target.value
                      })}
                    />
                  </div>
                </div>

                <label>Téléphone</label>
                <input
                  type="tel"
                  value={formInfos.telephone}
                  onChange={(e) => setFormInfos({
                    ...formInfos, telephone: e.target.value
                  })}
                  placeholder="622 000 000"
                />

                <label>Email</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <small style={{color: 'var(--gray)', fontSize: '12px'}}>
                  L'email ne peut pas être modifié
                </small>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '16px' }}
                  disabled={loading}
                >
                  {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
                </button>
              </form>
            )}

            {/* Onglet mot de passe */}
            {onglet === 'mdp' && (
              <form onSubmit={handleMdpSubmit}>
                <h2>🔐 Changer le mot de passe</h2>

                <label>Mot de passe actuel *</label>
                <input
                  type="password"
                  value={formMdp.ancien_mot_de_passe}
                  onChange={(e) => setFormMdp({
                    ...formMdp, ancien_mot_de_passe: e.target.value
                  })}
                  placeholder="Votre mot de passe actuel"
                  required
                />

                <label>Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={formMdp.nouveau_mot_de_passe}
                  onChange={(e) => setFormMdp({
                    ...formMdp, nouveau_mot_de_passe: e.target.value
                  })}
                  placeholder="Minimum 6 caractères"
                  required
                />

                <label>Confirmer le nouveau mot de passe *</label>
                <input
                  type="password"
                  value={formMdp.confirmation}
                  onChange={(e) => setFormMdp({
                    ...formMdp, confirmation: e.target.value
                  })}
                  placeholder="Répétez le nouveau mot de passe"
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '8px' }}
                  disabled={loading}
                >
                  {loading ? 'Mise à jour...' : '🔐 Changer le mot de passe'}
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