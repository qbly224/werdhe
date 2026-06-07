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

function RoutePrivee(props) {
  var auth = useAuth();
  if (auth.loading) return null;
  if (!auth.user) return <Navigate to="/login" />;
  return props.children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Accueil />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;