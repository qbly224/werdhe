const express = require('express');
const cors    = require('cors');
require('dotenv').config();
require('./services/cronService');

const db = require('./database');

// ── Routes ──────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const logementRoutes     = require('./routes/logements');
const reservationRoutes  = require('./routes/reservations');
const paiementRoutes     = require('./routes/paiements');
const localisationRoutes = require('./routes/localisation');
const photoRoutes        = require('./routes/photos');
const documentRoutes     = require('./routes/documents');
const locataireRoutes    = require('./routes/locataires');
const alerteRoutes       = require('./routes/alertes');
const messagesRoutes     = require('./routes/messages');
const reclamationsRoutes = require('./routes/reclamations');
const scoresRoutes       = require('./routes/scores');
const adminRoutes        = require('./routes/admin');
const preavisRoutes      = require('./routes/preavis');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS — DOIT ÊTRE EN PREMIER ──────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true); // Accepter toutes les origines
  },
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true
}));

// ── Body parser — AVANT les routes ───────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────
app.use('/auth',              authRoutes);
app.use('/logements',         logementRoutes);
app.use('/logements',         photoRoutes);
app.use('/reservations',      reservationRoutes);
app.use('/paiements',         paiementRoutes);
app.use('/localisation',      localisationRoutes);
app.use('/documents',         documentRoutes);
app.use('/locataires-manuels', locataireRoutes);
app.use('/alertes',           alerteRoutes);
app.use('/messages',          messagesRoutes);
app.use('/reclamations',      reclamationsRoutes);
app.use('/scores',            scoresRoutes);
app.use('/admin',             adminRoutes);
app.use('/preavis',           preavisRoutes);

// ── Routes de test ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Werdhe API fonctionne !' });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM users');
    res.json({
      message:          'Base de données connectée !',
      nb_utilisateurs:  result.rows[0].count
    });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ── Démarrage ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('✅ Serveur démarré sur le port ' + PORT);
});