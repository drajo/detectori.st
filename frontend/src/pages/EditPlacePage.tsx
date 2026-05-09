import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Place, UpdatePlaceRequest, CreatePlaceRequest } from '../types';
import { placesService } from '../services/placesService';
import { PlaceForm } from '../components/places/PlaceForm';
import { ApiRequestError } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { usePlacesStore } from '../stores/placesStore';

export const EditPlacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tags, loadTags } = usePlacesStore();

  const [place, setPlace] = useState<Place | null>(null);
  const [isLoadingPlace, setIsLoadingPlace] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => { loadTags(); }, [loadTags]);

  useEffect(() => {
    if (!id) return;
    setIsLoadingPlace(true);
    placesService.getById(id)
      .then((data) => setPlace(data))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setLoadError('Place not found.');
        else setLoadError('Failed to load place. Please try again.');
      })
      .finally(() => setIsLoadingPlace(false));
  }, [id]);

  const handleSubmit = async (data: CreatePlaceRequest | UpdatePlaceRequest) => {
    if (!id) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await placesService.update(id, data as UpdatePlaceRequest);
      navigate(`/places/${id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setApiError(err.message);
      else setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPlace) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !place) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-6 text-center">
          <p className="text-explorer-danger mb-4">{loadError ?? 'Place not found.'}</p>
          <Link to="/places" className="text-sm text-explorer-accent hover:text-explorer-accent-hover transition-colors">
            ← Back to places
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to={`/places/${id}`} className="text-sm text-explorer-muted hover:text-explorer-text transition-colors flex items-center gap-1 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to place
        </Link>
        <h1 className="font-display text-2xl font-bold text-explorer-text">Edit place</h1>
      </div>

      {apiError && (
        <div className="mb-4 card p-3 text-sm text-explorer-danger border-explorer-danger/30" role="alert">
          {apiError}
        </div>
      )}

      <div className="card p-6">
        <PlaceForm
          initialValues={{
            name: place.name,
            description: place.description ?? '',
            tags: place.tags,
            latitude: place.latitude,
            longitude: place.longitude,
          }}
          tagSuggestions={tags}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
};
