const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./services/cronService');

const db = require('./database');
const authRoutes = require('./routes/auth');
const logementRoutes = require('./routes/logements');
const reservationRoutes = require('./routes/reservations');
const paiementRoutes = require('./routes/paiements');
const localisationRoutes = require('./routes/localisation');
const photoRoutes = require('./routes/photos');
const documentRoutes = require('./routes/documents');
const locataireRoutes = require('./routes/locataires');
const alerteRoutes = require('./routes/alertes');
const messagesRoutes = require('./routes/messages');
const reclamationsRoutes = require('./routes/reclamations');
const scoresRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const preavisRoutes = require('./routes/preavis');
app.use('/preavis', preavisRoutes);

const cors = require('cors');

app.use(cors({
  origin: function(origin, callback) {
    var allowed = [
      'https://werdhe.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    if (!origin || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Accepter toutes les origines pour l'instant
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(express.json());

app.use('/auth', authRoutes);
app.use('/logements', logementRoutes);
app.use('/logements', photoRoutes);
app.use('/reservations', reservationRoutes);
app.use('/paiements', paiementRoutes);
app.use('/localisation', localisationRoutes);
app.use('/documents', documentRoutes);
app.use('/locataires-manuels', locataireRoutes);
app.use('/alertes', alerteRoutes);
app.use('/messages', messagesRoutes);
app.use('/reclamations', reclamationsRoutes);
app.use('/scores', scoresRoutes);

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

// Enregistrement du Service Worker pour le mode hors-ligne
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[Werdhe] Service Worker enregistre');
      })
      .catch(function(err) {
        console.warn('[Werdhe] Service Worker non enregistre:', err);
      });
  });
}