import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import Logements from './pages/Logements';
import LogementDetail from './pages/LogementDetail';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Reserver from './pages/Reserver';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AjouterLogement from './pages/AjouterLogement';

const RoutePrivee = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logements" element={<Logements />} />
          <Route path="/logements/:id" element={<LogementDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes privées */}
          <Route path="/dashboard" element={
            <RoutePrivee><Dashboard /></RoutePrivee>
          } />
          <Route path="/profil" element={
            <RoutePrivee><Profil /></RoutePrivee>
          } />
          <Route path="/logements/:id/reserver" element={
            <RoutePrivee><Reserver /></RoutePrivee>
          } />
          <Route path="/logements/ajouter" element={
            <RoutePrivee><AjouterLogement /></RoutePrivee>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;