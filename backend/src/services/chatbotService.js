const { GoogleGenAI, createUserContent, createModelContent } = require('@google/genai');
const db = require('../database');

var MODEL = 'gemini-flash-latest';
var MAX_TOURS_OUTIL = 2; // évite une boucle d'appels d'outil infinie

var SYSTEM_PROMPT = `Tu es l'assistant de Werdhe, une plateforme de location immobilière en Guinée (Conakry et les principales villes du pays).

Ce que tu dois savoir sur Werdhe :
- C'est gratuit, pour toujours, pour les locataires : aucun frais d'agence, aucune commission.
- Les propriétaires ont 3 formules : Gratuit (plan de base), Pro à 120 000 GNF/mois (jusqu'à 20 logements, paiement Orange Money + MTN MoMo, baux et quittances PDF automatiques, alertes de loyer), Agence à 300 000 GNF/mois (logements illimités, multi-utilisateurs). Les plans payants ont 1 mois d'essai gratuit, sans Mobile Money requis.
- Modes de paiement acceptés : Orange Money, MTN MoMo, espèces, virement bancaire (BICIGUI, Ecobank).
- Sécurité : HTTPS, mots de passe hachés, 2FA pour les admins, aucune donnée bancaire stockée.
- Un locataire peut : chercher un logement, candidater, échanger par messagerie avec le propriétaire, signer son bail électroniquement, payer en ligne.
- Un propriétaire peut : publier un logement (photos, prix, équipements, statut foncier), gérer ses candidatures, générer quittances et rapports.

Si l'utilisateur envoie une photo (par exemple d'un logement), décris ce que tu vois et réponds à sa question à propos de cette image — type de bien, état apparent, équipements visibles. Ne donne jamais d'estimation de prix ferme à partir d'une photo seule, oriente plutôt vers l'outil d'estimation de Werdhe si on te demande un prix.

Ta mission :
- Répondre aux questions sur le fonctionnement de Werdhe en te basant uniquement sur ce que tu sais ci-dessus — n'invente jamais une fonctionnalité qui n'existe pas.
- Quand on te demande de trouver un logement (ville, type de bien, budget, nombre de chambres...), utilise l'outil rechercher_logements pour interroger la vraie base de données. Ne propose JAMAIS un logement que tu n'as pas obtenu via cet outil — ne jamais inventer d'annonce, de prix ou d'adresse.
- Si la recherche ne renvoie rien, dis-le simplement et propose d'élargir les critères (budget, ville).
- Sois bref, chaleureux et concret. Réponds en 2-4 phrases maximum sauf si on te demande plus de détails.
- Si une question sort du cadre de Werdhe (hors-sujet), recentre poliment la conversation.`;

var OUTIL_RECHERCHE = {
  name: 'rechercher_logements',
  description: 'Cherche des logements disponibles dans la vraie base de données Werdhe, selon des critères optionnels.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      ville:       { type: 'string', description: 'Ville ou quartier recherché (ex: Conakry, Kipé, Kindia)' },
      categorie:   { type: 'string', description: 'Mot-clé du type de bien recherché, en un seul mot simple (ex: villa, studio, appartement, bureau, chambre, maison, duplex, boutique) — une recherche partielle est faite côté serveur' },
      prix_max:    { type: 'number', description: 'Budget maximum en GNF par mois' },
      nb_chambres: { type: 'number', description: 'Nombre minimum de chambres' }
    }
  }
};

