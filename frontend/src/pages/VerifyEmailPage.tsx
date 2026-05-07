import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { apiFetch, ApiRequestError } from '../services/api';

type VerifyStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const calledRef = React.useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setErrorMessage('No verification token found. Please check the link in your email.');
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await apiFetch<{ message: string }>(`/auth/verify?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        if (err instanceof ApiRequestError) {
          if (err.status === 400 || err.status === 401 || err.status === 404) {
            setErrorMessage('This verification link is invalid or has expired.');
          } else {
            setErrorMessage(err.message);
          }
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
        setStatus('error');
      }
    };

    void verify();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-explorer-text-secondary">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-explorer-success/10 text-explorer-success flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-bold text-explorer-text mb-2">Email verified!</h1>
            <p className="text-sm text-explorer-text-secondary mb-1">Your account has been activated.</p>
            <p className="text-xs text-explorer-muted">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-explorer-danger/10 text-explorer-danger flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-explorer-text mb-2">Verification failed</h1>
          <p className="text-sm text-explorer-text-secondary mb-6" role="alert">{errorMessage}</p>
          <Link to="/login" className="text-sm text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
            Go to sign in →
          </Link>
        </div>
      </div>
    </div>
  );
};
