import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import OTP from './pages/OTP';
import OnboardingProprietaire from './pages/OnboardingProprietaire';
import OnboardingLocataire from './pages/OnboardingLocataire';
import Logements from './pages/Logements';
import LogementDetail from './pages/LogementDetail';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Reserver from './pages/Reserver';
import AjouterLogement from './pages/AjouterLogement';
import ReservationLocataire from './pages/ReservationLocataire';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import LoginTelephone from './pages/LoginTelephone';
import LandingPage from './pages/LandingPage';
import ProfilPublic from './pages/ProfilPublic';
import AuthCallback from './pages/AuthCallback';
import Login2FA from './pages/Login2FA';
import { HelmetProvider } from 'react-helmet-async';
import CGU from './pages/CGU';
import Confidentialite from './pages/Confidentialite';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

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
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/accueil" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;