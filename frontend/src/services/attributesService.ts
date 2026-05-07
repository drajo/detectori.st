import { apiFetch } from './api';
import type { FindAttribute, CreateAttributeRequest, UpdateAttributeRequest } from '../types';

export const attributesService = {
  create: (findId: string, data: CreateAttributeRequest) =>
    apiFetch<FindAttribute>(`/finds/${findId}/attributes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (findId: string, attrId: string, data: UpdateAttributeRequest) =>
    apiFetch<FindAttribute>(`/finds/${findId}/attributes/${attrId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (findId: string, attrId: string) =>
    apiFetch<void>(`/finds/${findId}/attributes/${attrId}`, { method: 'DELETE' }),
};
