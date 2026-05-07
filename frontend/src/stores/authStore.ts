import { create } from 'zustand';
import { setAccessToken, setSessionExpiredCallback } from '../services/api';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { UserProfile, LoginRequest } from '../types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;

  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionExpired: false,

  login: async (data) => {
    const response = await authService.login(data);
    setAccessToken(response.accessToken);
    set({ user: response.user, isAuthenticated: true, sessionExpired: false });
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, sessionExpired: false });
    }
  },

  loadUser: async () => {
    const user = await userService.getProfile();
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  initialize: async () => {
    // Zarejestruj callback wywoływany gdy sesja wygaśnie w trakcie użytkowania
    setSessionExpiredCallback(() => {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, sessionExpired: true });
    });

    set({ isLoading: true });
    try {
      // Spróbuj odświeżyć token przy starcie aplikacji
      const response = await authService.refresh();
      setAccessToken(response.accessToken);
      const user = await userService.getProfile();
      set({ user, isAuthenticated: true });
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
