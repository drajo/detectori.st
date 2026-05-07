import { create } from 'zustand';
import { findsService } from '../services/findsService';
import type { FindMapMarker } from '../types';

interface MapState {
  markers: FindMapMarker[];
  isLoading: boolean;
  error: string | null;

  loadMarkers: () => Promise<void>;
  reset: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  markers: [],
  isLoading: false,
  error: null,

  loadMarkers: async () => {
    set({ isLoading: true, error: null });
    try {
      const markers = await findsService.getMapMarkers();
      set({ markers });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Błąd ładowania mapy' });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ markers: [], error: null }),
}));
