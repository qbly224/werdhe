/* eslint-disable */
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronLeft, Shield } from 'lucide-react';

var SECTIONS = [
  {
    titre: '1. Responsable du traitement',
    contenu: `Les données personnelles collectées sur Werdhe sont traitées par QbelyTech, éditeur de la plateforme Werdhe, dont le siège social est en Guinée.

Contact du responsable du traitement : contact@werdhe.com`
  },
  {
    titre: '2. Données collectées',
    contenu: `Werdhe collecte les données suivantes :

Données d'identification :
• Nom, prénom, adresse email
• Numéro de téléphone (optionnel)
• Photo de profil (Google OAuth)

Données professionnelles (propriétaires) :
• Informations sur les biens immobiliers
• Documents de location (baux, quittances)
• Historique des transactions

Données de candidature (locataires) :
• Documents d'identité (CNI)
• Justificatifs d'emploi et de revenus
• Coordonnées du garant

Données techniques :
• Adresse IP
• Données de connexion (logs)
• Cookies de session`
  },
  {
    titre: '3. Finalités du traitement',
    contenu: `Vos données sont utilisées pour :
• Créer et gérer votre compte utilisateur
• Faciliter la mise en relation entre propriétaires et locataires
• Générer les documents contractuels (baux, quittances)
• Traiter les paiements via nos prestataires
• Envoyer des notifications et alertes liées à votre location
• Améliorer nos services et l'expérience utilisateur
• Respecter nos obligations légales
• Lutter contre la fraude et les activités illicites`
  },
  {
    titre: '4. Base légale du traitement',
    contenu: `Le traitement de vos données repose sur :
• L'exécution du contrat : nécessaire pour fournir nos services
• Votre consentement : pour les communications marketing
• Notre intérêt légitime : amélioration des services, sécurité
• Obligation légale : conservation des documents comptables`
  },
  {
    titre: '5. Conservation des données',
    contenu: `Vos données sont conservées pendant les durées suivantes :
• Données de compte : durée de vie du compte + 30 jours après suppression
• Documents de location : 5 ans après la fin du bail (obligation légale)
• Logs d'accès : 90 jours
• Données de paiement : 10 ans (obligation comptable)
• Cookies : 13 mois maximum

Après ces délais, vos données sont supprimées ou anonymisées.`
  },
  {
    titre: '6. Partage des données',
    contenu: `Vos données peuvent être partagées avec :

Prestataires de services :
• Supabase (hébergement base de données) — USA
• Cloudinary (stockage de fichiers) — USA
• Resend (envoi d'emails) — USA
• Vercel (hébergement frontend) — USA
• Render (hébergement backend) — USA
• Orange Money / MTN MoMo (paiements) — Guinée

Ces prestataires sont contractuellement tenus de protéger vos données.

Werdhe ne vend jamais vos données à des tiers à des fins commerciales.

Autorités : En cas d'obligation légale ou de décision judiciaire.`
  },
  {
    titre: '7. Sécurité des données',
    contenu: `Werdhe met en œuvre les mesures de sécurité suivantes :
• Chiffrement des données en transit (HTTPS/TLS)
• Hachage des mots de passe (bcrypt)
• Authentification à deux facteurs pour les comptes admin
• Tokens JWT avec expiration
• Logs d'audit des actions sensibles
• Rate limiting pour prévenir les attaques
• Accès restreint aux données par rôle utilisateur`
  },
  {
    titre: '8. Vos droits',
    contenu: `Conformément à la réglementation applicable, vous disposez des droits suivants :

• Droit d'accès : obtenir une copie de vos données personnelles
• Droit de rectification : corriger des données inexactes
• Droit à l'effacement : supprimer vos données (sous réserve des obligations légales)
• Droit à la portabilité : recevoir vos données dans un format lisible
• Droit d'opposition : vous opposer à certains traitements
• Droit de limitation : limiter le traitement de vos données

Pour exercer ces droits, contactez-nous à : contact@werdhe.com

Nous répondrons à votre demande dans un délai de 30 jours.`
  },
  {
    titre: '9. Cookies',
    contenu: `Werdhe utilise les cookies suivants :

Cookies essentiels (non désactivables) :
• Token d'authentification (session utilisateur)
• Préférences de langue
• Mode sombre/clair

Cookies fonctionnels :
• Mémorisation des filtres de recherche
• Dernier onglet visité

Werdhe n'utilise pas de cookies publicitaires ou de tracking tiers.`
  },
  {
    titre: '10. Transferts internationaux',
    contenu: `Certains de nos prestataires (Supabase, Cloudinary, Vercel) sont établis aux États-Unis. Ces transferts sont encadrés par des clauses contractuelles types garantissant un niveau de protection adéquat de vos données.`
  },
  {
    titre: '11. Modifications de cette politique',
    contenu: `Cette politique de confidentialité peut être mise à jour. En cas de modification substantielle, vous serez informé par email ou notification sur la plateforme au moins 30 jours avant l'entrée en vigueur des changements.`
  },
  {
    titre: '12. Contact et réclamations',
    contenu: `Pour toute question sur cette politique ou pour exercer vos droits :

Email : contact@werdhe.com
Adresse : QbelyTech, Conakry, Guinée

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès des autorités compétentes en matière de protection des données en Guinée.`
  },
];

export default function Confidentialite() {
  var navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Politique de Confidentialité"
        description="Politique de confidentialité de Werdhe — Comment nous collectons et protégeons vos données personnelles."
        url="https://werdhe.com/confidentialite"
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={function() { navigate(-1); }}
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={16} strokeWidth={2} /> Retour
        </button>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Werdhe — Documents légaux</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, background: '#E3F2FD', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} strokeWidth={1.5} color="#1565C0" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1B2B22', margin: 0 }}>
              Politique de Confidentialité
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
              Dernière mise à jour : 1er août 2026
            </p>
          </div>
        </div>

        {/* Intro */}
        <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#1565C0', lineHeight: 1.6 }}>
          🔒 La protection de vos données personnelles est une priorité pour Werdhe. Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map(function(s, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: '#E3F2FD', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1565C0', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {s.titre.replace(/^\d+\.\s/, '')}
                </h2>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
                  {s.contenu}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contact */}
        <div style={{ background: '#1B2B22', borderRadius: 14, padding: '20px 24px', marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 12px' }}>
            Des questions sur notre politique de confidentialité ?
          </p>
          <a href="mailto:contact@werdhe.com"
            style={{ background: '#1565C0', color: '#fff', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            contact@werdhe.com
          </a>
        </div>
      </div>
    </div>
  );
}