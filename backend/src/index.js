const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');
const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logements');
const reservationRoutes = require('./routes/reservations');
const paiementRoutes = require('./routes/paiements');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Configuration CORS améliorée
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://werdhe.vercel.app'  // URL de fallback
    : '*',  // En développement, tout autoriser
  credentials: true  // Permet les cookies/sessions
}));

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/logements', logementRoutes);
app.use('/reservations', reservationRoutes);
app.use('/paiements', paiementRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 Werdhe API fonctionne !' });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM users');
    res.json({
      message: '✅ Base de données connectée !',
      nb_utilisateurs: result.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS configuré pour : ${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'toutes origines'}`);
});