import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CreateFindRequest, UpdateFindRequest } from '../../types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface FindFormProps {
  initialValues?: {
    name?: string;
    description?: string;
    discoveryDate?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  onSubmit: (data: CreateFindRequest | UpdateFindRequest) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

interface FormValues {
  name: string;
  description: string;
  discoveryDate: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
  coords?: string;
}

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const MarkerWithCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMapEvents({});
  useEffect(() => { map.setView(position); }, [map, position]);
  return <Marker position={position} />;
};

export const FindForm: React.FC<FindFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
}) => {
  const [values, setValues] = useState<FormValues>({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    discoveryDate: initialValues?.discoveryDate ? initialValues.discoveryDate.slice(0, 10) : '',
    latitude: initialValues?.latitude != null ? String(initialValues.latitude) : '',
    longitude: initialValues?.longitude != null ? String(initialValues.longitude) : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialValues) {
      setValues({
        name: initialValues.name ?? '',
        description: initialValues.description ?? '',
        discoveryDate: initialValues.discoveryDate ? initialValues.discoveryDate.slice(0, 10) : '',
        latitude: initialValues.latitude != null ? String(initialValues.latitude) : '',
        longitude: initialValues.longitude != null ? String(initialValues.longitude) : '',
      });
    }
  }, [initialValues?.name, initialValues?.description, initialValues?.discoveryDate, initialValues?.latitude, initialValues?.longitude]);

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'name') delete next.name;
      if (field === 'latitude') { delete next.latitude; delete next.coords; }
      if (field === 'longitude') { delete next.longitude; delete next.coords; }
      return next;
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    const roundedLat = Math.round(lat * 1e6) / 1e6;
    const roundedLng = Math.round(lng * 1e6) / 1e6;
    setValues((prev) => ({ ...prev, latitude: String(roundedLat), longitude: String(roundedLng) }));
    setErrors((prev) => { const next = { ...prev }; delete next.latitude; delete next.longitude; delete next.coords; return next; });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!values.name.trim()) newErrors.name = 'Name is required.';
    const latFilled = values.latitude.trim() !== '';
    const lngFilled = values.longitude.trim() !== '';
    if (latFilled && !lngFilled) newErrors.coords = 'Please also enter longitude, or clear latitude.';
    else if (!latFilled && lngFilled) newErrors.coords = 'Please also enter latitude, or clear longitude.';
    if (latFilled) {
      const lat = parseFloat(values.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) newErrors.latitude = 'Latitude must be between -90 and 90.';
    }
    if (lngFilled) {
      const lng = parseFloat(values.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) newErrors.longitude = 'Longitude must be between -180 and 180.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const lat = values.latitude.trim() !== '' ? parseFloat(values.latitude) : undefined;
    const lng = values.longitude.trim() !== '' ? parseFloat(values.longitude) : undefined;
    const data: CreateFindRequest | UpdateFindRequest = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      discoveryDate: values.discoveryDate
        ? new Date(values.discoveryDate + 'T12:00:00.000Z').toISOString()
        : undefined,
      latitude: lat,
      longitude: lng,
    };
    await onSubmit(data);
  };

  const lat = values.latitude.trim() !== '' ? parseFloat(values.latitude) : null;
  const lng = values.longitude.trim() !== '' ? parseFloat(values.longitude) : null;
  const hasValidCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  const mapCenter: [number, number] = hasValidCoords ? [lat!, lng!] : [52.0, 19.0];
  const mapZoom = hasValidCoords ? 10 : 6;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Input id="find-name" label="Name" required value={values.name} onChange={handleChange('name')} error={errors.name} disabled={isLoading} placeholder="e.g. Roman coin" />
      <Textarea id="find-description" label="Description" value={values.description} onChange={handleChange('description')} disabled={isLoading} placeholder="Optional description..." rows={3} />
      <Input id="find-discovery-date" label="Discovery date" type="date" value={values.discoveryDate} onChange={handleChange('discoveryDate')} disabled={isLoading} />

      <div>
        <p className="text-sm font-medium text-explorer-text-secondary mb-1">
          Location <span className="text-explorer-muted font-normal">(optional)</span>
        </p>
        <p className="text-xs text-explorer-muted mb-3">Click on the map to set location, or enter coordinates manually.</p>

        <div className="mb-3 rounded-xl overflow-hidden border border-explorer-border" style={{ height: '280px' }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {hasValidCoords && <MarkerWithCenter position={[lat!, lng!]} />}
          </MapContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input id="find-latitude" label="Latitude" type="number" value={values.latitude} onChange={handleChange('latitude')} error={errors.latitude} disabled={isLoading} placeholder="-90 to 90" min={-90} max={90} step="any" />
          <Input id="find-longitude" label="Longitude" type="number" value={values.longitude} onChange={handleChange('longitude')} error={errors.longitude} disabled={isLoading} placeholder="-180 to 180" min={-180} max={180} step="any" />
        </div>
        {errors.coords && <p className="mt-1 text-xs text-explorer-danger" role="alert">{errors.coords}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
};
