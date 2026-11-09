# Documents Werdhe : fonctionnement, exploitation, extension

Ce document décrit le système de documents (bail, quittance, état des lieux, préavis, etc.) tel qu'il est en production depuis la refonte en cinq étapes (migrations 014 à 018).

## 1. Principes

- **Une feuille A4 par document** (le bail est une feuille recto-verso). Les textes saisis sont bornés pour que la page ne déborde jamais (voir §8).
- **Un document généré est verrouillé** : plus de modification, plus de suppression. On peut le télécharger, l'envoyer par e-mail ou l'**annuler** (il reste visible, marqué « annulé »). Se tromper = annuler puis recréer.
- **Un document qui engage deux personnes se signe avant d'exister** : le rédacteur prépare et signe, l'autre partie relit et signe, puis le document est généré. Toute correction efface les signatures.
- **Chaque document est vérifiable** : numéro, empreinte SHA-256 et QR code renvoient vers `/verifier/<numéro>` (page publique, sans donnée personnelle).
- **Les valeurs saisies par les utilisateurs sont toujours échappées** dans les modèles HTML.

## 2. Catalogue

| Document | Type (`documents.type`) | Préfixe | Qui | Signatures | Module |
|---|---|---|---|---|---|
| Facture acquittée | `facture` | FAC | automatique à chaque paiement | aucune | paiements |
| Quittance de loyer | `quittance` | QUI | automatique (paiement), mensuelle (plan Pro/Agence), ou manuelle | aucune (établie par Werdhe) | documents |
| Contrat de bail | `contrat_bail` | BAIL | bailleur, depuis la candidature | bailleur + locataire | **acte `bail`** |
| État des lieux (entrée / sortie) | `etat_lieux` | EDL | bailleur ou locataire | bailleur + locataire | **état des lieux** |
| Préavis (locataire) / congé (bailleur) | `preavis` | PRE | locataire ou bailleur | auteur ; accusé de réception de l'autre | **préavis** |
| Mise en demeure | `mise_en_demeure` | MED | bailleur (manuelle) | établie par le bailleur | documents |
| Attestation de dépôt de garantie | `caution` | CAU | bailleur | cadres à signer à la main | documents |
| Rapport financier | `rapport_financier` | RAP | bailleur (à la demande, ou mensuel plan Agence) | aucune | documents |
| Avenant de renouvellement | `avenant` | AVE | bailleur, depuis un renouvellement accepté | bailleur + locataire | **acte `avenant`** |
| Décompte de restitution de caution | `decompte` | RES | bailleur, depuis l'état des lieux de sortie | bailleur + locataire | **acte `decompte`** |
| Acte de cautionnement | `cautionnement` | CTN | bailleur | bailleur + locataire + garant (sans compte) | **acte `cautionnement`** |

Numérotation : `PRÉFIXE-ANNÉE-NNNNNN` via la séquence `documents_numero_seq` (démarre à 100000). Les documents antérieurs à la refonte ont un numéro à 5 chiffres, ou aucun.

## 3. Cycle de vie

```
brouillon ──(rédacteur signe et envoie)──▶ a_valider ──(les autres signent)──▶ signe ──(génération)──▶ genere (verrouillé)
    ▲                                          │
    └──── correction demandée / envoi retiré ──┘   (signatures effacées)
```

- Les modules « état des lieux » et « actes » suivent exactement ce schéma (colonne `statut`).
- Le **bail** est particulier : la dernière signature active la location (réservation `confirmee`, logement `loue`, score, badge) puis **génère le bail automatiquement**.
- Le **préavis** n'a pas de brouillon : l'aperçu (`/preavis/apercu`) précède l'envoi, qui signe et verrouille. L'accusé de réception est un événement daté (jamais une modification du document).
- Les documents simples (facture, quittance…) passent directement à `genere`.

## 4. Base de données

| Objet | Rôle | Migration |
|---|---|---|
| `documents` (+ colonnes `numero`, `donnees`, `hash_sha256`, `verrouille_at`, `annule_*`) | le document final (HTML) | 014 |
| trigger `trg_documents_verrou` | refuse toute modification du contenu et toute suppression d'un document verrouillé ; seule transition de statut : `annule` | 014 |
| `document_evenements` | journal en ajout seul (généré, téléchargé, e-mail, annulé, accusé, rappel, signature) | 014, 015, 017 |
| `preavis` (+ `document_id`, `accuse_at`, `accuse_par`, `rappel_envoye_at`) | un préavis actif max par location (index unique partiel) | 015 |
| `etats_des_lieux` (grille, relevés, signatures, version…) + trigger `trg_edl_fige` | parcours de l'état des lieux | 016 |
| `actes` + trigger `trg_actes_fige` | avenant, décompte, cautionnement, bail | 017, 018 |
| `renouvellements_bail.date_fin_avant / loyer_avant` | valeurs « avant » figées à l'acceptation (avenant) | 017 |
| `users.identite` (jsonb) | identité (naissance, pièce, adresse, profession, téléphone) préremplie aux baux suivants | 018 |

