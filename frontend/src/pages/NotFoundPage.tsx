import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-display font-bold text-explorer-accent/20 mb-4">404</p>
        <h1 className="font-display text-2xl font-bold text-explorer-text mb-2">Page not found</h1>
        <p className="text-explorer-text-secondary mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-explorer-accent hover:bg-explorer-accent-hover text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
};
