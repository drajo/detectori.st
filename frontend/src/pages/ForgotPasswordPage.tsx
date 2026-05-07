import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button } from '../components/ui';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: { email?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSuccessMessage('If an account with that email exists, we\'ve sent a password reset link.');
    } catch (err) {
      if (err instanceof ApiRequestError) setErrors({ general: err.message });
      else setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-explorer-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="font-display font-bold text-explorer-text text-xl">Detectorist</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-xl font-bold text-explorer-text mb-1">Reset password</h1>
          <p className="text-sm text-explorer-text-secondary mb-6">Enter your email and we'll send you a reset link.</p>

          {successMessage ? (
            <div className="text-center">
              <p className="text-sm text-explorer-success bg-explorer-success/10 rounded-lg px-4 py-3 mb-4" role="status">
                {successMessage}
              </p>
              <Link to="/login" className="text-sm text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
                Back to sign in →
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input id="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required autoComplete="email" disabled={isLoading} placeholder="you@example.com" />
                {errors.general && (
                  <p className="text-sm text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">{errors.general}</p>
                )}
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full mt-1">
                  Send reset link
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-explorer-muted">
                <Link to="/login" className="text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
