import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Find, FindPhoto, FindAttribute } from '../types';
import { findsService } from '../services/findsService';
import { ApiRequestError } from '../services/api';
import { Button, Modal, Spinner } from '../components/ui';
import { PhotoUploader } from '../components/finds/PhotoUploader';
import { AttributeManager } from '../components/finds/AttributeManager';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const FindDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [find, setFind] = useState<Find | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    findsService.getById(id)
      .then((data) => setFind(data))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setIsNotFound(true);
        else setLoadError(err instanceof ApiRequestError ? err.message : 'Failed to load find.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await findsService.delete(id);
      navigate('/catalog');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'Failed to delete find.');
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center py-24"><Spinner size="lg" /></div>;

  if (isNotFound) return (
    <div className="p-6 max-w-2xl mx-auto text-center py-24">
      <p className="font-display text-xl font-semibold text-explorer-text mb-2">Find not found</p>
      <Link to="/catalog" className="text-sm text-explorer-accent hover:text-explorer-accent-hover transition-colors">← Back to catalog</Link>
    </div>
  );

  if (loadError) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="card p-4 text-sm text-explorer-danger" role="alert">{loadError}</div>
    </div>
  );

  if (!find) return null;

  const hasCoords = find.latitude !== null && find.longitude !== null;
  const mapPosition: [number, number] | null = hasCoords ? [find.latitude as number, find.longitude as number] : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <Link to="/catalog" className="text-sm text-explorer-muted hover:text-explorer-text transition-colors flex items-center gap-1 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            My Finds
          </Link>
          <h1 className="font-display text-2xl font-bold text-explorer-text">{find.name}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/finds/${find.id}/edit`)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Photos */}
          <section className="card p-5">
            <h2 className="font-display font-semibold text-explorer-text mb-4">Photos</h2>
            <PhotoUploader
              findId={find.id}
              photos={find.photos}
              onPhotosChange={(photos: FindPhoto[]) => setFind({ ...find, photos })}
            />
          </section>

          {/* Attributes */}
          <section className="card p-5">
            <h2 className="font-display font-semibold text-explorer-text mb-4">Attributes</h2>
            <AttributeManager
              findId={find.id}
              attributes={find.attributes}
              onAttributesChange={(attributes: FindAttribute[]) => setFind({ ...find, attributes })}
            />
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Details */}
          <section className="card p-5">
            <h2 className="font-display font-semibold text-explorer-text mb-4">Details</h2>
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-xs font-medium text-explorer-muted uppercase tracking-wide">Discovery date</dt>
                <dd className="text-sm text-explorer-text mt-0.5">{formatDate(find.discoveryDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-explorer-muted uppercase tracking-wide">Added</dt>
                <dd className="text-sm text-explorer-text mt-0.5">{formatDate(find.createdAt)}</dd>
              </div>
              {find.description && (
                <div>
                  <dt className="text-xs font-medium text-explorer-muted uppercase tracking-wide">Description</dt>
                  <dd className="text-sm text-explorer-text mt-0.5 whitespace-pre-wrap">{find.description}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Location */}
          {mapPosition && (
            <section className="card p-5">
              <h2 className="font-display font-semibold text-explorer-text mb-3">Location</h2>
              <div className="flex gap-4 mb-3 text-xs">
                <div>
                  <span className="text-explorer-muted">Lat: </span>
                  <span className="text-explorer-text font-mono">{find.latitude}</span>
                </div>
                <div>
                  <span className="text-explorer-muted">Lng: </span>
                  <span className="text-explorer-text font-mono">{find.longitude}</span>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-explorer-border" style={{ height: '180px' }}>
                <MapContainer center={mapPosition} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} attributionControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapPosition} />
                </MapContainer>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Delete modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { if (!isDeleting) setIsDeleteModalOpen(false); }} title="Delete find">
        <p className="text-sm text-explorer-text-secondary mb-4">
          Are you sure you want to delete <strong className="text-explorer-text">"{find.name}"</strong>? This action cannot be undone.
        </p>
        {deleteError && <div className="mb-4 text-sm text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">{deleteError}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting} disabled={isDeleting}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};
