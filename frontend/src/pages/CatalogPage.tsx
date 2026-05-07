import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFindsStore } from '../stores/findsStore';
import { FindCard } from '../components/finds/FindCard';
import { Button, Input, Select, Spinner, Pagination } from '../components/ui';
import type { FindSortBy, SortOrder } from '../types';

const SORT_BY_OPTIONS: { value: FindSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'discoveryDate', label: 'Discovery date' },
  { value: 'name', label: 'Name' },
];

const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { finds, pagination, query, isLoading, error, setQuery, loadFinds } = useFindsStore();
  const [searchInput, setSearchInput] = useState(query.search ?? '');

  useEffect(() => {
    loadFinds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery({ search: searchInput || undefined, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery({ sortBy: e.target.value as FindSortBy, page: 1 });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery({ sortOrder: e.target.value as SortOrder, page: 1 });
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-explorer-text">My Finds</h1>
          {pagination && (
            <p className="text-sm text-explorer-muted mt-0.5">
              {pagination.total} {pagination.total === 1 ? 'find' : 'finds'} in your catalog
            </p>
          )}
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/finds/new')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add find
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-6">
        <div className="flex-1">
          <Input
            id="catalog-search"
            placeholder="Search by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            id="catalog-sort-by"
            options={SORT_BY_OPTIONS}
            value={query.sortBy ?? 'createdAt'}
            onChange={handleSortByChange}
          />
        </div>
        <div className="w-full sm:w-36">
          <Select
            id="catalog-sort-order"
            options={SORT_ORDER_OPTIONS}
            value={query.sortOrder ?? 'desc'}
            onChange={handleSortOrderChange}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-explorer-danger mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => loadFinds()}>Try again</Button>
        </div>
      ) : finds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-explorer-surface border border-explorer-border flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-explorer-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="font-display font-semibold text-explorer-text mb-1">
            {query.search ? 'No results found' : 'No finds yet'}
          </p>
          <p className="text-sm text-explorer-muted mb-6">
            {query.search
              ? `No finds match "${query.search}". Try a different search.`
              : 'Add your first find to start building your catalog.'}
          </p>
          {!query.search && (
            <Link
              to="/finds/new"
              className="inline-flex items-center gap-2 bg-explorer-accent hover:bg-explorer-accent-hover text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add your first find
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Finds list">
            {finds.map((find) => (
              <li key={find.id}>
                <FindCard find={find} />
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
