import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { findsService } from '../services/findsService';
import type { FindListItem, FindListQuery, PaginatedResponse, AttributeFacets } from '../types';

interface FindsState {
  finds: FindListItem[];
  pagination: PaginatedResponse<FindListItem>['pagination'] | null;
  query: FindListQuery;
  attrFilter: Record<string, string[]>;
  groupBy: string | null;
  facets: AttributeFacets;
  isLoading: boolean;
  isFacetsLoading: boolean;
  error: string | null;

  setQuery: (query: Partial<FindListQuery>) => void;
  setAttrFilterValue: (key: string, value: string, checked: boolean) => void;
  clearAttrFilter: () => void;
  setGroupBy: (key: string | null) => void;
  loadFinds: () => Promise<void>;
  loadFacets: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_QUERY: FindListQuery = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// Limit przy grupowaniu: ładujemy "wszystko" do grupowania client-side.
// Backend cap'uje do 500 — wystarczy dla typowych zbiorów.
const GROUP_LIMIT = 500;

export const useFindsStore = create<FindsState>()(
  persist(
    (set, get) => ({
      finds: [],
      pagination: null,
      query: DEFAULT_QUERY,
      attrFilter: {},
      groupBy: null,
      facets: {},
      isLoading: false,
      isFacetsLoading: false,
      error: null,

      setQuery: (newQuery) => {
        set((state) => ({
          query: { ...state.query, ...newQuery, page: newQuery.page ?? 1 },
        }));
      },

      setAttrFilterValue: (key, value, checked) => {
        set((state) => {
          const current = state.attrFilter[key] ?? [];
          const next = checked
            ? Array.from(new Set([...current, value]))
            : current.filter((v) => v !== value);
          const updated = { ...state.attrFilter };
          if (next.length === 0) {
            delete updated[key];
          } else {
            updated[key] = next;
          }
          return { attrFilter: updated, query: { ...state.query, page: 1 } };
        });
      },

      clearAttrFilter: () => {
        set((state) => ({ attrFilter: {}, query: { ...state.query, page: 1 } }));
      },

      setGroupBy: (key) => {
        set((state) => ({ groupBy: key, query: { ...state.query, page: 1 } }));
      },

      loadFinds: async () => {
        set({ isLoading: true, error: null });
        try {
          const { query, attrFilter, groupBy } = get();
          const effectiveQuery: FindListQuery = {
            ...query,
            attrFilter: Object.keys(attrFilter).length > 0 ? attrFilter : undefined,
            ...(groupBy ? { limit: GROUP_LIMIT, page: 1 } : {}),
          };
          const response = await findsService.list(effectiveQuery);
          set({ finds: response.data, pagination: response.pagination });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Błąd ładowania znalezisk' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadFacets: async () => {
        set({ isFacetsLoading: true });
        try {
          const facets = await findsService.getAttributeFacets();
          set({ facets });
        } catch (err) {
          console.error('Błąd ładowania facetów atrybutów:', err);
        } finally {
          set({ isFacetsLoading: false });
        }
      },

      reset: () =>
        set({
          finds: [],
          pagination: null,
          query: DEFAULT_QUERY,
          attrFilter: {},
          groupBy: null,
          error: null,
        }),
    }),
    {
      name: 'finds-catalog-prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        attrFilter: state.attrFilter,
        groupBy: state.groupBy,
        query: { sortBy: state.query.sortBy, sortOrder: state.query.sortOrder },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<FindsState> | undefined;
        return {
          ...current,
          attrFilter: p?.attrFilter ?? current.attrFilter,
          groupBy: p?.groupBy ?? current.groupBy,
          query: {
            ...current.query,
            sortBy: p?.query?.sortBy ?? current.query.sortBy,
            sortOrder: p?.query?.sortOrder ?? current.query.sortOrder,
          },
        };
      },
    },
  ),
);
