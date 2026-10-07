/* eslint-disable */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import api from '../services/api';
import { Home, Sparkles, ArrowRight, MapPin } from 'lucide-react';

var VILLES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Boké', 'Mamou', 'Faranah', 'N\'Zérékoré'];
var COMMUNES_CONAKRY = ['Kaloum', 'Dixinn', 'Matam', 'Ratoma', 'Matoto'];
var CATEGORIES = [
  { value: 'studio',      label: 'Studio' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'duplex',      label: 'Duplex' },
  { value: 'villa',       label: 'Villa' },
  { value: 'bureau',      label: 'Bureau' },
];

export default function Estimation() {
  var [ville, setVille] = useState('');
  var [categorie, setCategorie] = useState('appartement');
  var [nbChambres, setNbChambres] = useState('2');
  var [superficie, setSuperficie] = useState('');
  var [loading, setLoading] = useState(false);
  var [resultat, setResultat] = useState(null);
  var [erreur, setErreur] = useState('');

  var villesDisponibles = ville === 'Conakry' ? [] : VILLES;

  function estimer(e) {
    e.preventDefault();
    if (!ville) { setErreur('Choisissez une ville'); return; }
    setErreur('');
    setLoading(true);
    setResultat(null);
    api.post('/estimation/loyer', {
      ville: ville,
      categorie: categorie,
      nb_chambres: nbChambres,
      superficie: superficie,
    })
      .then(function(res) { setResultat(res.data); })
      .catch(function() { setErreur('Impossible de calculer une estimation pour le moment.'); })
      .finally(function() { setLoading(false); });
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F8F7', minHeight: '100vh' }}>
      <SEO
        titre="Estimation de loyer gratuite en Guinée"
        description="Estimez gratuitement le loyer de votre logement à Conakry ou ailleurs en Guinée grâce aux données de la plateforme Werdhe."
        url="https://werdhe.com/estimation"
      />

      <nav style={{ background: '#fff', borderBottom: '0.5px solid #E0E0E0', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#1B6B3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={15} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1B2B22' }}>Werdhe</span>
        </Link>
        <Link to="/logements/ajouter" style={{ padding: '8px 16px', borderRadius: 8, background: '#1B6B3A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          Publier un logement
        </Link>
      </nav>

      <div style={{ textAlign: 'center', padding: 'clamp(40px, 6vw, 56px) 24px 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 20, padding: '4px 14px', marginBottom: 18 }}>
          <Sparkles size={13} strokeWidth={2} color="#1B6B3A" />
          <span style={{ fontSize: 12, color: '#1B5E20', fontWeight: 700 }}>Gratuit · Basé sur les données Werdhe</span>
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 900, color: '#1B2B22', margin: '0 0 12px', letterSpacing: -1 }}>
          Combien vaut votre loyer ?
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 auto 40px', maxWidth: 480 }}>
          Obtenez une estimation en quelques secondes, basée sur les logements similaires publiés en Guinée.
        </p>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 64px' }}>
        <form onSubmit={estimer} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Ville / Commune *</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} color="#aaa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <select value={ville} onChange={function(e) { setVille(e.target.value); }}
                style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                <option value="">Sélectionnez...</option>
                <optgroup label="Conakry">
                  {COMMUNES_CONAKRY.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </optgroup>
                <optgroup label="Autres villes">
                  {VILLES.filter(function(v) { return v !== 'Conakry'; }).map(function(v) { return <option key={v} value={v}>{v}</option>; })}
                </optgroup>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Type de bien</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
              {CATEGORIES.map(function(c) {
                var actif = categorie === c.value;
                return (
                  <button key={c.value} type="button" onClick={function() { setCategorie(c.value); }}
                    style={{ padding: '9px 10px', borderRadius: 10, border: actif ? '2px solid #1B6B3A' : '1.5px solid #E0E0E0', background: actif ? '#E8F5E9' : '#fff', color: actif ? '#1B6B3A' : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Chambres</label>
              <input type="number" min="0" value={nbChambres} onChange={function(e) { setNbChambres(e.target.value); }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>Superficie (m²)</label>
              <input type="number" min="0" placeholder="Optionnel" value={superficie} onChange={function(e) { setSuperficie(e.target.value); }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {erreur && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#B71C1C' }}>
              {erreur}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#aaa' : '#1B6B3A', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Calcul en cours...' : <>Estimer mon loyer <ArrowRight size={15} strokeWidth={2.5} /></>}
          </button>
        </form>

        {resultat && (
          <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #1B2B22, #1B6B3A)', borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Estimation
            </div>
            <div style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              {Number(resultat.estimation_basse).toLocaleString('fr-FR')} – {Number(resultat.estimation_haute).toLocaleString('fr-FR')}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18 }}>GNF / mois</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#fff' }}>
              {resultat.nb_comparables > 0
                ? `Basé sur ${resultat.nb_comparables} logement(s) similaire(s) sur Werdhe`
                : 'Estimation statistique — publiez votre bien pour affiner les prix du marché'}
            </div>
            <div style={{ marginTop: 22 }}>
              <Link to="/logements/ajouter" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#F5A623', color: '#1B2B22', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                Publier mon logement <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Cette estimation est indicative et ne remplace pas l'avis d'un professionnel.
          En savoir plus sur les <Link to="/blog/prix-loyers-par-quartier-conakry" style={{ color: '#1B6B3A' }}>prix par quartier à Conakry</Link>.
        </p>
      </div>

      <div style={{ background: '#101A12', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          © 2026 Werdhe · <a href="/cgu" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>CGU</a> · <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Confidentialité</a>
        </p>
      </div>
    </div>
  );
}
