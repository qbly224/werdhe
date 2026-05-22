// ================================
// GÉOCODER UNE ADRESSE
// ================================
// Node.js 18+ a fetch natif — pas besoin de node-fetch
const geocoderAdresse = async (adresse, ville, pays = 'Guinée') => {
  try {
    const query = encodeURIComponent(`${adresse}, ${ville}, ${pays}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Werdhe-App/1.0 (werdhe@gmail.com)'
      }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }

    // Coordonnées par défaut selon la ville
    return getCoordsVille(ville);

  } catch (err) {
    console.error('Erreur géocodage:', err.message);
    return getCoordsVille(ville);
  }
};

// Coordonnées des villes guinéennes
const getCoordsVille = (ville) => {
  const coordsVilles = {
    'Conakry':     { latitude: 9.6412,  longitude: -13.5784 },
    'Kaloum':      { latitude: 9.5142,  longitude: -13.6994 },
    'Dixinn':      { latitude: 9.5683,  longitude: -13.6434 },
    'Ratoma':      { latitude: 9.6121,  longitude: -13.6234 },
    'Matam':       { latitude: 9.5573,  longitude: -13.6684 },
    'Matoto':      { latitude: 9.5973,  longitude: -13.6384 },
    'Kindia':      { latitude: 10.0572, longitude: -12.8658 },
    'Kankan':      { latitude: 10.3839, longitude: -9.3054  },
    'Labé':        { latitude: 11.3181, longitude: -12.2847 },
    'Mamou':       { latitude: 10.3768, longitude: -12.0922 },
    'Boké':        { latitude: 10.9341, longitude: -14.2958 },
    'Faranah':     { latitude: 10.0395, longitude: -10.7417 },
    'N\'Zérékoré': { latitude: 7.7562,  longitude: -8.8179  },
    'Siguiri':     { latitude: 11.4148, longitude: -9.1681  },
    'Guékédou':    { latitude: 8.5569,  longitude: -10.1341 },
    'Macenta':     { latitude: 8.5484,  longitude: -9.4686  },
    'Kissidougou': { latitude: 9.1850,  longitude: -10.1024 },
    'Coyah':       { latitude: 9.7050,  longitude: -13.3822 },
    'Dubréka':     { latitude: 9.7897,  longitude: -13.5144 },
    'Dalaba':      { latitude: 10.6897, longitude: -12.2442 },
    'Pita':        { latitude: 11.0667, longitude: -12.4000 }
  };

  return coordsVilles[ville] || { latitude: 9.6412, longitude: -13.5784 };
};

module.exports = { geocoderAdresse };