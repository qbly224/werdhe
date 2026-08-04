/* eslint-disable */
import { Helmet } from 'react-helmet-async';

export default function SEO({
  titre,
  description,
  image,
  url,
  type = 'website',
  noIndex = false
}) {
  var titreFinal = titre
    ? titre + ' — Werdhe'
    : 'Werdhe — Location immobilière en Guinée';

  var descFinal = description ||
    'Werdhe est la plateforme de référence pour louer un logement en Guinée. Trouvez votre appartement, villa ou studio à Conakry et partout en Guinée.';

  var imageFinal = image || 'https://werdhe.com/og-image.png';
  var urlFinal   = url || 'https://werdhe.com';

  return (
    <Helmet>
      {/* Basique */}
      <title>{titreFinal}</title>
      <meta name="description" content={descFinal} />
      <link rel="canonical" href={urlFinal} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (Facebook, WhatsApp) */}
      <meta property="og:title"       content={titreFinal} />
      <meta property="og:description" content={descFinal} />
      <meta property="og:image"       content={imageFinal} />
      <meta property="og:url"         content={urlFinal} />
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content="Werdhe" />
      <meta property="og:locale"      content="fr_GN" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={titreFinal} />
      <meta name="twitter:description" content={descFinal} />
      <meta name="twitter:image"       content={imageFinal} />

      {/* Mobile */}
      <meta name="theme-color" content="#1B6B3A" />
    </Helmet>
  );
}