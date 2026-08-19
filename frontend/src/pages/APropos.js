/* eslint-disable */
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  ChevronLeft, Home, Users, Shield, TrendingUp,
  MapPin, Heart, Star, ArrowRight, CheckCircle
} from 'lucide-react';

var VALEURS = [
  {
    icon: <Shield size={28} strokeWidth={1.5} color="#1B6B3A" />,
    titre: 'Transparence',
    desc: 'Aucun frais caché, aucun intermédiaire. Le prix affiché est le prix payé.',
    bg: '#E8F5E9'
  },
  {
    icon: <Heart size={28} strokeWidth={1.5} color="#E53935" />,
    titre: 'Confiance',
    desc: 'Dossiers vérifiés, baux officiels, notations mutuelles. La confiance se construit ensemble.',
    bg: '#FFEBEE'
  },
  {
    icon: <Users size={28} strokeWidth={1.5} color="#1565C0" />,
    titre: 'Accessibilité',
    desc: "L'espace locataire est 100% gratuit. Werdhe est fait pour tous les Guinéens.",
    bg: '#E3F2FD'
  },
  {
    icon: <TrendingUp size={28} strokeWidth={1.5} color="#7B1FA2" />,
    titre: 'Innovation',
    desc: 'La première plateforme immobilière numérique de Guinée, pensée pour le mobile.',
    bg: '#F3E5F5'
  },
];

var STATS = [
  { val: '1 200+', label: 'Logements publiés' },
  { val: '4 800+', label: 'Utilisateurs actifs' },
  { val: '8',      label: 'Villes couvertes'   },
  { val: '2026',   label: 'Année de création'  },
];

var EQUIPE = [
  {
    nom:     'Moussa BAH',
    role:    'Fondateur & Développeur',
    initiales: 'MB',
    couleur: '#1B6B3A',
    bio: 'Ingénieur logiciel passionné par l\'impact technologique en Afrique. Créateur de Werdhe pour simplifier la location immobilière en Guinée.',
  },
];

var ETAPES = [
  { annee: '2025', titre: 'L\'idée', desc: 'Face aux difficultés de trouver un logement à Conakry sans intermédiaire, l\'idée de Werdhe naît.' },
  { annee: 'Jan 2026', titre: 'Développement', desc: 'Début du développement de la plateforme avec React, Node.js et Supabase.' },
  { annee: 'Juil 2026', titre: 'Lancement', desc: 'Werdhe.com est lancé officiellement. Les premiers propriétaires publient leurs biens.' },
  { annee: '2027', titre: 'Expansion', desc: 'Objectif : couvrir toutes les préfectures de Guinée et lancer l\'application mobile.' },
];

export default function APropos() {
  var navigate = useNavigate();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="À propos de Werdhe"
        description="Werdhe est la première plateforme immobilière numérique de Guinée. Découvrez notre mission, nos valeurs et notre équipe."
        url="https://werdhe.com/a-propos"
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={function() { navigate(-1); }}
          style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronLeft size={16} strokeWidth={2} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#1B6B3A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Werdhe</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1B2B22 0%, #1B6B3A 100%)', padding: 'clamp(48px, 8vw, 80px) 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 16px', marginBottom: 20 }}>
          <MapPin size={14} color="#F5A623" strokeWidth={2} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>🇬🇳 Made in Guinea</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.1 }}>
          Réinventer la location<br/>
          <span style={{ color: '#F5A623' }}>immobilière en Guinée</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.7)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Werdhe connecte propriétaires et locataires directement, sans intermédiaire, avec des outils numériques modernes adaptés au marché guinéen.
        </p>
        <Link to="/logements"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#F5A623', color: '#1B2B22', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
          Découvrir les logements <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Stats */}
      <div style={{ background: '#1B2B22', padding: 'clamp(24px, 4vw, 40px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, maxWidth: 700, margin: '0 auto' }}>
          {STATS.map(function(s, i) {
            return (
              <div key={i} style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, color: i === 0 ? '#F5A623' : '#fff' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px 60px' }}>

        {/* Notre mission */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Notre mission</div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#1B2B22', margin: '0 0 16px', letterSpacing: -0.5, lineHeight: 1.2 }}>
                Rendre la location accessible à tous
              </h2>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, margin: '0 0 16px' }}>
                En Guinée, trouver un logement ou un locataire fiable est souvent un parcours semé d'embûches - frais d'agence exorbitants, manque de transparence, documents difficiles à gérer.
              </p>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, margin: '0 0 20px' }}>
                Werdhe change ça. En mettant la technologie au service des Guinéens, nous simplifions chaque étape : de la recherche à la signature du bail, en passant par le suivi des paiements.
              </p>
              {[
                '100% gratuit pour les locataires',
                'Baux et quittances générés automatiquement',
                'Alertes loyers automatiques',
                'Support client réactif',
              ].map(function(item, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <CheckCircle size={16} strokeWidth={2} color="#1B6B3A" />
                    <span style={{ fontSize: 14, color: '#555' }}>{item}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', borderRadius: 20, padding: 32, textAlign: 'center', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🏠</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1B6B3A', marginBottom: 8 }}>Werdhe</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                La plateforme de référence<br/>pour la location en Guinée
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(function(n) { return <Star key={n} size={18} strokeWidth={1.5} fill="#F5A623" color="#F5A623" />; })}
              </div>
            </div>
          </div>
        </section>

        {/* Nos valeurs */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Nos valeurs</div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#1B2B22', margin: 0, letterSpacing: -0.5 }}>Ce qui nous guide</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {VALEURS.map(function(v, i) {
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0' }}>
                  <div style={{ width: 56, height: 56, background: v.bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    {v.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2B22', margin: '0 0 8px' }}>{v.titre}</h3>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notre histoire */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Notre histoire</div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#1B2B22', margin: 0, letterSpacing: -0.5 }}>De l'idée à la réalité</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#E8F5E9', transform: 'translateX(-50%)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {ETAPES.map(function(e, i) {
                var estGauche = i % 2 === 0;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: estGauche ? 'flex-start' : 'flex-end', position: 'relative' }}>
                    {/* Point central */}
                    <div style={{ position: 'absolute', left: '50%', top: 20, transform: 'translate(-50%, -50%)', width: 16, height: 16, background: '#1B6B3A', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 0 0 2px #1B6B3A', zIndex: 1 }} />
                    <div style={{ width: '44%', background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F0F0F0' }}>
                      <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, marginBottom: 6 }}>{e.annee}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2B22', marginBottom: 6 }}>{e.titre}</div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{e.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Équipe */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>L'équipe</div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#1B2B22', margin: 0, letterSpacing: -0.5 }}>Derrière Werdhe</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {EQUIPE.map(function(m, i) {
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxWidth: 360, width: '100%', textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, background: m.couleur, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800, margin: '0 auto 16px' }}>
                    {m.initiales}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B22', margin: '0 0 4px' }}>{m.nom}</h3>
                  <div style={{ fontSize: 13, color: '#1B6B3A', fontWeight: 600, marginBottom: 14 }}>{m.role}</div>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 }}>{m.bio}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px) 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: -0.5 }}>
            Rejoignez l'aventure Werdhe
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Que vous soyez propriétaire ou locataire, Werdhe est fait pour vous. Créez votre compte gratuitement.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/inscription"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#F5A623', color: '#1B2B22', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
              Créer mon compte <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link to="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
              Nous contacter
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}