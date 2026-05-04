import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Accueil.css';

const Accueil = () => {
  return (
    <div>
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Trouvez votre logement idéal en Guinée</h1>
          <p>
            Werdhè met en relation directe propriétaires et locataires.
            Simple, sécurisé, sans intermédiaire.
          </p>
          <div className="hero-buttons">
            <Link to="/logements" className="btn btn-primary btn-large">
              🔍 Rechercher un logement
            </Link>
            <Link to="/register" className="btn btn-secondary btn-large">
              📝 Publier un logement
            </Link>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">100%</span>
              <span className="stat-label">Digitale</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">0</span>
              <span className="stat-label">Intermédiaire</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">✅</span>
              <span className="stat-label">Facture garantie</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">💰</span>
              <span className="stat-label">Cash & En ligne</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="how-it-works">
        <div className="container">
          <h2>Comment ça marche ?</h2>
          <div className="steps-grid">

            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Créez votre compte</h3>
              <p>Inscrivez-vous en tant que propriétaire ou locataire en quelques minutes.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Trouvez ou publiez</h3>
              <p>Recherchez un logement selon vos critères ou publiez votre bien.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Réservez</h3>
              <p>Faites une demande de réservation directement au propriétaire.</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Payez et recevez votre facture</h3>
              <p>Payez en ligne ou en espèces. Une facture est générée automatiquement.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>🏠 Werdhè — Plateforme de location immobilière en Guinée</p>
          <p>Transparence · Sécurité · Simplicité</p>
        </div>
      </footer>
    </div>
  );
};

export default Accueil;