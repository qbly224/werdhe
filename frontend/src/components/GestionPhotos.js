/* eslint-disable */
import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function GestionPhotos({ logementId, photosInitiales, onUpdate }) {
  var [photos, setPhotos]       = useState(photosInitiales || []);
  var [uploading, setUploading] = useState(false);
  var [preview, setPreview]     = useState(null);

  function handleUpload(e) {
    var files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Vérifier la taille (max 5MB par photo)
    var trop_grandes = files.filter(function(f) { return f.size > 5 * 1024 * 1024; });
    if (trop_grandes.length > 0) {
      toast.error('Photos trop grandes (max 5MB chacune)');
      return;
    }

    setUploading(true);
    var fd = new FormData();
    files.forEach(function(f) { fd.append('photos', f); });

    api.post('/logements/' + logementId + '/photos', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(function(res) {
        setPhotos(res.data.photos);
        if (onUpdate) onUpdate(res.data.photos);
        toast.success(files.length + ' photo(s) ajoutée(s) !');
      })
      .catch(function(err) {
        toast.error(err.response && err.response.data ? err.response.data.erreur : 'Erreur upload');
      })
      .finally(function() { setUploading(false); });
  }

  function supprimerPhoto(url) {
    if (!window.confirm('Supprimer cette photo ?')) return;
    api.delete('/logements/' + logementId + '/photos', { data: { photoUrl: url } })
      .then(function(res) {
        setPhotos(res.data.photos);
        if (onUpdate) onUpdate(res.data.photos);
        toast.success('Photo supprimée');
      })
      .catch(function() { toast.error('Erreur suppression'); });
  }

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2B22', marginBottom: 10 }}>
        📷 Photos du logement ({photos.length}/10)
      </div>

      {/* Grille des photos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
        {photos.map(function(url, i) {
          return (
            <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#F0F0F0' }}>
              <img
                src={url} alt={'Photo ' + (i + 1)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={function() { setPreview(url); }} />
              {i === 0 && (
                <div style={{ position: 'absolute', top: 4, left: 4, background: '#1B6B3A', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>
                  Photo principale
                </div>
              )}
              <button
                onClick={function() { supprimerPhoto(url); }}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>
          );
        })}

        {/* Bouton ajouter */}
        {photos.length < 10 && (
          <label style={{ aspectRatio: '1', border: '2px dashed #E0E0E0', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'not-allowed' : 'pointer', background: '#FAFAFA', transition: 'all .2s' }}
            onMouseEnter={function(e) { if (!uploading) e.currentTarget.style.borderColor = '#1B6B3A'; }}
            onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#E0E0E0'; }}>
            <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            {uploading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>⏳</div>
                <div style={{ fontSize: 9, color: '#888' }}>Upload...</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
                <div style={{ fontSize: 9, color: '#888' }}>Ajouter</div>
              </div>
            )}
          </label>
        )}
      </div>

      <div style={{ fontSize: 11, color: '#aaa' }}>
        JPG, PNG, WEBP · Max 5MB par photo · {10 - photos.length} emplacement(s) restant(s)
      </div>

      {/* Modal prévisualisation */}
      {preview && (
        <div
          onClick={function() { setPreview(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
            <button
              onClick={function() { setPreview(null); }}
              style={{ position: 'absolute', top: -12, right: -12, background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}