import axios from 'axios';

// URL de base du backend
// En développement → localhost
// En production → l'URL Render qu'on configurera plus tard
const API_URL = 'http://localhost:3000';

// Créer une instance axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur de requête
// Ajoute automatiquement le token JWT à chaque requête
// Comme un middleware côté client
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse
// Gère les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si token expiré → déconnexion automatique
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;