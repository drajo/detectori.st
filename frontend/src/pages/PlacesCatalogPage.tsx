import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlacesStore } from '../stores/placesStore';
import { PlaceCard } from '../components/places/PlaceCard';
import { Button, Input, Select, Spinner, Pagination } from '../components/ui';
import type { PlaceSortBy } from '../types';

const SORT_BY_OPTIONS: { value: PlaceSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'name', label: 'Name' },
];

const SORT_ORDER_OPTIONS: { value: 'asc' | 'desc'; label: string }[] = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

export const PlacesCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { places, pagination, query, tags, isLoading, error, setQuery, loadPlaces, loadTags } = usePlacesStore();
  const [searchInput, setSearchInput] = useState(query.search ?? '');

  useEffect(() => {
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery({ search: searchInput || undefined, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery({ sortBy: e.target.value as PlaceSortBy, page: 1 });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery({ sortOrder: e.target.value as 'asc' | 'desc', page: 1 });
  };

  const handleTagFilter = (tag: string | undefined) => {
    setQuery({ tag, page: 1 });
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
  const activeTag = query.tag;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-explorer-text">Places</h1>
          {pagination && (
            <p className="text-sm text-explorer-muted mt-0.5">
              {pagination.total} {pagination.total === 1 ? 'place' : 'places'} in your search list
            </p>
          )}
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/places/new')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add place
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-4">
        <div className="flex-1">
          <Input
            id="places-search"
            placeholder="Search by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            id="places-sort-by"
            options={SORT_BY_OPTIONS}
            value={query.sortBy ?? 'createdAt'}
            onChange={handleSortByChange}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            id="places-sort-order"
            options={SORT_ORDER_OPTIONS}
            value={query.sortOrder ?? 'desc'}
            onChange={handleSortOrderChange}
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            type="button"
            onClick={() => handleTagFilter(undefined)}
            className={[
              'rounded-md text-xs font-medium px-2 py-1 transition-colors',
              !activeTag
                ? 'bg-explorer-accent text-white'
                : 'bg-explorer-surface text-explorer-text-secondary border border-explorer-border hover:border-explorer-accent/40',
            ].join(' ')}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagFilter(activeTag === tag ? undefined : tag)}
              className={[
                'rounded-md text-xs font-medium px-2 py-1 transition-colors',
                activeTag === tag
                  ? 'bg-explorer-accent text-white'
                  : 'bg-explorer-surface text-explorer-text-secondary border border-explorer-border hover:border-explorer-accent/40',
              ].join(' ')}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-explorer-danger mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => loadPlaces()}>Try again</Button>
        </div>
      ) : places.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-explorer-surface border border-explorer-border flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-explorer-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-display font-semibold text-explorer-text mb-1">
            {query.search || activeTag ? 'No results found' : 'No places yet'}
          </p>
          <p className="text-sm text-explorer-muted mb-6">
            {query.search || activeTag
              ? 'Try adjusting your filters.'
              : 'Add a place to start planning your search trips.'}
          </p>
          {!query.search && !activeTag && (
            <Link
              to="/places/new"
              className="inline-flex items-center gap-2 bg-explorer-accent hover:bg-explorer-accent-hover text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add your first place
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Places list">
            {places.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={query.page ?? 1}
                totalPages={totalPages}
                onPageChange={(page) => setQuery({ page })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
