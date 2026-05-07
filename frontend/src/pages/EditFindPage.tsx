import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Find, UpdateFindRequest, CreateFindRequest } from '../types';
import { findsService } from '../services/findsService';
import { FindForm } from '../components/finds/FindForm';
import { ApiRequestError } from '../services/api';
import { Spinner } from '../components/ui/Spinner';

export const EditFindPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [find, setFind] = useState<Find | null>(null);
  const [isLoadingFind, setIsLoadingFind] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoadingFind(true);
    findsService.getById(id)
      .then((data) => setFind(data))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) setLoadError('Find not found.');
        else setLoadError('Failed to load find. Please try again.');
      })
      .finally(() => setIsLoadingFind(false));
  }, [id]);

  const handleSubmit = async (data: CreateFindRequest | UpdateFindRequest) => {
    if (!id) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await findsService.update(id, data as UpdateFindRequest);
      navigate(`/finds/${id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setApiError(err.message);
      else setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingFind) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError || !find) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-6 text-center">
          <p className="text-explorer-danger mb-4">{loadError ?? 'Find not found.'}</p>
          <Link to="/catalog" className="text-sm text-explorer-accent hover:text-explorer-accent-hover transition-colors">
            ← Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to={`/finds/${id}`} className="text-sm text-explorer-muted hover:text-explorer-text transition-colors flex items-center gap-1 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to find
        </Link>
        <h1 className="font-display text-2xl font-bold text-explorer-text">Edit find</h1>
      </div>

      {apiError && (
        <div className="mb-4 card p-3 text-sm text-explorer-danger border-explorer-danger/30" role="alert">
          {apiError}
        </div>
      )}

      <div className="card p-6">
        <FindForm
          initialValues={{
            name: find.name,
            description: find.description ?? '',
            discoveryDate: find.discoveryDate ?? '',
            latitude: find.latitude,
            longitude: find.longitude,
          }}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
};
