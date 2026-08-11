const express = require('express');
const cors    = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Limiter les tentatives de connexion (10 par minute par IP)
const limiteurConnexion = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { erreur: 'Trop de tentatives. Réessayez dans 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter les requêtes API générales (100 par minute par IP)
const limiteurAPI = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { erreur: 'Trop de requêtes. Réessayez dans 1 minute.' },
});

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
const abonnementRoutes = require('./routes/abonnements');
const notationsRoutes = require('./routes/notations');

// ── Vérifier les variables d'environnement obligatoires ──────────
var ENV_REQUISES = ['JWT_SECRET', 'DATABASE_URL'];
var manquantes = ENV_REQUISES.filter(function(v) { return !process.env[v]; });
if (manquantes.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', manquantes.join(', '));
  process.exit(1);
}
console.log('✅ Variables d\'environnement vérifiées');

const app  = express();
const logger = require('./services/loggerService');

// Middleware de logging des requêtes
app.use(function(req, res, next) {
  var debut = Date.now();
  res.on('finish', function() {
    logger.requete(req, res, Date.now() - debut);
  });
  next();
});

const PORT = process.env.PORT || 3000;

// ── CORS — DOIT ÊTRE EN PREMIER ──────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    var allowed = [
      'https://werdhe.com',
      'https://www.werdhe.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    if (!origin || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS'));
    }
  },
  methods:      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:  true
}));

const { router: pushRoutes } = require('./routes/push');
app.use('/push', pushRoutes);

const rapportsRoutes = require('./routes/rapports');
app.use('/rapports', rapportsRoutes);

const renouvellements = require('./routes/renouvellements');
app.use('/renouvellements', renouvellements);

const passport = require('./config/passport');
app.use(passport.initialize());
// Compresser toutes les réponses (gzip)
app.use(compression());

// ── Body parser — AVANT les routes ───────────────────────────────
app.use(express.json({ limit: '10mb' }));
// Appliquer les limites
app.use('/api', limiteurAPI);
app.use('/auth/connexion',              limiteurConnexion);
app.use('/auth/login',                  limiteurConnexion);
app.use('/auth/telephone/envoyer-otp',  limiteurConnexion);
app.use('/auth/telephone/verifier-otp', limiteurConnexion);
app.use('/auth/admin/verifier-2fa',     limiteurConnexion);
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
app.use('/abonnements', abonnementRoutes);
app.use('/notations', notationsRoutes);

// ── Routes de test ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    service: 'Werdhe API',
    version: '1.0.0',
    date:    new Date().toISOString()
  });
});

// Health check pour Render / monitoring
app.get('/health', async (req, res) => {
  try {
    var debut = Date.now();
    await db.query('SELECT 1');
    var duree = Date.now() - debut;
    res.json({
      status:   'healthy',
      database: 'connected',
      latence:  duree + 'ms',
      uptime:   Math.round(process.uptime()) + 's',
      memoire:  Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      date:     new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status:   'unhealthy',
      database: 'disconnected',
      erreur:   err.message
    });
  }
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

app.get('/sitemap.xml', async (req, res) => {
  try {
    var logements = await db.query(
      `SELECT id, updated_at FROM logements WHERE statut = 'disponible' LIMIT 1000`
    );
    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    [
      { loc: 'https://werdhe.com/',         priority: '1.0', changefreq: 'daily'  },
      { loc: 'https://werdhe.com/logements', priority: '0.9', changefreq: 'hourly' },
      { loc: 'https://werdhe.com/pricing',   priority: '0.7', changefreq: 'monthly'},
    ].forEach(function(u) {
      xml += `  <url><loc>${u.loc}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>\n`;
    });
    logements.rows.forEach(function(l) {
      xml += `  <url><loc>https://werdhe.com/logements/${l.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });
    xml += '</urlset>';
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { res.status(500).send('Erreur'); }
});

// ── Démarrage ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('✅ Serveur démarré sur le port ' + PORT);
});