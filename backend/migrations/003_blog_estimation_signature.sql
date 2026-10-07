-- Migration : blog SEO, estimation de loyer, signature électronique du bail
--
-- À exécuter manuellement sur la base Supabase (SQL editor) AVANT de déployer
-- le code qui utilise ces tables (backend/src/routes/blog.js,
-- backend/src/routes/estimation.js, l'enrichissement de
-- backend/src/routes/reservations.js pour la signature).
-- Idempotent : sans danger à ré-exécuter.

-- ════════════════════════════════════════════════════════
-- BLOG
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS articles_blog (
  id                SERIAL PRIMARY KEY,
  titre             VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) UNIQUE NOT NULL,
  extrait           TEXT,
  contenu           TEXT NOT NULL,
  image_couverture  TEXT,
  categorie         VARCHAR(100),
  meta_description  VARCHAR(300),
  auteur_nom        VARCHAR(150),
  publie            BOOLEAN DEFAULT FALSE,
  vues              INT DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  published_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_blog_slug ON articles_blog(slug);
CREATE INDEX IF NOT EXISTS idx_articles_blog_publie ON articles_blog(publie, published_at DESC);

-- ════════════════════════════════════════════════════════
-- SIGNATURE ÉLECTRONIQUE DU BAIL
-- ════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS signatures_bail (
  id              SERIAL PRIMARY KEY,
  reservation_id  UUID NOT NULL,
  signataire_id   UUID NOT NULL,
  role            VARCHAR(20) NOT NULL,
  nom_complet     VARCHAR(255) NOT NULL,
  ip_adresse      VARCHAR(64),
  user_agent      TEXT,
  hash_signature  VARCHAR(128),
  signe_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signatures_bail_reservation ON signatures_bail(reservation_id);

-- ════════════════════════════════════════════════════════
-- SEED — 4 articles de blog (contenu réel, prêt à publier)
-- ════════════════════════════════════════════════════════

INSERT INTO articles_blog (titre, slug, extrait, contenu, categorie, meta_description, auteur_nom, publie, published_at)
VALUES (
  'Guide complet pour louer un appartement à Conakry en 2026',
  'guide-louer-appartement-conakry-2026',
  'Tout ce qu''il faut savoir avant de louer à Conakry : budget, quartiers, visites, pièges à éviter et démarches pour signer en toute confiance.',
  $$<h2>Combien prévoir de budget ?</h2>
<p>À Conakry, les loyers varient énormément selon la commune et l'état du logement. Comptez en moyenne entre 800 000 et 2 000 000 GNF/mois pour un appartement correct à Ratoma ou Matam, et au-delà de 3 000 000 GNF pour une villa haut de gamme à Kaloum ou Dixinn. Les studios et petites chambres dans les quartiers périphériques (Matoto, Sonfonia) démarrent souvent sous 500 000 GNF.</p>
<p>Au-delà du loyer mensuel, prévoyez généralement une caution (1 à 3 mois de loyer) et parfois une avance de plusieurs mois exigée par le propriétaire. Demandez toujours une quittance pour chaque paiement.</p>

<h2>Choisir son quartier</h2>
<p>Chaque commune de Conakry a son caractère : Kaloum concentre les administrations et certains bureaux, Dixinn est plus résidentiel et proche de l'université, Ratoma est la commune la plus vaste et la plus prisée pour les familles, Matam mêle commerces et habitations, tandis que Matoto s'étend vers la périphérie avec des prix plus accessibles. Pensez à la proximité du travail, des écoles et aux temps de trajet, souvent allongés aux heures de pointe.</p>

<h2>Avant de visiter</h2>
<ul>
<li>Vérifiez les photos et la localisation exacte sur une carte.</li>
<li>Privilégiez les annonces avec plusieurs photos récentes et un prix clairement affiché.</li>
<li>Méfiez-vous des prix anormalement bas par rapport au quartier : c'est souvent le signe d'une arnaque.</li>
</ul>

<h2>Pendant la visite</h2>
<p>Vérifiez l'arrivée d'eau et d'électricité (la stabilité du courant varie selon les quartiers), l'état de la plomberie, la présence de moustiquaires, et demandez si un groupe électrogène ou un forage est disponible en cas de coupure. N'hésitez pas à discuter avec les voisins du quartier.</p>

<h2>Signer le bail en toute sécurité</h2>
<p>Passer par une plateforme comme Werdhe permet de centraliser les échanges, de signer le bail électroniquement avec une preuve horodatée, et de garder une trace de tous les paiements — un vrai filet de sécurité par rapport à un accord oral ou un simple reçu manuscrit.</p>$$,
  'Guide locataire',
  'Budget, quartiers de Conakry, pièges à éviter : le guide complet pour louer un appartement en Guinée en 2026.',
  'Équipe Werdhe',
  TRUE,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles_blog (titre, slug, extrait, contenu, categorie, meta_description, auteur_nom, publie, published_at)
VALUES (
  'Prix moyen des loyers par quartier à Conakry : où louer selon son budget',
  'prix-loyers-par-quartier-conakry',
  'Un aperçu des fourchettes de loyers observées dans les principales communes de Conakry pour mieux orienter votre recherche.',
  $$<p>Les prix ci-dessous sont des fourchettes indicatives observées sur le marché guinéen de la location, à titre de repère pour un appartement ou une maison meublée standard. Ils varient selon l'état du bien, l'étage, la sécurité du quartier et la proximité des axes principaux.</p>

<h2>Kaloum</h2>
<p>Le centre administratif et des affaires. Peu de logements résidentiels disponibles, loyers élevés : comptez généralement entre 1 500 000 et 4 000 000 GNF/mois pour un appartement de standing.</p>

<h2>Dixinn</h2>
<p>Quartier résidentiel calme, proche de l'université et de plusieurs ambassades. Entre 1 000 000 et 2 500 000 GNF/mois selon la taille et l'état du bien.</p>

<h2>Ratoma</h2>
<p>La commune la plus étendue et la plus demandée, du fait de son mélange de quartiers populaires et de zones résidentielles modernes (Kipé, Nongo, Lambanyi, Taouyah). Large éventail de 600 000 à 3 000 000 GNF/mois.</p>

<h2>Matam</h2>
<p>Quartier central et commerçant, bien desservi. Comptez entre 700 000 et 2 000 000 GNF/mois.</p>

<h2>Matoto</h2>
<p>Zone plus périphérique, en forte croissance, avec des prix parmi les plus accessibles de la capitale : 400 000 à 1 200 000 GNF/mois.</p>

<h2>En dehors de Conakry</h2>
<p>Dans les grandes villes de l'intérieur (Kindia, Labé, Kankan, Boké, N'Zérékoré), les loyers sont généralement inférieurs de 30 à 50% à ceux de Conakry pour un bien comparable.</p>

<h2>Comment affiner votre estimation</h2>
<p>Ces chiffres restent des moyennes générales. Pour une estimation plus précise basée sur les logements réellement publiés sur la plateforme (quartier, superficie, nombre de chambres), utilisez l'<a href="/estimation">outil d'estimation de loyer Werdhe</a>, gratuit et sans engagement.</p>$$,
  'Marché immobilier',
  'Fourchettes de loyers à Kaloum, Dixinn, Ratoma, Matam et Matoto : repères pour bien budgétiser votre location à Conakry.',
  'Équipe Werdhe',
  TRUE,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles_blog (titre, slug, extrait, contenu, categorie, meta_description, auteur_nom, publie, published_at)
VALUES (
  'Quels documents fournir pour signer un bail en Guinée ?',
  'documents-signer-bail-guinee',
  'La liste des pièces généralement demandées par les propriétaires guinéens pour constituer un dossier de location solide.',
  $$<p>Un dossier complet dès la première visite accélère considérablement la décision du propriétaire. Voici les pièces les plus couramment demandées en Guinée.</p>

<h2>Pièces d'identité</h2>
<ul>
<li>Carte nationale d'identité ou passeport en cours de validité</li>
<li>Pour les étrangers : titre de séjour ou carte consulaire</li>
</ul>

<h2>Justificatifs de revenus</h2>
<ul>
<li>Attestation ou bulletins de salaire des 3 derniers mois pour les salariés</li>
<li>Attestation de travail de l'employeur</li>
<li>Pour les indépendants : registre de commerce ou tout justificatif d'activité</li>
</ul>

<h2>Garanties</h2>
<ul>
<li>Un garant (souvent exigé pour les étudiants ou les nouveaux arrivants), avec ses propres justificatifs d'identité et de revenus</li>
<li>Caution en espèces ou par Mobile Money, généralement équivalente à 1 à 3 mois de loyer</li>
</ul>

<h2>Documents spécifiques à certains profils</h2>
<p>Les étudiants fournissent en général une attestation d'inscription ou une carte d'étudiant en cours de validité. Les expatriés peuvent se voir demander un contrat de travail ou une lettre de mission.</p>

<h2>Et côté propriétaire ?</h2>
<p>Un propriétaire sérieux doit pouvoir présenter un titre de propriété ou tout document attestant de son droit à louer le bien. Sur Werdhe, chaque propriétaire peut faire vérifier son identité pour obtenir le badge "Propriétaire vérifié", un gage de confiance supplémentaire pour les candidats.</p>

<h2>Simplifier le dossier avec Werdhe</h2>
<p>Plutôt que d'envoyer des documents par email ou WhatsApp, la plateforme permet de déposer son dossier une seule fois et de candidater directement en ligne — le propriétaire reçoit tout en un clic, et la signature du bail se fait ensuite électroniquement, avec horodatage et preuve d'acceptation des deux parties.</p>$$,
  'Guide locataire',
  'La liste des documents à préparer (identité, revenus, garant, caution) pour constituer un dossier de location en Guinée.',
  'Équipe Werdhe',
  TRUE,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles_blog (titre, slug, extrait, contenu, categorie, meta_description, auteur_nom, publie, published_at)
VALUES (
  'Propriétaire : pourquoi passer par une plateforme en ligne plutôt qu''un agent traditionnel',
  'proprietaire-plateforme-vs-agent-traditionnel',
  'Commissions, délais, suivi des paiements : comparatif entre la gestion locative traditionnelle et une plateforme comme Werdhe.',
  $$<h2>Le modèle traditionnel</h2>
<p>En Guinée, beaucoup de propriétaires passent encore par un agent ou un intermédiaire de quartier pour trouver un locataire. Cela fonctionne, mais avec plusieurs limites : commission parfois élevée et peu transparente, visibilité du bien limitée au réseau de l'agent, suivi des loyers manuel (carnet, appels téléphoniques), et absence de preuve formelle en cas de litige sur le bail ou les paiements.</p>

<h2>Ce que change une plateforme en ligne</h2>
<h3>Une visibilité immédiate</h3>
<p>Un bien publié sur Werdhe est visible instantanément par tous les locataires inscrits sur la plateforme, dans toute la Guinée, sans dépendre du bouche-à-oreille d'un seul agent.</p>

<h3>Des candidatures qualifiées</h3>
<p>Chaque candidat dépose un dossier complet en ligne (identité, revenus, garant) directement consultable par le propriétaire, qui peut comparer plusieurs profils avant de décider.</p>

<h3>Des paiements traçables</h3>
<p>Les loyers réglés par Mobile Money (Orange Money, MTN MoMo) sont enregistrés automatiquement, avec génération de quittances et alertes en cas de retard — fini les carnets de comptes tenus à la main.</p>

<h3>Un bail signé et horodaté</h3>
<p>La signature électronique du bail enregistre le nom, la date et l'heure d'acceptation de chaque partie, créant une preuve bien plus solide qu'un accord verbal ou qu'une simple signature manuscrite sans témoin.</p>

<h3>Un coût maîtrisé</h3>
<p>Plutôt qu'une commission ponctuelle souvent négociée au cas par cas, Werdhe propose un abonnement mensuel clair (gratuit le premier mois), sans surprise.</p>

<h2>Et l'agent de quartier dans tout ça ?</h2>
<p>Rien n'empêche de combiner les deux approches : certains propriétaires continuent de s'appuyer sur un agent pour les visites physiques tout en utilisant Werdhe pour la gestion administrative, les paiements et le suivi. L'objectif n'est pas de remplacer le contact humain, mais de le sécuriser.</p>$$,
  'Guide propriétaire',
  'Commissions, visibilité, paiements, preuve de signature : ce que change une plateforme en ligne pour louer son bien en Guinée.',
  'Équipe Werdhe',
  TRUE,
  NOW()
)
ON CONFLICT (slug) DO NOTHING;
