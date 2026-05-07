import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { CreateFindRequest, UpdateFindRequest } from '../types';
import { findsService } from '../services/findsService';
import { FindForm } from '../components/finds/FindForm';
import { ApiRequestError } from '../services/api';

export const NewFindPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateFindRequest | UpdateFindRequest) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const created = await findsService.create(data as CreateFindRequest);
      navigate(`/finds/${created.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) setApiError(err.message);
      else setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/catalog" className="text-sm text-explorer-muted hover:text-explorer-text transition-colors flex items-center gap-1 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </Link>
        <h1 className="font-display text-2xl font-bold text-explorer-text">Add new find</h1>
      </div>

      {apiError && (
        <div className="mb-4 card p-3 text-sm text-explorer-danger border-explorer-danger/30" role="alert">
          {apiError}
        </div>
      )}

      <div className="card p-6">
        <FindForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Add find" />
      </div>
    </div>
  );
};
