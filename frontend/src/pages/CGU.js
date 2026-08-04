/* eslint-disable */
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronLeft, FileText } from 'lucide-react';

var SECTIONS = [
  {
    titre: '1. Présentation de Werdhe',
    contenu: `Werdhe est une plateforme numérique de gestion et de mise en relation locative, éditée par QbelyTech, dont le siège social est situé en Guinée. La plateforme est accessible à l'adresse https://werdhe.com.

Werdhe permet aux propriétaires de publier et gérer leurs biens immobiliers, et aux locataires de rechercher un logement, soumettre des candidatures et suivre leur location en ligne.`
  },
  {
    titre: '2. Acceptation des conditions',
    contenu: `L'utilisation de la plateforme Werdhe implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, veuillez cesser immédiatement d'utiliser nos services.

Ces conditions peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification importante par email ou par notification sur la plateforme.`
  },
  {
    titre: '3. Inscription et compte utilisateur',
    contenu: `Pour utiliser les services de Werdhe, vous devez créer un compte en fournissant des informations exactes, complètes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.

Werdhe se réserve le droit de suspendre ou supprimer tout compte en cas de :
• Fourniture d'informations fausses ou trompeuses
• Comportement frauduleux ou abusif
• Non-respect des présentes CGU
• Demande des autorités compétentes`
  },
  {
    titre: '4. Services proposés',
    contenu: `Werdhe propose les services suivants :

Pour les propriétaires : publication de biens immobiliers, gestion des candidatures, génération de documents (baux, quittances), suivi des paiements, alertes automatiques.

Pour les locataires : recherche de logements, soumission de candidatures, signature électronique de bail, suivi des paiements et de la location.

L'espace locataire est entièrement gratuit. Les propriétaires peuvent souscrire à des plans payants pour accéder à des fonctionnalités avancées.`
  },
  {
    titre: '5. Obligations des propriétaires',
    contenu: `Les propriétaires s'engagent à :
• Publier uniquement des biens dont ils sont légalement propriétaires ou mandataires
• Fournir des informations exactes sur leurs logements (superficie, prix, état)
• Respecter la réglementation en vigueur en matière de location en Guinée
• Répondre aux candidatures dans un délai raisonnable
• Ne pas pratiquer de discrimination dans la sélection des locataires
• Payer les commissions dues à Werdhe (5% sur chaque loyer encaissé)`
  },
  {
    titre: '6. Obligations des locataires',
    contenu: `Les locataires s'engagent à :
• Fournir des documents authentiques lors de la soumission de leur dossier
• Respecter les conditions du bail signé
• Payer leur loyer dans les délais convenus
• Entretenir le logement en bon état
• Signaler tout problème au propriétaire dans les meilleurs délais`
  },
  {
    titre: '7. Paiements et commissions',
    contenu: `Werdhe perçoit une commission de 5% sur chaque loyer encaissé par les propriétaires utilisant la plateforme. Cette commission est automatiquement calculée lors de l'enregistrement des paiements.

Les plans d'abonnement (Pro : 120 000 GNF/mois, Agence : 300 000 GNF/mois) sont facturés mensuellement. Le défaut de paiement entraîne la suspension des fonctionnalités premium.

Werdhe utilise des prestataires de paiement tiers (Orange Money, MTN MoMo) et ne stocke aucune information bancaire sur ses serveurs.`
  },
  {
    titre: '8. Documents et signatures électroniques',
    contenu: `Les documents générés par Werdhe (baux, quittances, états des lieux) ont valeur contractuelle entre les parties. La signature électronique réalisée sur la plateforme est reconnue comme valide par les parties.

Werdhe ne peut être tenu responsable des litiges découlant des contrats signés via la plateforme. Il incombe aux parties de vérifier le contenu des documents avant signature.`
  },
  {
    titre: '9. Responsabilité',
    contenu: `Werdhe agit en tant qu'intermédiaire entre propriétaires et locataires et ne peut être tenu responsable de :
• La qualité ou l'état réel des logements publiés
• L'exactitude des informations fournies par les utilisateurs
• Les litiges entre propriétaires et locataires
• Les problèmes de paiement entre parties

Werdhe s'engage à maintenir la plateforme disponible 24h/24, mais ne peut garantir une disponibilité sans interruption.`
  },
  {
    titre: '10. Propriété intellectuelle',
    contenu: `L'ensemble des éléments constituant la plateforme Werdhe (logo, design, code, textes, images) sont protégés par les droits de propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation écrite de QbelyTech.

Les utilisateurs conservent la propriété des contenus qu'ils publient sur la plateforme (photos de logements, documents) et accordent à Werdhe une licence d'utilisation non exclusive pour les afficher sur la plateforme.`
  },
  {
    titre: '11. Résiliation',
    contenu: `Tout utilisateur peut supprimer son compte à tout moment depuis les paramètres de son profil. La suppression entraîne la suppression de toutes les données personnelles dans un délai de 30 jours, sous réserve des obligations légales de conservation.

Werdhe peut résilier un compte sans préavis en cas de violation grave des présentes CGU.`
  },
  {
    titre: '12. Droit applicable',
    contenu: `Les présentes CGU sont soumises au droit guinéen. Tout litige sera soumis à la compétence exclusive des tribunaux de Conakry, Guinée.

Pour toute question concernant ces conditions, vous pouvez nous contacter à : contact@werdhe.com`
  },
];

export default function CGU() {
  var navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Conditions Générales d'Utilisation"
        description="Conditions générales d'utilisation de la plateforme Werdhe — Location immobilière en Guinée."
        url="https://werdhe.com/cgu"
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
          <div style={{ width: 48, height: 48, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} strokeWidth={1.5} color="#1B6B3A" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1B2B22', margin: 0 }}>
              Conditions Générales d'Utilisation
            </h1>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
              Dernière mise à jour : 1er août 2026
            </p>
          </div>
        </div>

        {/* Intro */}
        <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#7B4F00', lineHeight: 1.6 }}>
          ℹ️ Veuillez lire attentivement ces conditions avant d'utiliser la plateforme Werdhe. En vous inscrivant, vous acceptez l'intégralité de ces conditions.
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map(function(s, i) {
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, background: '#E8F5E9', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1B6B3A', flexShrink: 0 }}>
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
            Des questions sur nos conditions d'utilisation ?
          </p>
          <a href="mailto:contact@werdhe.com"
            style={{ background: '#F5A623', color: '#1B2B22', padding: '10px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
            contact@werdhe.com
          </a>
        </div>
      </div>
    </div>
  );
}