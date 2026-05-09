import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CreatePlaceRequest, UpdatePlaceRequest } from '../../types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { TagInput } from './TagInput';
import {
  parseGoogleMapsUrl,
  parseArcanumUrl,
  parseSusudataUrl,
  parseCoordinateString,
  parseAnyCoordinateInput,
  isGoogleShortLink,
  type Coords,
} from '../../utils/coordinateParsing';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface PlaceFormProps {
  initialValues?: {
    name?: string;
    description?: string;
    tags?: string[];
    latitude?: number | null;
    longitude?: number | null;
  };
  tagSuggestions?: string[];
  onSubmit: (data: CreatePlaceRequest | UpdatePlaceRequest) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
  coords?: string;
}

type ImportField = 'google' | 'coords' | 'arcanum' | 'susudata';
type ImportStatus = { kind: 'idle' } | { kind: 'ok' } | { kind: 'error'; message: string };

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const MarkerWithCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMapEvents({});
  useEffect(() => { map.setView(position); }, [map, position]);
  return <Marker position={position} />;
};

export const PlaceForm: React.FC<PlaceFormProps> = ({
  initialValues,
  tagSuggestions = [],
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
}) => {
  const [values, setValues] = useState<FormValues>({
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    tags: initialValues?.tags ?? [],
    latitude: initialValues?.latitude != null ? String(initialValues.latitude) : '',
    longitude: initialValues?.longitude != null ? String(initialValues.longitude) : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [googleUrl, setGoogleUrl] = useState('');
  const [arcanumUrl, setArcanumUrl] = useState('');
  const [susudataUrl, setSusudataUrl] = useState('');
  const [coordsStr, setCoordsStr] = useState('');
  const [importStatus, setImportStatus] = useState<Record<ImportField, ImportStatus>>({
    google: { kind: 'idle' },
    coords: { kind: 'idle' },
    arcanum: { kind: 'idle' },
    susudata: { kind: 'idle' },
  });

  const initialKey = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify({
      name: initialValues?.name,
      description: initialValues?.description,
      tags: initialValues?.tags,
      latitude: initialValues?.latitude,
      longitude: initialValues?.longitude,
    });
    if (key === initialKey.current) return;
    initialKey.current = key;
    if (initialValues) {
      setValues({
        name: initialValues.name ?? '',
        description: initialValues.description ?? '',
        tags: initialValues.tags ?? [],
        latitude: initialValues.latitude != null ? String(initialValues.latitude) : '',
        longitude: initialValues.longitude != null ? String(initialValues.longitude) : '',
      });
    }
  }, [initialValues]);

  const setCoords = (lat: number, lng: number) => {
    setValues((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      delete next.coords;
      return next;
    });
  };

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
    setCoords(roundedLat, roundedLng);
  };

  const tryImport = (field: ImportField, raw: string) => {
    if (!raw.trim()) {
      setImportStatus((s) => ({ ...s, [field]: { kind: 'idle' } }));
      return;
    }
    let parsed: Coords | null = null;
    let errorMsg = 'Could not parse this input.';

    if (field === 'google') {
      if (isGoogleShortLink(raw)) {
        errorMsg = 'Short links (maps.app.goo.gl) cannot be parsed in the browser. Open the link, then copy the URL containing @lat,lng from the address bar.';
      } else {
        parsed = parseGoogleMapsUrl(raw);
      }
    } else if (field === 'arcanum') {
      parsed = parseArcanumUrl(raw);
    } else if (field === 'susudata') {
      parsed = parseSusudataUrl(raw);
    } else if (field === 'coords') {
      parsed = parseCoordinateString(raw);
      if (!parsed) {
        // Spróbuj liberalnego parsera (jeśli ktoś wkleił URL przez pomyłkę)
        parsed = parseAnyCoordinateInput(raw);
      }
    }

    if (parsed) {
      setCoords(parsed.lat, parsed.lng);
      setImportStatus((s) => ({ ...s, [field]: { kind: 'ok' } }));
    } else {
      setImportStatus((s) => ({ ...s, [field]: { kind: 'error', message: errorMsg } }));
    }
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
    const data: CreatePlaceRequest | UpdatePlaceRequest = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      tags: values.tags,
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
      <Input
        id="place-name"
        label="Name"
        required
        value={values.name}
        onChange={handleChange('name')}
        error={errors.name}
        disabled={isLoading}
        placeholder="e.g. Old farm field"
      />
      <Textarea
        id="place-description"
        label="Description"
        value={values.description}
        onChange={handleChange('description')}
        disabled={isLoading}
        placeholder="Optional description, notes, history..."
        rows={3}
      />

      <TagInput
        id="place-tags"
        label="Tags"
        value={values.tags}
        onChange={(tags) => setValues((p) => ({ ...p, tags }))}
        suggestions={tagSuggestions}
        disabled={isLoading}
      />

      <div>
        <p className="text-sm font-medium text-explorer-text-secondary mb-1">
          Location <span className="text-explorer-muted font-normal">(optional)</span>
        </p>
        <p className="text-xs text-explorer-muted mb-3">
          Click on the map, paste a link from Google Maps or Arcanum, or paste coordinates as <code className="font-mono">"lat, lng"</code>.
        </p>

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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Input id="place-latitude" label="Latitude" type="number" value={values.latitude} onChange={handleChange('latitude')} error={errors.latitude} disabled={isLoading} placeholder="-90 to 90" min={-90} max={90} step="any" />
          <Input id="place-longitude" label="Longitude" type="number" value={values.longitude} onChange={handleChange('longitude')} error={errors.longitude} disabled={isLoading} placeholder="-180 to 180" min={-180} max={180} step="any" />
        </div>
        {errors.coords && <p className="mb-3 text-xs text-explorer-danger" role="alert">{errors.coords}</p>}

        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-explorer-border bg-explorer-bg/40 p-3">
          <p className="text-xs font-medium text-explorer-text-secondary uppercase tracking-wide">Import location</p>
          <ImportField
            id="place-import-google"
            label="Google Maps URL"
            placeholder="https://www.google.com/maps/@53.022,18.607,..."
            value={googleUrl}
            status={importStatus.google}
            disabled={isLoading}
            onChange={(v) => { setGoogleUrl(v); setImportStatus((s) => ({ ...s, google: { kind: 'idle' } })); }}
            onResolve={(v) => tryImport('google', v)}
          />
          <ImportField
            id="place-import-coords"
            label="Coordinates string"
            placeholder="53.020947, 18.615295"
            value={coordsStr}
            status={importStatus.coords}
            disabled={isLoading}
            onChange={(v) => { setCoordsStr(v); setImportStatus((s) => ({ ...s, coords: { kind: 'idle' } })); }}
            onResolve={(v) => tryImport('coords', v)}
          />
          <ImportField
            id="place-import-arcanum"
            label="Arcanum maps URL"
            placeholder="https://maps.arcanum.com/en/map/.../?bbox=..."
            value={arcanumUrl}
            status={importStatus.arcanum}
            disabled={isLoading}
            onChange={(v) => { setArcanumUrl(v); setImportStatus((s) => ({ ...s, arcanum: { kind: 'idle' } })); }}
            onResolve={(v) => tryImport('arcanum', v)}
          />
          <ImportField
            id="place-import-susudata"
            label="Susudata URL (Messtischblätter)"
            placeholder="https://www.susudata.de/messtisch/tk25.html?lat=...&lng=..."
            value={susudataUrl}
            status={importStatus.susudata}
            disabled={isLoading}
            onChange={(v) => { setSusudataUrl(v); setImportStatus((s) => ({ ...s, susudata: { kind: 'idle' } })); }}
            onResolve={(v) => tryImport('susudata', v)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>{submitLabel}</Button>
      </div>
    </form>
  );
};

interface ImportFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  status: ImportStatus;
  disabled: boolean;
  onChange: (v: string) => void;
  onResolve: (v: string) => void;
}

const ImportField: React.FC<ImportFieldProps> = ({ id, label, placeholder, value, status, disabled, onChange, onResolve }) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-explorer-text-secondary">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (text) {
              // pozwól reactowi zaktualizować input, potem parsuj
              setTimeout(() => onResolve(text), 0);
            }
          }}
          onBlur={() => onResolve(value)}
          className={[
            'w-full rounded-lg border bg-explorer-surface text-sm text-explorer-text placeholder-explorer-muted px-3 py-2 pr-9 transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-accent/30',
            status.kind === 'ok' ? 'border-explorer-success focus:border-explorer-success' :
            status.kind === 'error' ? 'border-explorer-danger focus:border-explorer-danger' :
            'border-explorer-border focus:border-explorer-accent',
          ].join(' ')}
        />
        {status.kind === 'ok' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-explorer-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status.kind === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-explorer-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
          </svg>
        )}
      </div>
      {status.kind === 'error' && (
        <p className="text-xs text-explorer-danger" role="alert">{status.message}</p>
      )}
    </div>
  );
};
