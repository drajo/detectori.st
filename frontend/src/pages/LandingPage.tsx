import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadRecaptcha } from '../services/recaptcha';

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Catalog Your Finds',
    description: 'Document every discovery with photos, descriptions, custom attributes, and precise GPS coordinates.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: 'Interactive Map',
    description: 'Visualize all your discoveries on an interactive map with smart clustering for dense areas.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Photo Gallery',
    description: 'Upload up to 10 photos per find with automatic thumbnail generation and cover photo selection.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    title: 'Custom Attributes',
    description: 'Add unlimited key-value attributes to each find — material, era, condition, dimensions, and more.',
  },
];

const steps = [
  { number: '01', title: 'Create an account', description: 'Sign up for free and verify your email address.' },
  { number: '02', title: 'Add your finds', description: 'Log each discovery with photos, location, and details.' },
  { number: '03', title: 'Explore your collection', description: 'Browse your catalog and view finds on the map.' },
];

export const LandingPage: React.FC = () => {
  useEffect(() => {
    loadRecaptcha().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-explorer-bg text-explorer-text">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-explorer-border bg-explorer-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-explorer-accent flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-explorer-text text-lg">Detectorist</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-explorer-text-secondary hover:text-explorer-text transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-explorer-accent hover:bg-explorer-accent-hover text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-explorer-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-explorer-surface border border-explorer-border rounded-full px-4 py-1.5 text-xs text-explorer-text-secondary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-explorer-success animate-pulse" />
            Built for metal detecting enthusiasts
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold text-explorer-text leading-tight mb-6">
            Your metal detecting{' '}
            <span className="text-explorer-accent">finds catalog</span>
          </h1>

          <p className="text-lg text-explorer-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Document, organize, and explore your metal detecting discoveries.
            Track locations, upload photos, and build your personal collection database.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-explorer-accent hover:bg-explorer-accent-hover text-white font-medium px-8 py-3 rounded-xl transition-all shadow-explorer text-base"
            >
              Start cataloging for free
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-explorer-surface hover:bg-explorer-hover border border-explorer-border text-explorer-text font-medium px-8 py-3 rounded-xl transition-all text-base"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-explorer-text mb-4">
              Everything you need to track your finds
            </h2>
            <p className="text-explorer-text-secondary max-w-xl mx-auto">
              A complete toolkit for serious metal detectorists to document and manage their discoveries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 hover:border-explorer-accent/40 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-explorer-accent/10 text-explorer-accent flex items-center justify-center mb-4 group-hover:bg-explorer-accent/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-explorer-text mb-2">{feature.title}</h3>
                <p className="text-sm text-explorer-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 border-t border-explorer-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-explorer-text mb-4">How it works</h2>
            <p className="text-explorer-text-secondary">Get started in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-explorer-border" />
                )}
                <div className="w-12 h-12 rounded-full bg-explorer-surface border-2 border-explorer-accent text-explorer-accent font-display font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-display font-semibold text-explorer-text mb-2">{step.title}</h3>
                <p className="text-sm text-explorer-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-explorer-accent/5 pointer-events-none" />
            <h2 className="font-display text-3xl font-bold text-explorer-text mb-4 relative">
              Ready to start cataloging?
            </h2>
            <p className="text-explorer-text-secondary mb-8 relative">
              Join detectorists who use Detectorist to document their discoveries.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-explorer-accent hover:bg-explorer-accent-hover text-white font-medium px-8 py-3 rounded-xl transition-all shadow-explorer relative"
            >
              Create free account
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-explorer-border py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-explorer-accent flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-explorer-text">Detectorist</span>
          </div>
          <p className="text-xs text-explorer-muted">
            © {new Date().getFullYear()} Detectorist. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/login" className="text-xs text-explorer-muted hover:text-explorer-text transition-colors">Sign in</Link>
            <Link to="/register" className="text-xs text-explorer-muted hover:text-explorer-text transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
