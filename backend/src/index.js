const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');
const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logements');
const reservationRoutes = require('./routes/reservations');
const paiementRoutes = require('./routes/paiements');
const localisationRoutes = require('./routes/localisation');
const photoRoutes = require('./routes/photos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
  credentials: true
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/logements', logementRoutes);
app.use('/reservations', reservationRoutes);
app.use('/paiements', paiementRoutes);
app.use('/localisation', localisationRoutes);
app.use('/logements', photoRoutes);

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
});