Les migrations sont dans `backend/migrations/` et **s'appliquent à la main sur Supabase avant le déploiement du code correspondant** (chacune est transactionnelle et documente son rollback). Toutes les tables sensibles ont RLS activé et l'accès `anon`/`authenticated` révoqué : seul le backend y accède.

## 5. Code

**Backend** (`backend/src/`)

| Fichier | Contenu |
|---|---|
| `services/documentTemplates.js` | tous les modèles A4 + utilitaires (`esc`, `cl`, `gnf`, `enLettres`, dates) |
| `services/documentService.js` | `genererDocument` (numéro, QR, empreinte, insertion verrouillée, e-mail), `apercuDocument`, `genererPdfDepuisHtml` (Chromium), journal |
| `controllers/documentController.js`, `routes/documents.js` | liste, téléchargement, annulation, e-mail, vérification publique, génération des documents simples |
| `routes/preavis.js`, `config/preavis.js` | préavis, aperçu, accusé de réception, délais |
| `services/etatDesLieuxService.js`, `routes/etatsDesLieux.js` | logique pure et routes de l'état des lieux ; `validerSignature` est partagée avec les actes |
| `services/acteService.js`, `routes/actes.js` | moteur des actes à signer (types, validation, empreinte canonique, jeton du garant) |
| `services/bailService.js` | `activerLocation` (effets de la dernière signature du bail) |
| `services/cronService.js` | CRON 11 : rappel d'accusé de réception à 48 h |

**Frontend** (`frontend/src/`)

| Fichier | Contenu |
|---|---|
| `pages/Dashboard.js` | onglet Documents (cartes, historique, annulation), onglet Préavis, fiche candidature (bail) |
| `components/EtatDesLieux.js` | parcours de l'état des lieux ; exporte `SignatureForm` (dessin ou nom tapé) |
| `components/ActesSignature.js` | panneau générique des actes (bail, avenant, décompte, cautionnement) |
| `pages/ReservationLocataire.js` | le locataire signe le bail depuis sa page de réservation |
| `pages/VerifierDocument.js` | `/verifier/:numero` (public) |
| `pages/SignerActe.js` | `/signer/:jeton` (public, garant sans compte) |

Textes : `i18n/locales/{fr,en}/dashboard.json` (blocs `edl`, `actes`, `ongletDocuments`, `ongletPreavisDash`) et `public.json` (`verifierDocument`, `signerActe`).

## 6. API

**Documents** (`/documents`) : `GET /` · `POST /generer` (facture, quittance, mise en demeure, rapport, caution ; le locataire : quittance) · `GET /:id/telecharger?format=pdf` · `GET /bail/:reservation_id/telecharger` · `POST /:id/renvoyer-email` · `POST /:id/annuler` · `POST /upload-manuel` · **public** `GET /verifier/:numero`.

**Préavis** (`/preavis`) : `POST /apercu` (aucune écriture) · `POST /` · `GET /` · `GET /recus` · `GET /delai-minimum` · `PATCH /:id/repondre` (accusé de réception ou demande de renouvellement).

**États des lieux** (`/etats-des-lieux`) : `GET /reservation/:rid` · `GET /:id` · `POST /` · `PUT /:id` (version vérifiée) · `POST|DELETE /:id/photos` · `POST /:id/envoyer | retirer | corriger | signer | generer | annuler`.

