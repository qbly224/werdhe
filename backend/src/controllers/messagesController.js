const db = require('../database');
const { cloudinary } = require('../services/cloudinaryService');
const multer = require('multer');

// ================================================
// UPLOAD MULTER pour photos et documents
// ================================================
const uploadMessage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (req, file, cb) => {
    // Accepte images, PDF, Word, Excel
    var typesAutorises = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (typesAutorises.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporte. Utilisez images, PDF ou Word.'), false);
    }
  }
});

// ================================================
// ENVOYER UN MESSAGE (texte ou fichier)
// ================================================
const envoyerMessage = async (req, res) => {
  try {
    var { destinataire_id, contenu, reservation_id } = req.body;
    var expediteur_id = req.user.id;
    var fichierUrl = null;
    var fichierNom = null;
    var fichierType = null;
    var typeMsg = 'texte';

    if (!destinataire_id) {
      return res.status(400).json({ erreur: 'Destinataire requis' });
    }

    // Si un fichier est joint, l'uploader sur Cloudinary
   if (req.file) {
      var isImage = req.file.mimetype.startsWith('image/');
      var buffer  = req.file.buffer.toString('base64');
      var dataUri = 'data:' + req.file.mimetype + ';base64,' + buffer;

      // Vérifier que cloudinary est bien configuré
      if (!cloudinary || !cloudinary.uploader) {
        console.warn('[Messages] Cloudinary non configuré — fichier ignoré');
      } else {
        var uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder:        'werdhe/messages',
          resource_type: isImage ? 'image' : 'raw',
          public_id:     'msg_' + Date.now()
        });
        fichierUrl  = uploadResult.secure_url;
        fichierNom  = req.file.originalname;
        fichierType = req.file.mimetype;
        typeMsg     = isImage ? 'photo' : 'document';
      }
    }

    if (!contenu && !fichierUrl) {
      return res.status(400).json({ erreur: 'Message ou fichier requis' });
    }

    // Insérer le message en DB
    var result = await db.query(
      `INSERT INTO messages
        (expedition_id, destinataire_id, reservation_id,
         contenu, type, fichier_url, fichier_nom, fichier_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        expediteur_id, destinataire_id, reservation_id || null,
        contenu || null, typeMsg, fichierUrl, fichierNom, fichierType
      ]
    );

    // Récupérer les infos de l'expéditeur pour la réponse
    var expediteur = await db.query(
      'SELECT nom, prenom FROM users WHERE id = $1',
      [expediteur_id]
    );

    res.status(201).json({
      message: 'Message envoye !',
      data: Object.assign({}, result.rows[0], {
        expediteur_nom: expediteur.rows[0].nom,
        expediteur_prenom: expediteur.rows[0].prenom
      })
    });

  } catch (err) {
    console.error('Erreur envoi message:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// VOIR MES CONVERSATIONS
// Liste toutes les personnes avec qui j'ai echange
// ================================================
const getConversations = async (req, res) => {
  try {
    var userId = req.user.id;

    // Récupérer la dernière conversation avec chaque interlocuteur
    var result = await db.query(
      `WITH derniers_messages AS (
         SELECT
           CASE WHEN m.expedition_id = $1
             THEN m.destinataire_id
             ELSE m.expedition_id
           END as interlocuteur_id,
           m.contenu,
           m.type,
           m.fichier_nom,
           m.created_at,
           m.lu,
           m.expedition_id,
           ROW_NUMBER() OVER (
             PARTITION BY
               CASE WHEN m.expedition_id = $1
                 THEN m.destinataire_id
                 ELSE m.expedition_id
               END
             ORDER BY m.created_at DESC
           ) as rn
         FROM messages m
         WHERE m.expedition_id = $1 OR m.destinataire_id = $1
       )
       SELECT
         dm.*,
         u.nom, u.prenom, u.email, u.telephone, u.role,
         -- Compter les messages non lus
         (SELECT COUNT(*) FROM messages
          WHERE expedition_id = dm.interlocuteur_id
          AND destinataire_id = $1
          AND lu = FALSE) as non_lus,
         -- Récupérer le logement associé
         r.logement_id,
         l.titre as logement_titre
       FROM derniers_messages dm
       JOIN users u ON dm.interlocuteur_id = u.id
       LEFT JOIN messages m2 ON m2.expedition_id = dm.interlocuteur_id
         AND (m2.reservation_id IS NOT NULL)
       LEFT JOIN reservations r ON r.locataire_id = LEAST(dm.interlocuteur_id, $1)
         AND r.logement_id IN (
           SELECT logement_id FROM logements WHERE proprietaire_id = GREATEST(dm.interlocuteur_id, $1)
         )
       LEFT JOIN logements l ON r.logement_id = l.id
       WHERE dm.rn = 1
       ORDER BY dm.created_at DESC`,
      [userId]
    );

    res.json({
      conversations: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Erreur conversations:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// VOIR LES MESSAGES D'UNE CONVERSATION
// ================================================
const getMessages = async (req, res) => {
  try {
    var userId = req.user.id;
    var { interlocuteur_id } = req.params;
    var { page = 1 } = req.query;
    var limit = 50;
    var offset = (page - 1) * limit;

    // Récupérer les messages entre les deux utilisateurs
    var result = await db.query(
      `SELECT m.*,
         u_exp.nom as exp_nom, u_exp.prenom as exp_prenom
       FROM messages m
       JOIN users u_exp ON m.expedition_id = u_exp.id
       WHERE (m.expedition_id = $1 AND m.destinataire_id = $2)
          OR (m.expedition_id = $2 AND m.destinataire_id = $1)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, interlocuteur_id, limit, offset]
    );

    // Marquer les messages reçus comme lus
    await db.query(
      `UPDATE messages SET lu = TRUE
       WHERE expedition_id = $1 AND destinataire_id = $2 AND lu = FALSE`,
      [interlocuteur_id, userId]
    );

    res.json({
      messages: result.rows.reverse(), // Du plus ancien au plus récent
      total: result.rows.length
    });

  } catch (err) {
    console.error('Erreur messages:', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// ================================================
// COMPTER LES MESSAGES NON LUS
// ================================================
const getNonLus = async (req, res) => {
  try {
    var result = await db.query(
      'SELECT COUNT(*) as total FROM messages WHERE destinataire_id = $1 AND lu = FALSE',
      [req.user.id]
    );
    res.json({ non_lus: parseInt(result.rows[0].total) });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

module.exports = {
  envoyerMessage,
  getConversations,
  getMessages,
  getNonLus,
  uploadMessage
};