import { create } from 'zustand';
import { placesService } from '../services/placesService';
import type { PlaceListItem, PlaceListQuery, PaginatedResponse } from '../types';

interface PlacesState {
  places: PlaceListItem[];
  pagination: PaginatedResponse<PlaceListItem>['pagination'] | null;
  query: PlaceListQuery;
  tags: string[];
  isLoading: boolean;
  error: string | null;

  setQuery: (query: Partial<PlaceListQuery>) => void;
  loadPlaces: () => Promise<void>;
  loadTags: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_QUERY: PlaceListQuery = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  pagination: null,
  query: DEFAULT_QUERY,
  tags: [],
  isLoading: false,
  error: null,

  setQuery: (newQuery) => {
    set((state) => ({
      query: { ...state.query, ...newQuery, page: newQuery.page ?? 1 },
    }));
  },

  loadPlaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await placesService.list(get().query);
      set({ places: response.data, pagination: response.pagination });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Błąd ładowania miejsc' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTags: async () => {
    try {
      const tags = await placesService.getTags();
      set({ tags });
    } catch (err) {
      console.error('Błąd ładowania tagów miejsc:', err);
    }
  },

  reset: () => set({ places: [], pagination: null, query: DEFAULT_QUERY, error: null }),
}));
