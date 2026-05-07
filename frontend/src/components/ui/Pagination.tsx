import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

function getVisiblePages(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
  if (end - start < MAX_VISIBLE_PAGES - 1) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }
  const pages: (number | '...')[] = [];
  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-accent disabled:opacity-30 disabled:cursor-not-allowed text-explorer-text-secondary hover:bg-explorer-hover hover:text-explorer-text"
      >
        ←
      </button>
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return <span key={`e-${index}`} className="px-2 text-explorer-muted text-sm">…</span>;
        }
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'min-w-[2rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-accent',
              isActive
                ? 'bg-explorer-accent text-white'
                : 'text-explorer-text-secondary hover:bg-explorer-hover hover:text-explorer-text',
            ].join(' ')}
          >
            {page}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-explorer-accent disabled:opacity-30 disabled:cursor-not-allowed text-explorer-text-secondary hover:bg-explorer-hover hover:text-explorer-text"
      >
        →
      </button>
    </nav>
  );
};
