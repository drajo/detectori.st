import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFindsStore } from '../stores/findsStore';
import { FindCard } from '../components/finds/FindCard';
import { Button, Input, Select, Spinner, Pagination } from '../components/ui';
import type { FindSortBy, SortOrder, FindListItem } from '../types';

const SORT_BY_OPTIONS: { value: FindSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Date added' },
  { value: 'discoveryDate', label: 'Discovery date' },
  { value: 'name', label: 'Name' },
];

const SORT_ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
];

const NO_VALUE_BUCKET = '__no_value__';

function groupFinds(
  finds: FindListItem[],
  groupBy: string,
): Array<{ key: string; label: string; items: FindListItem[] }> {
  const groups = new Map<string, FindListItem[]>();
  for (const find of finds) {
    const matched = find.attributes
      .filter((a) => a.key === groupBy)
      .map((a) => a.value);
    if (matched.length === 0) {
      const bucket = groups.get(NO_VALUE_BUCKET) ?? [];
      bucket.push(find);
      groups.set(NO_VALUE_BUCKET, bucket);
    } else {
      // Find pojawia się w każdej grupie której wartość ma (rzadkie, ale możliwe — wiele atrybutów o tym samym kluczu)
      for (const value of matched) {
        const bucket = groups.get(value) ?? [];
        bucket.push(find);
        groups.set(value, bucket);
      }
    }
  }
  const entries = Array.from(groups.entries())
    .filter(([key]) => key !== NO_VALUE_BUCKET)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, label: key, items }));
  const noValue = groups.get(NO_VALUE_BUCKET);
  if (noValue && noValue.length > 0) {
    entries.push({ key: NO_VALUE_BUCKET, label: '— No value —', items: noValue });
  }
  return entries;
}

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    finds, pagination, query, attrFilter, groupBy, facets,
    isLoading, error,
    setQuery, setAttrFilterValue, clearAttrFilter, setGroupBy, loadFinds, loadFacets,
  } = useFindsStore();
  const [searchInput, setSearchInput] = useState(query.search ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    loadFinds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, attrFilter, groupBy]);

  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

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

  const handleGroupByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGroupBy(e.target.value || null);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  const facetKeys = useMemo(() => Object.keys(facets).sort(), [facets]);
  const selectedCount = useMemo(
    () => Object.values(attrFilter).reduce((acc, v) => acc + v.length, 0),
    [attrFilter],
  );

  const groupBySelectOptions = useMemo(
    () => [{ value: '', label: 'No grouping' }, ...facetKeys.map((k) => ({ value: k, label: k }))],
    [facetKeys],
  );

  const groups = useMemo(() => (groupBy ? groupFinds(finds, groupBy) : null), [groupBy, finds]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-explorer-text">My Finds</h1>
          {pagination && !groupBy && (
            <p className="text-sm text-explorer-muted mt-0.5">
              {pagination.total} {pagination.total === 1 ? 'find' : 'finds'} in your catalog
            </p>
          )}
          {groupBy && (
            <p className="text-sm text-explorer-muted mt-0.5">
              Grouped by <span className="text-explorer-accent">{groupBy}</span> · {finds.length} loaded
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

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-3">
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
        <div className="w-full sm:w-44">
          <Select
            id="catalog-group-by"
            options={groupBySelectOptions}
            value={groupBy ?? ''}
            onChange={handleGroupByChange}
          />
        </div>
      </div>

      {/* Filters toggle + chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          disabled={facetKeys.length === 0}
          className={[
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
            facetKeys.length === 0
              ? 'border-explorer-border text-explorer-muted cursor-not-allowed'
              : 'border-explorer-border text-explorer-text-secondary hover:text-explorer-text hover:border-explorer-accent/40',
            filtersOpen ? 'bg-explorer-accent/10 text-explorer-accent border-explorer-accent/40' : '',
          ].join(' ')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Attribute filter
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-explorer-accent text-white text-[10px] font-semibold">
              {selectedCount}
            </span>
          )}
        </button>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={clearAttrFilter}
            className="text-xs text-explorer-muted hover:text-explorer-danger transition-colors"
          >
            Clear all
          </button>
        )}
        {Object.entries(attrFilter).map(([key, values]) =>
          values.map((v) => (
            <span
              key={`${key}:${v}`}
              className="inline-flex items-center gap-1 rounded-md bg-explorer-accent/10 text-explorer-accent text-xs font-medium px-2 py-1"
            >
              <span className="text-explorer-text-secondary">{key}:</span>
              {v}
              <button
                type="button"
                onClick={() => setAttrFilterValue(key, v, false)}
                aria-label={`Remove filter ${key}=${v}`}
                className="hover:text-explorer-danger transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )),
        )}
      </div>

      {/* Filters panel */}
      {filtersOpen && facetKeys.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facetKeys.map((key) => (
              <div key={key}>
                <h3 className="text-xs font-semibold text-explorer-text-secondary uppercase tracking-wide mb-2">{key}</h3>
                <ul className="flex flex-col gap-1.5 max-h-48 overflow-auto pr-2">
                  {facets[key].map((facet) => {
                    const isChecked = (attrFilter[key] ?? []).includes(facet.value);
                    return (
                      <li key={facet.value}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-explorer-text transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setAttrFilterValue(key, facet.value, e.target.checked)}
                            className="rounded border-explorer-border bg-explorer-bg accent-explorer-accent"
                          />
                          <span className="flex-1 text-explorer-text-secondary truncate">{facet.value}</span>
                          <span className="text-xs text-explorer-muted">{facet.count}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {query.search || selectedCount > 0 ? 'No results found' : 'No finds yet'}
          </p>
          <p className="text-sm text-explorer-muted mb-6">
            {query.search || selectedCount > 0
              ? 'Try adjusting your search or filters.'
              : 'Add your first find to start building your catalog.'}
          </p>
          {!query.search && selectedCount === 0 && (
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
      ) : groups ? (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="font-display font-semibold text-explorer-text mb-3 flex items-center gap-2">
                {group.label}
                <span className="text-xs text-explorer-muted font-normal">({group.items.length})</span>
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`Finds with ${groupBy}=${group.label}`}>
                {group.items.map((find) => (
                  <li key={`${group.key}-${find.id}`}>
                    <FindCard find={find} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
