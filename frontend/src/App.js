import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import OTP from './pages/OTP';
import OnboardingProprietaire from './pages/OnboardingProprietaire';
import OnboardingLocataire from './pages/OnboardingLocataire';
import Profil from './pages/Profil';
import Reserver from './pages/Reserver';
import AjouterLogement from './pages/AjouterLogement';
import ReservationLocataire from './pages/ReservationLocataire';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LoginTelephone from './pages/LoginTelephone';
import LandingPage from './pages/LandingPage';
import ProfilPublic from './pages/ProfilPublic';
import AuthCallback from './pages/AuthCallback';
import Login2FA from './pages/Login2FA';
import { HelmetProvider } from 'react-helmet-async';
import NotFound from './pages/NotFound';
import React, { lazy, Suspense } from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', background: '#F7F8F7', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#1B6B3A', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <path d="M18 14 L24 9 L30 14 L30 20 L18 20 Z" fill="#F5A623"/>
              <rect x="22.5" y="20" width="3" height="16" rx="1" fill="#F5A623"/>
              <rect x="22.5" y="28" width="7" height="3" rx="1" fill="#F5A623"/>
              <rect x="22.5" y="33" width="5" height="3" rx="1" fill="#F5A623"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1B2B22', margin: '0 0 10px' }}>Une erreur est survenue</h2>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>Rechargez la page pour continuer.</p>
          <button onClick={function() { window.location.reload(); }}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
var Dashboard       = lazy(function() { return import('./pages/Dashboard'); });
var Admin           = lazy(function() { return import('./pages/Admin'); });
var Logements       = lazy(function() { return import('./pages/Logements'); });
var LogementDetail  = lazy(function() { return import('./pages/LogementDetail'); });
var Pricing         = lazy(function() { return import('./pages/Pricing'); });
var APropos         = lazy(function() { return import('./pages/APropos'); });
var Contact         = lazy(function() { return import('./pages/Contact'); });
var CGU             = lazy(function() { return import('./pages/CGU'); });
var Confidentialite = lazy(function() { return import('./pages/Confidentialite'); });

function RoutePrivee(props) {
  var auth = useAuth();
  if (auth.loading) return null;
  if (!auth.user) return <Navigate to="/login" />;
  return props.children;
}

function App() {
  return (
    <ErrorBoundary>
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
  <Suspense fallback={
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
     <div style={{ textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, border: '3px solid #E8F5E9', borderTop: '3px solid #1B6B3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <div style={{ fontSize: 14, color: '#888' }}>Chargement...</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  </div>
}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/accueil" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/onboarding/proprietaire" element={<OnboardingProprietaire />} />
          <Route path="/onboarding/locataire" element={<OnboardingLocataire />} />
          <Route path="/logements" element={<Logements />} />
          <Route path="/logements/:id" element={<LogementDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<RoutePrivee><Dashboard /></RoutePrivee>} />
          <Route path="/profil" element={<RoutePrivee><Profil /></RoutePrivee>} />
          <Route path="/logements/:id/reserver" element={<RoutePrivee><Reserver /></RoutePrivee>} />
          <Route path="/reservation/:id" element={<ReservationLocataire />} />
          <Route path="/logements/ajouter" element={<RoutePrivee><AjouterLogement /></RoutePrivee>} />
          <Route path="/admin" element={<RoutePrivee><Admin /></RoutePrivee>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login-telephone" element={<LoginTelephone />} />
          <Route path="/proprietaire/:id" element={<ProfilPublic />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/2fa" element={<Login2FA />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
  </Suspense>      
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;