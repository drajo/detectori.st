import React from 'react';
import { Link } from 'react-router-dom';
import type { PlaceListItem } from '../../types';

interface PlaceCardProps {
  place: PlaceListItem;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  return (
    <Link
      to={`/places/${place.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-explorer-border bg-explorer-surface hover:border-explorer-accent/40 transition-all shadow-explorer-sm hover:shadow-explorer focus:outline-none focus:ring-2 focus:ring-explorer-accent focus:ring-offset-2 focus:ring-offset-explorer-bg"
      aria-label={`Place: ${place.name}`}
    >
      <div className="relative h-44 w-full overflow-hidden bg-explorer-bg">
        {place.coverPhoto ? (
          <img
            src={place.coverPhoto.thumbnailUrl}
            alt={`Photo of ${place.name}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-explorer-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        {place.latitude !== null && place.longitude !== null && (
          <div className="absolute top-2 right-2 bg-explorer-bg/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-explorer-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-explorer-text-secondary">GPS</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display font-semibold text-explorer-text group-hover:text-explorer-accent transition-colors truncate">
          {place.name}
        </h3>
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-explorer-accent/10 text-explorer-accent text-[10px] font-medium px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
            {place.tags.length > 4 && (
              <span className="text-[10px] text-explorer-muted px-1">+{place.tags.length - 4}</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1 text-xs text-explorer-muted mt-auto">
          <span>Added: {formatDate(place.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};
