import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, Camera, Star, Trash2, CheckCircle2 } from 'lucide-react';
import './PhotoUpload.css';

const PhotoUpload = ({ logementId, photosInitiales = [], onUpdate }) => {
  const { t } = useTranslation('profil');
  const [photos, setPhotos] = useState(photosInitiales);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Upload des photos sélectionnées
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('photos', file);
    });

    setUploading(true);
    try {
      const res = await api.post(
        `/logements/${logementId}/photos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPhotos(res.data.photos);
      if (onUpdate) onUpdate(res.data.photos);
      toast.success(t('photoUpload.toasts.ajoutees', { count: files.length }), { icon: <CheckCircle2 size={16} strokeWidth={1.8} /> });
    } catch (err) {
      toast.error(err.response?.data?.erreur || t('photoUpload.toasts.erreurUpload'));
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une photo
  const handleSupprimer = async (publicId) => {
    try {
      const res = await api.delete(
        `/logements/${logementId}/photos/${encodeURIComponent(publicId)}`
      );
      setPhotos(res.data.photos);
      if (onUpdate) onUpdate(res.data.photos);
      toast.success(t('photoUpload.toasts.supprimee'));
    } catch (err) {
      toast.error(t('photoUpload.toasts.erreurSuppression'));
    }
  };

  // Définir comme photo principale
  const handlePrincipale = async (publicId) => {
    try {
      const res = await api.patch(
        `/logements/${logementId}/photos/principale`,
        { public_id: publicId }
      );
      setPhotos(res.data.photos);
      if (onUpdate) onUpdate(res.data.photos);
      toast.success(t('photoUpload.toasts.principaleDefinie'), { icon: <CheckCircle2 size={16} strokeWidth={1.8} /> });
    } catch (err) {
      toast.error(t('photoUpload.toasts.erreur'));
    }
  };

  return (
    <div className="photo-upload">

      {/* Zone de drop */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById('photo-input').click()}
      >
        <input
          id="photo-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files)}
        />

        {uploading ? (
          <div className="drop-uploading">
            <Loader2 className="spinner" size={28} strokeWidth={1.5} />
            <p>{t('photoUpload.dropZone.uploading')}</p>
          </div>
        ) : (
          <div className="drop-content">
            <Camera size={32} strokeWidth={1.5} color="#1B6B3A" />
            <p>{t('photoUpload.dropZone.dragText')} <strong>{t('photoUpload.dropZone.dragTextBold')}</strong></p>
            <small>{t('photoUpload.dropZone.formats')}</small>
          </div>
        )}
      </div>

      {/* Aperçu des photos */}
      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <div
              key={photo.public_id}
              className={`photo-item ${index === 0 ? 'principale' : ''}`}
            >
              <img src={photo.url} alt={t('photoUpload.altLogement', { index: index + 1 })} />

              {/* Badge photo principale */}
              {index === 0 && (
                <span className="badge-principale" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={12} strokeWidth={1.8} />
                  {t('photoUpload.badgePrincipale')}
                </span>
              )}

              {/* Actions */}
              <div className="photo-actions">
                {index !== 0 && (
                  <button
                    className="photo-btn btn-etoile"
                    onClick={() => handlePrincipale(photo.public_id)}
                    title={t('photoUpload.actions.definirPrincipale')}
                  ><Star size={14} strokeWidth={1.8} /></button>
                )}
                <button
                  className="photo-btn btn-supprimer"
                  onClick={() => handleSupprimer(photo.public_id)}
                  title={t('photoUpload.actions.supprimer')}
                ><Trash2 size={14} strokeWidth={1.8} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <p className="no-photos">
          {t('photoUpload.noPhotos')}
        </p>
      )}

    </div>
  );
};

export default PhotoUpload;