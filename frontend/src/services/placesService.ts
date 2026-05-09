import { apiFetch } from './api';
import type {
  Place, PlaceListItem, PlaceMapMarker, PlacePhoto,
  CreatePlaceRequest, UpdatePlaceRequest, PlaceListQuery, PaginatedResponse,
} from '../types';

export const placesService = {
  list: (query?: PlaceListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.search) params.set('search', query.search);
    if (query?.tag) params.set('tag', query.tag);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiFetch<PaginatedResponse<PlaceListItem>>(`/places${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiFetch<Place>(`/places/${id}`),

  create: (data: CreatePlaceRequest) =>
    apiFetch<Place>('/places', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdatePlaceRequest) =>
    apiFetch<Place>(`/places/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/places/${id}`, { method: 'DELETE' }),

  getMapMarkers: () => apiFetch<PlaceMapMarker[]>('/places/map'),

  getTags: () => apiFetch<string[]>('/places/tags'),

  uploadPhoto: (placeId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiFetch<PlacePhoto>(`/places/${placeId}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePhoto: (placeId: string, photoId: string) =>
    apiFetch<void>(`/places/${placeId}/photos/${photoId}`, { method: 'DELETE' }),

  setCoverPhoto: (placeId: string, photoId: string) =>
    apiFetch<PlacePhoto>(`/places/${placeId}/photos/${photoId}/cover`, { method: 'PATCH' }),
};
