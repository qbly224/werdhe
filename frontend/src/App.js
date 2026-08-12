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
import { lazy, Suspense } from 'react';
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
  );
}

export default App;