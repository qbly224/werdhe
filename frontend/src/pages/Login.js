{/* Connexion rapide pour les tests */}
<div className="test-accounts">
  <p>Comptes de test :</p>
  <button
    className="btn-test"
    onClick={() => setFormData({
      email: 'mamadou@werdhe.com',
      mot_de_passe: 'motdepasse123'
    })}
  >
    👤 Propriétaire
  </button>
  <button
    className="btn-test"
    onClick={() => setFormData({
      email: 'fatoumata@werdhe.com',
      mot_de_passe: 'motdepasse123'
    })}
  >
    👤 Locataire
  </button>
</div>

<div className="auth-footer">
  <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
  <br />
  Pas encore de compte ?{' '}
  <Link to="/register">S'inscrire gratuitement</Link>
</div>