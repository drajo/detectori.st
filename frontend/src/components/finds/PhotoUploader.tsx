import React, { useRef, useState, useCallback } from 'react';
import type { FindPhoto } from '../../types';
import { photosService } from '../../services/photosService';
import { ApiRequestError } from '../../services/api';
import { Spinner } from '../../components/ui';

const MAX_PHOTOS = 10;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface PhotoUploaderProps {
  findId: string;
  photos: FindPhoto[];
  onPhotosChange: (photos: FindPhoto[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ findId, photos, onPhotosChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const canUploadMore = photos.length < MAX_PHOTOS;

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Unsupported format. Accepted: JPEG, PNG, WebP.';
    if (file.size > MAX_SIZE_BYTES) return 'File too large. Maximum size is 10 MB.';
    return null;
  };

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) { setUploadError(validationError); return; }
    setUploadError(null);
    setIsUploading(true);
    try {
      const newPhoto = await photosService.upload(findId, file);
      onPhotosChange([...photos, newPhoto]);
    } catch (err) {
      setUploadError(err instanceof ApiRequestError ? err.message : 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [findId, photos, onPhotosChange]);

  const handleDelete = async (photoId: string) => {
    try {
      await photosService.delete(findId, photoId);
      onPhotosChange(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setUploadError(err instanceof ApiRequestError ? err.message : 'Failed to delete photo.');
    }
  };

  const handleSetCover = async (photoId: string) => {
    try {
      const updatedPhoto = await photosService.setCover(findId, photoId);
      onPhotosChange(photos.map((p) => p.id === updatedPhoto.id ? updatedPhoto : { ...p, isCover: false }));
    } catch (err) {
      setUploadError(err instanceof ApiRequestError ? err.message : 'Failed to set cover photo.');
    }
  };

  return (
    <div>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative rounded-xl overflow-hidden border border-explorer-border group aspect-square">
              <img src={photo.thumbnailUrl} alt="Find photo" className="w-full h-full object-cover" loading="lazy" />
              {photo.isCover && (
                <span className="absolute top-1.5 left-1.5 bg-explorer-gold text-black text-xs font-semibold px-1.5 py-0.5 rounded-md">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2 gap-1">
                {!photo.isCover && (
                  <button
                    type="button"
                    onClick={() => void handleSetCover(photo.id)}
                    aria-label="Set as cover"
                    title="Set as cover"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-explorer-gold hover:bg-yellow-400 text-black transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-gold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                )}
                {photo.isCover && <span className="flex-1" />}
                <button
                  type="button"
                  onClick={() => void handleDelete(photo.id)}
                  aria-label="Delete photo"
                  title="Delete photo"
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-explorer-danger hover:bg-red-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-danger"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <div className="mb-3 text-xs text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">
          {uploadError}
        </div>
      )}

      {canUploadMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) void handleUpload(file); }}
          className={[
            'rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer',
            isDragOver ? 'border-explorer-accent bg-explorer-accent/5' : 'border-explorer-border hover:border-explorer-accent/50',
          ].join(' ')}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <p className="text-sm text-explorer-muted">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-explorer-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-explorer-text-secondary">
                Drop photo here or <span className="text-explorer-accent">browse</span>
              </p>
              <p className="text-xs text-explorer-muted">JPEG, PNG, WebP · max 10 MB · {photos.length}/{MAX_PHOTOS} photos</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleUpload(file); }} className="sr-only" aria-label="Upload photo" disabled={isUploading} />
        </div>
      )}

      {!canUploadMore && (
        <p className="text-xs text-explorer-muted text-center py-2">Maximum of {MAX_PHOTOS} photos reached.</p>
      )}
    </div>
  );
};