async function rechercherLogements(criteres) {
  var conditions = ['l.statut = $1', 'l.masque IS NOT TRUE'];
  var params = ['disponible'];
  var idx = 2;

  if (criteres.ville) {
    conditions.push(`LOWER(l.ville) LIKE LOWER($${idx})`);
    params.push('%' + criteres.ville + '%'); idx++;
  }
  if (criteres.categorie) {
    // Les catégories réelles sont granulaires (villa_luxe, villa_standard,
    // studio_moderne, chambre_habitant...) — une recherche partielle permet
    // à "villa" ou "studio" de matcher la bonne famille sans que le modèle
    // ait à connaître la taxonomie exacte.
    conditions.push(`LOWER(l.categorie) LIKE LOWER($${idx})`);
    params.push('%' + criteres.categorie + '%'); idx++;
  }
  if (criteres.prix_max) {
    conditions.push(`l.prix_mensuel <= $${idx}`);
    params.push(Number(criteres.prix_max)); idx++;
  }
  if (criteres.nb_chambres) {
    conditions.push(`l.nb_chambres >= $${idx}`);
    params.push(Number(criteres.nb_chambres)); idx++;
  }

  var result = await db.query(
    `SELECT l.id, l.titre, l.ville, l.quartier, l.categorie, l.prix_mensuel,
            l.nb_chambres, l.superficie, l.photos
     FROM logements l
     WHERE ${conditions.join(' AND ')}
     ORDER BY l.created_at DESC
     LIMIT 4`,
    params
  );
  return result.rows;
}

function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function attendre(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// Le modèle gratuit renvoie parfois un 503 "high demand, try again later" —
// transitoire la plupart du temps, donc on retente une fois avant d'abandonner.
async function genererAvecRetry(client, params) {
  try {
    return await client.models.generateContent(params);
  } catch (err) {
    if (err && err.status === 503) {
      await attendre(900);
      return await client.models.generateContent(params);
    }
    throw err;
  }
}

// messages : [{ role: 'user'|'assistant', content: string }, ...]
// image (optionnel) : { buffer: Buffer, mimeType: string } — rattachée au
// dernier message (forcément un message 'user', celui qu'on vient de recevoir)
async function repondre(messages, locale, image) {
  var client = getClient();
  if (!client) {
    return {
      reply: locale === 'en'
        ? 'The assistant is not configured yet. Please try again later.'
        : 'L\'assistant n\'est pas encore configuré. Réessayez plus tard.',
      logements: null
    };
  }

  var system = SYSTEM_PROMPT + (locale === 'en' ? '\n\nRespond in English.' : '\n\nRéponds en français.');
  var contents = messages.map(function(m, i) {
    if (m.role === 'assistant') return createModelContent(m.content);
    var estDernier = i === messages.length - 1;
    if (estDernier && image) {
      return {
        role: 'user',
        parts: [
          { text: m.content },
          { inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') } }
        ]
      };
    }
    return createUserContent(m.content);
  });

  var dernierResultat = null;
  var messageIndisponible = locale === 'en'
    ? 'The assistant is momentarily overloaded. Please try again in a moment.'
    : 'L\'assistant est momentanément surchargé. Réessayez dans un instant.';

  try {
    for (var tour = 0; tour <= MAX_TOURS_OUTIL; tour++) {
      var response = await genererAvecRetry(client, {
        model: MODEL,
        contents: contents,
        config: {
          systemInstruction: system,
          tools: [{ functionDeclarations: [OUTIL_RECHERCHE] }]
        }
      });

      var appels = response.functionCalls;

      if (!appels || appels.length === 0) {
        var texte = (response.text || '').trim();
        return { reply: texte || messageIndisponible, logements: dernierResultat };
      }

      var appel = appels[0];
      var resultats = await rechercherLogements(appel.args || {});
      dernierResultat = resultats;

      var contenuModele = response.candidates && response.candidates[0] && response.candidates[0].content;
      if (contenuModele) contents.push(contenuModele);
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: appel.name, response: { result: resultats } } }]
      });
    }
  } catch (err) {
    console.error('[chatbotService.repondre]', err.message);
    return { reply: messageIndisponible, logements: null };
  }

  return {
    reply: locale === 'en' ? 'Sorry, I could not find an answer right now.' : 'Désolé, je n\'ai pas pu trouver de réponse pour le moment.',
    logements: dernierResultat
  };
}

module.exports = { repondre };
