import { createContext, useContext, useState, useEffect } from 'react';

// Créer le contexte
const AuthContext = createContext();

// Provider — enveloppe toute l'app et fournit les données auth
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage → récupérer l'utilisateur depuis localStorage
  // Comme lire un fichier de session au boot
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Connexion → sauvegarder token et user
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Déconnexion → tout effacer
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte facilement
export const useAuth = () => useContext(AuthContext);