const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./database');
const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logements');
const reservationRoutes = require('./routes/reservations'); // 👈 AJOUTER

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/logements', logementRoutes);
app.use('/reservations', reservationRoutes); // 👈 AJOUTER

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