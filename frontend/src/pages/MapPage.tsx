import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { FindMapMarker, PlaceMapMarker } from '../types';
import { useMapStore } from '../stores/mapStore';
import { Spinner } from '../components/ui';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const FIND_PIN_COLOR = '#f59e0b'; // explorer-gold
const PLACE_PIN_COLOR = '#6366f1'; // explorer-accent

function makeColoredPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position:relative;width:28px;height:36px;">
        <svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
          <circle cx="14" cy="14" r="5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

const FindClusters: React.FC<{ markers: FindMapMarker[] }> = ({ markers }) => {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    if (typeof (L as unknown as { markerClusterGroup?: unknown }).markerClusterGroup !== 'function') return;

    const group = (L as unknown as { markerClusterGroup: (options?: object) => L.MarkerClusterGroup }).markerClusterGroup({
      disableClusteringAtZoom: 18,
      maxClusterRadius: 80,
    });

    const icon = makeColoredPinIcon(FIND_PIN_COLOR);
    markers.forEach((marker) => {
      const m = L.marker([marker.latitude, marker.longitude], { icon });
      m.bindPopup(`
        <div style="min-width:160px;font-family:Inter,sans-serif;">
          ${marker.coverThumbnailUrl ? `<img src="${marker.coverThumbnailUrl}" alt="${marker.name}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ''}
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${FIND_PIN_COLOR};margin-bottom:2px;">Find</div>
          <strong style="display:block;margin-bottom:4px;color:#e2e8f0;font-size:13px;">${marker.name}</strong>
          <a href="/finds/${marker.id}" style="color:#6366f1;text-decoration:underline;font-size:12px;">View details →</a>
        </div>
      `);
      group.addLayer(m);
    });

    map.addLayer(group);
    groupRef.current = group;

    return () => { if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; } };
  }, [map, markers]);

  return null;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const PlaceClusters: React.FC<{ markers: PlaceMapMarker[] }> = ({ markers }) => {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    if (typeof (L as unknown as { markerClusterGroup?: unknown }).markerClusterGroup !== 'function') return;

    const group = (L as unknown as { markerClusterGroup: (options?: object) => L.MarkerClusterGroup }).markerClusterGroup({
      disableClusteringAtZoom: 18,
      maxClusterRadius: 80,
    });

    const icon = makeColoredPinIcon(PLACE_PIN_COLOR);
    markers.forEach((marker) => {
      const m = L.marker([marker.latitude, marker.longitude], { icon });
      const tagsHtml = marker.tags.length > 0
        ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${marker.tags.slice(0, 3).map((t) => `<span style="background:rgba(99,102,241,0.15);color:#6366f1;font-size:10px;padding:2px 6px;border-radius:4px;">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';
      m.bindPopup(`
        <div style="min-width:160px;font-family:Inter,sans-serif;">
          ${marker.coverThumbnailUrl ? `<img src="${marker.coverThumbnailUrl}" alt="${escapeHtml(marker.name)}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ''}
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${PLACE_PIN_COLOR};margin-bottom:2px;">Place</div>
          <strong style="display:block;margin-bottom:6px;color:#e2e8f0;font-size:13px;">${escapeHtml(marker.name)}</strong>
          ${tagsHtml}
          <a href="/places/${marker.id}" style="color:#6366f1;text-decoration:underline;font-size:12px;">View details →</a>
        </div>
      `);
      group.addLayer(m);
    });

    map.addLayer(group);
    groupRef.current = group;

    return () => { if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; } };
  }, [map, markers]);

  return null;
};

const POLAND_CENTER: [number, number] = [52.0, 19.0];

export const MapPage: React.FC = () => {
  const { markers, placeMarkers, visibleLayers, isLoading, error, loadAll, setVisibleLayers } = useMapStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const visibleFinds = useMemo(() => visibleLayers.finds ? markers : [], [visibleLayers.finds, markers]);
  const visiblePlaces = useMemo(() => visibleLayers.places ? placeMarkers : [], [visibleLayers.places, placeMarkers]);

  const totalVisible = visibleFinds.length + visiblePlaces.length;
  const totalAvailable = markers.length + placeMarkers.length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-6" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="card p-4 text-sm text-explorer-danger" role="alert">{error}</div>
      </div>
    );
  }

  if (totalAvailable === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 text-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-explorer-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="font-display font-semibold text-explorer-text">Nothing to show on the map</p>
        <p className="text-sm text-explorer-muted">Add GPS coordinates to your finds or places to see them here.</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="absolute top-4 left-4 z-[1000] card p-2 flex items-center gap-1 shadow-explorer">
        <LayerToggle
          active={visibleLayers.finds}
          color={FIND_PIN_COLOR}
          label="Finds"
          count={markers.length}
          onClick={() => setVisibleLayers({ finds: !visibleLayers.finds })}
        />
        <LayerToggle
          active={visibleLayers.places}
          color={PLACE_PIN_COLOR}
          label="Places"
          count={placeMarkers.length}
          onClick={() => setVisibleLayers({ places: !visibleLayers.places })}
        />
      </div>

      <MapContainer center={POLAND_CENTER} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FindClusters markers={visibleFinds} />
        <PlaceClusters markers={visiblePlaces} />
      </MapContainer>

      {totalVisible === 0 && totalAvailable > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] card px-4 py-2 text-sm text-explorer-muted">
          All layers hidden — toggle one above.
        </div>
      )}
    </div>
  );
};

interface LayerToggleProps {
  active: boolean;
  color: string;
  label: string;
  count: number;
  onClick: () => void;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ active, color, label, count, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-explorer-hover text-explorer-text'
          : 'text-explorer-muted hover:text-explorer-text-secondary',
      ].join(' ')}
      aria-pressed={active}
    >
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: active ? color : 'transparent', borderWidth: '1.5px', borderStyle: 'solid', borderColor: color }}
      />
      {label}
      <span className="text-xs text-explorer-muted">({count})</span>
    </button>
  );
};
