const express = require('express');
const router  = express.Router();
const db      = require('../database');
const verifierToken = require('../middleware/auth');

function verifierAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ erreur: 'Accès réservé à l\'administrateur Werdhe' });
}

function slugifier(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function genererSlugUnique(titre, idExclu) {
  var base = slugifier(titre) || 'article';
  var slug = base;
  var i = 2;
  while (true) {
    var query = idExclu
      ? 'SELECT id FROM articles_blog WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM articles_blog WHERE slug = $1';
    var params = idExclu ? [slug, idExclu] : [slug];
    var existant = await db.query(query, params);
    if (existant.rows.length === 0) return slug;
    slug = base + '-' + i;
    i++;
  }
}

// ─── LISTE PUBLIQUE (articles publiés) ───────────────────────────
router.get('/', async (req, res) => {
  try {
    var { categorie, page, recherche } = req.query;
    var pageNum = Math.max(parseInt(page) || 1, 1);
    var parPage = 9;
    var offset  = (pageNum - 1) * parPage;

    var conditions = ['publie = TRUE'];
    var params = [];
    var idx = 1;

    if (categorie) {
      conditions.push('categorie = $' + idx);
      params.push(categorie); idx++;
    }
    if (recherche) {
      conditions.push('(LOWER(titre) LIKE LOWER($' + idx + ') OR LOWER(extrait) LIKE LOWER($' + idx + '))');
      params.push('%' + recherche + '%'); idx++;
    }

    var whereClause = conditions.join(' AND ');

    var result = await db.query(
      `SELECT id, titre, slug, extrait, image_couverture, categorie, auteur_nom, vues, published_at
       FROM articles_blog
       WHERE ${whereClause}
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parPage, offset]
    );

    var total = await db.query(
      `SELECT COUNT(*) FROM articles_blog WHERE ${whereClause}`,
      params
    );

    res.json({
      articles: result.rows,
      total:    parseInt(total.rows[0].count),
      page:     pageNum,
      par_page: parPage,
    });
  } catch (err) {
    console.error('[GET /blog]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── CATÉGORIES DISPONIBLES ───────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    var result = await db.query(
      `SELECT categorie, COUNT(*) as nb
       FROM articles_blog
       WHERE publie = TRUE AND categorie IS NOT NULL
       GROUP BY categorie
       ORDER BY nb DESC`
    );
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── GESTION ADMIN : liste complète (publiés + brouillons) ──────
router.get('/admin/tous', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var result = await db.query(
      `SELECT * FROM articles_blog ORDER BY created_at DESC`
    );
    res.json({ articles: result.rows });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── DÉTAIL D'UN ARTICLE (public, par slug) ──────────────────────
router.get('/:slug', async (req, res) => {
  try {
    var result = await db.query(
      `SELECT * FROM articles_blog WHERE slug = $1 AND publie = TRUE`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Article non trouvé' });
    }

    db.query('UPDATE articles_blog SET vues = vues + 1 WHERE id = $1', [result.rows[0].id])
      .catch(console.warn);

    // Articles similaires (même catégorie)
    var similaires = await db.query(
      `SELECT id, titre, slug, extrait, image_couverture
       FROM articles_blog
       WHERE publie = TRUE AND categorie = $1 AND id != $2
       ORDER BY published_at DESC NULLS LAST
       LIMIT 3`,
      [result.rows[0].categorie, result.rows[0].id]
    );

    res.json({ article: result.rows[0], similaires: similaires.rows });
  } catch (err) {
    console.error('[GET /blog/:slug]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── CRÉER UN ARTICLE (admin) ─────────────────────────────────────
router.post('/', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { titre, extrait, contenu, image_couverture, categorie, meta_description, publie } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ erreur: 'Titre et contenu requis' });
    }

    var slug = await genererSlugUnique(titre);
    var estPublie = publie === true;

    var result = await db.query(
      `INSERT INTO articles_blog
        (titre, slug, extrait, contenu, image_couverture, categorie, meta_description,
         auteur_nom, publie, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        titre, slug, extrait || null, contenu, image_couverture || null,
        categorie || null, meta_description || null,
        (req.user.prenom || '') + ' ' + (req.user.nom || '') || 'Werdhe',
        estPublie, estPublie ? new Date() : null
      ]
    );

    res.status(201).json({ message: 'Article créé', article: result.rows[0] });
  } catch (err) {
    console.error('[POST /blog]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── MODIFIER UN ARTICLE (admin) ──────────────────────────────────
router.put('/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    var { titre, extrait, contenu, image_couverture, categorie, meta_description, publie } = req.body;

    var actuel = await db.query('SELECT * FROM articles_blog WHERE id = $1', [req.params.id]);
    if (actuel.rows.length === 0) return res.status(404).json({ erreur: 'Article non trouvé' });

    var slug = actuel.rows[0].slug;
    if (titre && titre !== actuel.rows[0].titre) {
      slug = await genererSlugUnique(titre, req.params.id);
    }

    var devientPublie = publie === true && !actuel.rows[0].publie;

    var result = await db.query(
      `UPDATE articles_blog SET
         titre = $1, slug = $2, extrait = $3, contenu = $4, image_couverture = $5,
         categorie = $6, meta_description = $7, publie = $8, updated_at = NOW(),
         published_at = CASE WHEN $9 THEN NOW() ELSE published_at END
       WHERE id = $10
       RETURNING *`,
      [
        titre || actuel.rows[0].titre, slug,
        extrait !== undefined ? extrait : actuel.rows[0].extrait,
        contenu || actuel.rows[0].contenu,
        image_couverture !== undefined ? image_couverture : actuel.rows[0].image_couverture,
        categorie !== undefined ? categorie : actuel.rows[0].categorie,
        meta_description !== undefined ? meta_description : actuel.rows[0].meta_description,
        publie !== undefined ? publie : actuel.rows[0].publie,
        devientPublie,
        req.params.id
      ]
    );

    res.json({ message: 'Article mis à jour', article: result.rows[0] });
  } catch (err) {
    console.error('[PUT /blog/:id]', err.message);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ─── SUPPRIMER UN ARTICLE (admin) ─────────────────────────────────
router.delete('/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM articles_blog WHERE id = $1', [req.params.id]);
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;
