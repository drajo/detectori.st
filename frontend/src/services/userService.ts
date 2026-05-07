import { apiFetch } from './api';
import type { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../types';

export const userService = {
  getProfile: () => apiFetch<UserProfile>('/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordRequest) =>
    apiFetch<{ message: string }>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch<{ avatarUrl: string }>('/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};
