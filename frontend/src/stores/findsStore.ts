import { create } from 'zustand';
import { findsService } from '../services/findsService';
import type { FindListItem, FindListQuery, PaginatedResponse } from '../types';

interface FindsState {
  finds: FindListItem[];
  pagination: PaginatedResponse<FindListItem>['pagination'] | null;
  query: FindListQuery;
  isLoading: boolean;
  error: string | null;

  setQuery: (query: Partial<FindListQuery>) => void;
  loadFinds: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_QUERY: FindListQuery = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFindsStore = create<FindsState>((set, get) => ({
  finds: [],
  pagination: null,
  query: DEFAULT_QUERY,
  isLoading: false,
  error: null,

  setQuery: (newQuery) => {
    set((state) => ({
      query: { ...state.query, ...newQuery, page: newQuery.page ?? 1 },
    }));
  },

  loadFinds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await findsService.list(get().query);
      set({ finds: response.data, pagination: response.pagination });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Błąd ładowania znalezisk' });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ finds: [], pagination: null, query: DEFAULT_QUERY, error: null }),
}));
