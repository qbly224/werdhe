/* eslint-disable */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, FileX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import { SignatureForm } from '../components/EtatDesLieux';

// Page publique du garant : il lit l'acte de cautionnement, renseigne son
// identité, recopie la mention et signe, sans créer de compte. Le lien reçu par
// e-mail est personnel, à usage unique et expire au bout de 14 jours.
export default function SignerActe() {
  var t = useTranslation('public').t;
  var { jeton } = useParams();
  var [etat, setEtat] = useState({ chargement: true });
  var [identite, setIdentite] = useState({ nom: '', naissance: '', cni: '', adresse: '', profession: '', telephone: '' });
  var [mention, setMention] = useState('');
  var [envoi, setEnvoi] = useState(false);
  var [signe, setSigne] = useState(false);
  var [etape, setEtape] = useState('lecture'); // lecture | signature

  useEffect(function() {
    var annule = false;
    api.get('/actes/public/' + encodeURIComponent(jeton))
      .then(function(res) {
        if (annule) return;
        setEtat({ acte: res.data });
        setIdentite(function(i) { return Object.assign({}, i, { nom: (res.data.donnees.garant && res.data.donnees.garant.nom) || '' }); });
      })
      .catch(function() { if (!annule) setEtat({ invalide: true }); });
    return function() { annule = true; };
  }, [jeton]);

  var acte = etat.acte;
  var largeur = Math.min(794, Math.max(280, (typeof window !== 'undefined' ? window.innerWidth : 794) - 64));
  var echelle = largeur / 794;
  var champ = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D9E3DC', fontSize: 14, boxSizing: 'border-box' };
  var champsOk = identite.nom.trim().length >= 3 && identite.naissance && identite.cni.trim().length >= 3 && identite.adresse.trim().length >= 5 && identite.profession.trim().length >= 2 && identite.telephone.trim().length >= 6 && mention.trim().length >= 20;

  function signer(signature) {
    setEnvoi(true);
    api.post('/actes/public/' + encodeURIComponent(jeton) + '/signer', { identite: identite, mention: mention, signature: signature })
      .then(function() { setSigne(true); })
      .catch(function(err) { toast.error(err.response && err.response.data && err.response.data.erreur ? err.response.data.erreur : t('signerActe.erreur')); })
      .finally(function() { setEnvoi(false); });
  }

  function ligne(cle, label, type, max) {
    return (
      <label key={cle} style={{ display: 'block', fontSize: 12, color: '#55655B', marginBottom: 10 }}>{label}
        <input type={type || 'text'} maxLength={max} value={identite[cle]} onChange={function(e) { var v = e.target.value; setIdentite(function(i) { return Object.assign({}, i, { [cle]: v }); }); }} style={Object.assign({ marginTop: 3 }, champ)} />
      </label>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F6F3', fontFamily: 'var(--font-body)', padding: '28px 16px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <SEO titre={t('signerActe.titre')} noIndex={true} />
      <div style={{ marginBottom: 22 }}><Logo size={36} showText={true} /></div>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 6px 24px rgba(10,30,18,.10)', padding: '24px 20px', width: '100%', maxWidth: 860 }}>
        {etat.chargement && <p style={{ textAlign: 'center', color: '#6B766F' }}>{t('signerActe.chargement')}</p>}

        {etat.invalide && (
          <div style={{ textAlign: 'center' }}>
            <FileX size={44} strokeWidth={1.5} color="#B3261E" />
            <h1 style={{ fontSize: 20, margin: '12px 0 6px', color: '#B3261E' }}>{t('signerActe.invalide')}</h1>
            <p style={{ color: '#6B766F', fontSize: 14 }}>{t('signerActe.invalideAide')}</p>
          </div>
        )}

        {signe && (
          <div style={{ textAlign: 'center' }}>
            <ShieldCheck size={48} strokeWidth={1.5} color="#1B6B3A" />
            <h1 style={{ fontSize: 21, margin: '12px 0 6px', color: '#1B6B3A' }}>{t('signerActe.merci')}</h1>
            <p style={{ color: '#55655B', fontSize: 14 }}>{t('signerActe.merciAide')}</p>
          </div>
        )}

        {acte && !signe && (
          <div>
            <h1 style={{ fontSize: 20, margin: '0 0 6px', color: '#1B2B22' }}>{t('signerActe.titre')}</h1>
            <p style={{ color: '#55655B', fontSize: 14, marginBottom: 14 }}>{t('signerActe.intro', { bailleur: acte.bailleur, locataire: acte.locataire, logement: acte.logement.titre })}</p>
            <div style={{ width: largeur, maxWidth: '100%', height: 1123 * echelle, overflow: 'hidden', border: '1px solid #E0E0E0', borderRadius: 6, margin: '0 auto 18px', background: '#E6ECE8' }}>
              <iframe title={t('signerActe.titre')} srcDoc={acte.apercu_html} sandbox="" style={{ width: 794, height: 1123, border: 0, transformOrigin: '0 0', transform: 'scale(' + echelle + ')', background: '#fff' }} />
            </div>

            {etape === 'lecture' && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t('signerActe.identiteTitre')}</div>
                {ligne('nom', t('signerActe.nom'), 'text', 80)}
                {ligne('naissance', t('signerActe.naissance'), 'date')}
                {ligne('cni', t('signerActe.cni'), 'text', 30)}
                {ligne('adresse', t('signerActe.adresse'), 'text', 120)}
                {ligne('profession', t('signerActe.profession'), 'text', 50)}
                {ligne('telephone', t('signerActe.telephone'), 'tel', 24)}
                <div style={{ fontSize: 15, fontWeight: 700, margin: '16px 0 6px' }}>{t('signerActe.mentionTitre')}</div>
                <p style={{ fontSize: 12, color: '#55655B', marginBottom: 6 }}>{t('signerActe.mentionAide')}</p>
                <div style={{ background: '#F5F7F5', borderRadius: 8, padding: '10px 12px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, marginBottom: 8 }}>{acte.mention_attendue}</div>
                <textarea value={mention} onChange={function(e) { setMention(e.target.value); }} style={Object.assign({}, champ, { height: 80, resize: 'none', fontFamily: 'Georgia, serif', fontStyle: 'italic' })} />
                <button disabled={!champsOk} onClick={function() { setEtape('signature'); }}
                  style={{ marginTop: 14, width: '100%', padding: 13, borderRadius: 10, border: 'none', background: champsOk ? '#1B6B3A' : '#B0BEC5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: champsOk ? 'pointer' : 'not-allowed' }}>{t('signerActe.continuer')}</button>
              </div>
            )}

            {etape === 'signature' && (
              <SignatureForm titre={t('signerActe.signatureTitre')} nomCompte={identite.nom} envoi={envoi} libelleBouton={t('signerActe.signer')} onAnnuler={function() { setEtape('lecture'); }} onValider={signer} />
            )}
          </div>
        )}
      </div>
      <Link to="/" style={{ marginTop: 18, color: '#1B6B3A', fontSize: 14, fontWeight: 600 }}>{t('signerActe.accueil')}</Link>
    </div>
  );
}
