import React, { useState } from 'react';
import { buildSusudataUrl } from '../../utils/coordinateParsing';

interface SusudataEmbedProps {
  latitude: number;
  longitude: number;
  markerLabel?: string;
}

export const SusudataEmbed: React.FC<SusudataEmbedProps> = ({ latitude, longitude, markerLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const url = buildSusudataUrl(latitude, longitude, markerLabel);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center justify-between gap-2 text-sm text-explorer-accent hover:text-explorer-accent-hover transition-colors w-full rounded-lg border border-explorer-border bg-explorer-bg/40 px-3 py-2"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          {isOpen ? 'Hide historical map preview' : 'Show historical map (Messtischblätter)'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={['h-4 w-4 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="rounded-xl overflow-hidden border border-explorer-border bg-black" style={{ height: '420px' }}>
          <iframe
            src={url}
            title="Susudata historical map preview"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      )}
    </div>
  );
};
