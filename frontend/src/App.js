import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages (on les créera dans les étapes suivantes)
import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import Logements from './pages/Logements';
import LogementDetail from './pages/LogementDetail';
import Dashboard from './pages/Dashboard';

// Composant pour protéger les routes privées
// Si non connecté → redirige vers login
const RoutePrivee = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Notifications toast */}
        <Toaster position="top-right" />

        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logements" element={<Logements />} />
          <Route path="/logements/:id" element={<LogementDetail />} />

          {/* Routes privées */}
          <Route path="/dashboard" element={
            <RoutePrivee><Dashboard /></RoutePrivee>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;