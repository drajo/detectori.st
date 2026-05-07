import { apiFetch } from './api';
import type { FindPhoto } from '../types';

export const photosService = {
  upload: (findId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiFetch<FindPhoto>(`/finds/${findId}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  delete: (findId: string, photoId: string) =>
    apiFetch<void>(`/finds/${findId}/photos/${photoId}`, { method: 'DELETE' }),

  setCover: (findId: string, photoId: string) =>
    apiFetch<FindPhoto>(`/finds/${findId}/photos/${photoId}/cover`, { method: 'PATCH' }),
};
