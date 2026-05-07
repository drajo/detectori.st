import { apiFetch } from './api';
import type {
  Find, FindListItem, FindMapMarker, CreateFindRequest, UpdateFindRequest,
  FindListQuery, PaginatedResponse,
} from '../types';

export const findsService = {
  list: (query?: FindListQuery) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.search) params.set('search', query.search);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiFetch<PaginatedResponse<FindListItem>>(`/finds${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiFetch<Find>(`/finds/${id}`),

  create: (data: CreateFindRequest) =>
    apiFetch<Find>('/finds', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateFindRequest) =>
    apiFetch<Find>(`/finds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) => apiFetch<void>(`/finds/${id}`, { method: 'DELETE' }),

  getMapMarkers: () => apiFetch<FindMapMarker[]>('/finds/map'),
};
