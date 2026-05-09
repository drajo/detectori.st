import { create } from 'zustand';
import { findsService } from '../services/findsService';
import { placesService } from '../services/placesService';
import type { FindMapMarker, PlaceMapMarker } from '../types';

export type VisibleLayers = { finds: boolean; places: boolean };

interface MapState {
  markers: FindMapMarker[];
  placeMarkers: PlaceMapMarker[];
  visibleLayers: VisibleLayers;
  isLoading: boolean;
  error: string | null;

  loadMarkers: () => Promise<void>;
  loadPlaceMarkers: () => Promise<void>;
  loadAll: () => Promise<void>;
  setVisibleLayers: (layers: Partial<VisibleLayers>) => void;
  reset: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  markers: [],
  placeMarkers: [],
  visibleLayers: { finds: true, places: true },
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

  loadPlaceMarkers: async () => {
    try {
      const placeMarkers = await placesService.getMapMarkers();
      set({ placeMarkers });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Błąd ładowania mapy miejsc' });
    }
  },

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [markers, placeMarkers] = await Promise.all([
        findsService.getMapMarkers(),
        placesService.getMapMarkers(),
      ]);
      set({ markers, placeMarkers });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Błąd ładowania mapy' });
    } finally {
      set({ isLoading: false });
    }
  },

  setVisibleLayers: (layers) => {
    set({ visibleLayers: { ...get().visibleLayers, ...layers } });
  },

  reset: () => set({ markers: [], placeMarkers: [], error: null }),
}));