**Actes** (`/actes`) : `GET /reservation/:rid` (liste + ce qu'on peut créer) · `GET /identite` · `GET /:id` · `GET /:id/apercu` · `POST /` · `PUT /:id` · `POST /:id/envoyer | retirer | corriger | signer | generer | annuler | garant/renvoyer` · **public** `GET /public/:jeton` et `POST /public/:jeton/signer` (limités à 40 requêtes / 15 min / IP).

Droits : chaque réponse d'un état des lieux ou d'un acte contient un objet `droits` (`modifier`, `envoyer`, `signer`, `corriger`, `generer`, `annuler`, `telecharger`…) calculé côté serveur ; l'interface s'y conforme, le serveur revérifie à chaque appel.

## 7. Signatures et preuve

- **Signature simple** : dessinée (PNG, 150 000 caractères max) ou nom tapé, avec « lu et approuvé », date et heure, adresse IP et **empreinte SHA-256 du contenu signé**. Chaque signature est posée par la personne connectée, depuis son compte.
- **Empreinte du contenu** : sérialisation canonique (clés triées) du contenu, du numéro de version et du rôle. Modifier le contenu change l'empreinte ; à la génération, chaque signature est recontrôlée (`409` si le contenu a changé).
- **Garant (cautionnement)** : lien `/signer/<jeton>` valable 14 jours, à usage unique. Seul le **hash** du jeton est stocké ; un nouveau lien invalide l'ancien ; une correction ou un abandon l'invalide. Le garant renseigne son identité (majorité vérifiée) et recopie la mention « Bon pour caution… » (comparaison tolérante à la casse et à la ponctuation).
- **Document final** : l'empreinte du HTML est imprimée dans le pied de page ; `/verifier/<numéro>` recalcule et indique « authentique », « altéré » ou « annulé ».
- La valeur juridique d'une signature électronique simple en Guinée **n'a pas été validée par un juriste** (voir §11).

## 8. Contraintes de page (A4)

Les bornes de saisie sont celles testées au pire cas avec Chromium (PDF = 1 page, ou 2 pour le bail) :

| Contenu | Borne |
|---|---|
| État des lieux | 20 lignes · observation 40 car. · observations générales 160 · réserves 160 · pièce 18 / élément 22 (lignes ajoutées) · 12 photos |
| Préavis | motif 200 · message 300 |
| Avenant | clause libre 200 |
| Décompte | 8 retenues · libellé 40 · commentaire 60 · note 120 |
| Bail | clause libre 200 · charges ≤ 1 milliard · jour de paiement 1 à 28 |
| Cautionnement | montant ≤ 100 milliards · durée 1 à 60 mois |

Si vous **modifiez un modèle ou une borne**, retestez : rendre chaque modèle avec les données les plus longues possibles, imprimer en PDF (`page.pdf({ format: 'A4', preferCSSPageSize: true })`), vérifier `scrollHeight <= clientHeight` de `.page` et compter les pages (`/Type /Page`).

## 9. Configuration

| Variable | Rôle | Défaut |
|---|---|---|
| `PREAVIS_DELAI_LOCATAIRE_JOURS` | délai minimum d'un préavis du locataire | 30 |
| `PREAVIS_DELAI_PROPRIETAIRE_JOURS` | délai minimum d'un congé du bailleur | 30 |
| `FRONTEND_URL` | base des liens envoyés au garant | `https://www.werdhe.com` |
| `RESEND_API_KEY`, `EMAIL_FROM` | envoi des documents et des liens | requis |
| `CLOUDINARY_*` | photos des états des lieux | requis |

Un e-mail en échec ne bloque jamais une action : le document est créé, l'échec est consigné et jamais marqué « envoyé » à tort. Pour le garant, le bailleur peut copier le lien et l'envoyer lui-même (WhatsApp, SMS).

## 10. Exploitation

- **Retrouver un document** : `select * from documents where numero = 'BAIL-2026-100000'` ; son journal : `document_evenements`.
- **Annuler** : depuis l'onglet Documents (motif obligatoire). Refusé pour un bail signé par les deux parties, et pour un préavis dont l'autre partie a accusé réception.
- **Un document est faux ou à refaire** : l'annuler puis en recréer un ; ne jamais désactiver les triggers `trg_documents_verrou`, `trg_edl_fige`, `trg_actes_fige` en production.
- **Lien du garant perdu ou expiré** : « Envoyer un nouveau lien au garant » dans l'acte.
- **Bail bloqué** : si la génération automatique échoue après la dernière signature, la location est déjà active et l'acte reste « signé » ; le bailleur peut relancer la génération depuis l'acte.
- **Rappel d'accusé de réception d'un préavis** : CRON 11, toutes les heures à la minute 40, une seule fois par préavis.

## 11. Points à valider et limites connues

À faire valider par un juriste guinéen avant de s'en prévaloir :
- la valeur de la signature électronique simple (nom, IP, empreinte) ;
- les **délais de préavis** (30 jours par défaut, ce n'est pas un avis juridique) ;
- les **conditions générales du bail** et les mentions de l'acte de cautionnement.

Limites techniques :
- Les **photos** des états des lieux sont consultables dans Werdhe mais **non imprimées** dans le PDF (le document en indique le nombre).
- Pas de signature à deux sur un seul téléphone : chacun signe depuis son compte (le garant, depuis son lien).
- Les **3 locations antérieures** à la refonte gardent un bail généré à la demande, sans conditions particulières ; seuls les nouveaux baux passent par l'acte.
- Les tests de la refonte (API sur base PostgreSQL jetable, rendu des pages en PDF, parcours navigateur) ont été exécutés pendant le développement mais **ne sont pas versionnés** dans le dépôt.

## 12. Ajouter un document ou un acte

1. **Modèle** : écrire la fonction dans `documentTemplates.js` (utiliser `entete`, `pied`, `boitesParties`, `boiteSignature`, tout échapper avec `esc`/`cl`), l'enregistrer dans `MODELES`.
2. **Type** : ajouter le type à la contrainte `documents_type_check` (nouvelle migration) et un préfixe dans `PREFIXES` et un titre dans `titreDocument` (`documentService.js`).
3. **Acte à signer** : déclarer le type dans `TYPES` (`acteService.js`) avec ses `signataires`, ses données initiales, sa validation dans `normaliserDonnees` et `erreurAvantEnvoi` ; l'ajouter à la contrainte `actes_type_check` ; décrire sa création dans `POST /actes` et ses statuts de location autorisés dans `STATUTS_RESA` (`routes/actes.js`).
4. **Interface** : ajouter la carte dans `DOCS_TYPES` (`Dashboard.js`), le formulaire dans `ActesSignature.js`, les textes `fr`/`en`.
5. **Tests** : pire cas de longueur → 1 page ; parcours complet (droits, bornes, altération, génération).
