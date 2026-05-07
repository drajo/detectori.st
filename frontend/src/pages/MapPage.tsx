import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { FindMapMarker } from '../types';
import { useMapStore } from '../stores/mapStore';
import { Spinner } from '../components/ui';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const ClusteredMarkers: React.FC<{ markers: FindMapMarker[] }> = ({ markers }) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterGroupRef.current) { map.removeLayer(clusterGroupRef.current); clusterGroupRef.current = null; }

    if (typeof (L as unknown as { markerClusterGroup?: unknown }).markerClusterGroup !== 'function') {
      console.error('leaflet.markercluster not loaded');
      return;
    }

    const clusterGroup = (L as unknown as { markerClusterGroup: (options?: object) => L.MarkerClusterGroup }).markerClusterGroup({
      disableClusteringAtZoom: 18,
      maxClusterRadius: 80,
    });

    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.latitude, marker.longitude]);
      leafletMarker.bindPopup(`
        <div style="min-width:160px;font-family:Inter,sans-serif;">
          ${marker.coverThumbnailUrl ? `<img src="${marker.coverThumbnailUrl}" alt="${marker.name}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ''}
          <strong style="display:block;margin-bottom:4px;color:#e2e8f0;font-size:13px;">${marker.name}</strong>
          <a href="/finds/${marker.id}" style="color:#6366f1;text-decoration:underline;font-size:12px;">View details →</a>
        </div>
      `);
      clusterGroup.addLayer(leafletMarker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => { if (clusterGroupRef.current) { map.removeLayer(clusterGroupRef.current); clusterGroupRef.current = null; } };
  }, [map, markers]);

  return null;
};

const POLAND_CENTER: [number, number] = [52.0, 19.0];

export const MapPage: React.FC = () => {
  const { markers, isLoading, error, loadMarkers } = useMapStore();

  useEffect(() => { loadMarkers(); }, [loadMarkers]);

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

  if (markers.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 text-center" style={{ height: 'calc(100vh - 4rem)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-explorer-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="font-display font-semibold text-explorer-text">No finds with location</p>
        <p className="text-sm text-explorer-muted">Add GPS coordinates to your finds to see them on the map.</p>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 4rem)' }}>
      <MapContainer center={POLAND_CENTER} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers markers={markers} />
      </MapContainer>
    </div>
  );
};
