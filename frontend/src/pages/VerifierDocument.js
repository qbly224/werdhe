import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import SEO from '../components/SEO';
import Logo from '../components/Logo';

// Page publique ouverte par le QR code imprimé sur chaque document Werdhe.
// N'affiche aucune donnée personnelle : seulement le type, la date et l'intégrité.
export default function VerifierDocument() {
  var t = useTranslation('public').t;
  var { numero } = useParams();
  var [etat, setEtat] = useState({ chargement: true });

  useEffect(function() {
    var annule = false;
    api.get('/documents/verifier/' + encodeURIComponent(numero))
      .then(function(res) { if (!annule) setEtat({ doc: res.data }); })
      .catch(function() { if (!annule) setEtat({ introuvable: true }); });
    return function() { annule = true; };
  }, [numero]);

  var doc = etat.doc;
  var valide = doc && doc.integre !== false && !doc.annule;
  var couleur = valide ? '#1B6B3A' : '#B3261E';
  var Icone = etat.introuvable ? FileX : (valide ? ShieldCheck : ShieldAlert);

  function dateFr(d) {
    return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  }

  function ligne(label, valeur, mono) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid #E6ECE8', fontSize: 14 }}>
        <span style={{ color: '#6B766F' }}>{label}</span>
        <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : 'inherit' }}>{valeur}</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F6F3', fontFamily: 'system-ui, sans-serif', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <SEO titre={t('verifierDocument.titre')} noIndex={true} />
      <div style={{ marginBottom: 24 }}><Logo size={36} showText={true} /></div>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 24px rgba(10,30,18,.10)', padding: '28px 24px', width: '100%', maxWidth: 460 }}>
        {etat.chargement && <p style={{ textAlign: 'center', color: '#6B766F' }}>{t('verifierDocument.chargement')}</p>}

        {etat.introuvable && (
          <div style={{ textAlign: 'center' }}>
            <Icone size={44} strokeWidth={1.5} color={couleur} />
            <h1 style={{ fontSize: 20, margin: '12px 0 6px', color: couleur }}>{t('verifierDocument.introuvable')}</h1>
            <p style={{ color: '#6B766F', fontSize: 14 }}>{t('verifierDocument.introuvableAide')}</p>
          </div>
        )}

        {doc && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <Icone size={44} strokeWidth={1.5} color={couleur} />
              <h1 style={{ fontSize: 21, margin: '10px 0 6px', color: couleur }}>
                {doc.annule ? t('verifierDocument.annuleTexte', { date: dateFr(doc.annule_le) }) : (doc.integre === false ? t('verifierDocument.altere') : t('verifierDocument.authentique'))}
              </h1>
              {!doc.annule && (
                <p style={{ color: '#55655B', fontSize: 14 }}>{doc.integre === false ? t('verifierDocument.alterTexte') : t('verifierDocument.authentiqueTexte')}</p>
              )}
            </div>
            {ligne(t('verifierDocument.numero'), doc.numero, true)}
            {ligne(t('verifierDocument.type'), t('verifierDocument.types.' + doc.type, { defaultValue: doc.type }))}
            {ligne(t('verifierDocument.genereLe'), dateFr(doc.genere_le))}
            {doc.empreinte && ligne(t('verifierDocument.empreinte'), doc.empreinte, true)}
          </div>
        )}
      </div>
      <Link to="/" style={{ marginTop: 20, color: '#1B6B3A', fontSize: 14, fontWeight: 600 }}>{t('verifierDocument.accueil')}</Link>
    </div>
  );
}
