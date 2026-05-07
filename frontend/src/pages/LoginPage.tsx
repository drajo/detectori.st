import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { ApiRequestError } from '../services/api';
import { authService } from '../services/authService';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setNeedsVerification(false);
    setResendStatus('idle');
    if (!validate()) return;
    try {
      await login({ email, password });
      navigate('/catalog');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          setErrors({ general: 'Invalid email or password.' });
        } else if (err.status === 403) {
          setErrors({ general: 'Please verify your email address before signing in.' });
          setNeedsVerification(true);
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    }
  };

  const handleResend = async () => {
    setResendStatus('sending');
    try {
      await authService.resendVerification(email);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
      setErrors({ general: 'Could not resend the activation link. Try again in a moment.' });
    }
  };

  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-explorer-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="font-display font-bold text-explorer-text text-xl">Detectorist</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-xl font-bold text-explorer-text mb-1">Welcome back</h1>
          <p className="text-sm text-explorer-text-secondary mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
              disabled={isLoading}
              placeholder="you@example.com"
            />
            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              autoComplete="current-password"
              disabled={isLoading}
              placeholder="••••••••"
            />

            {errors.general && (
              <p className="text-sm text-explorer-danger text-center bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">
                {errors.general}
              </p>
            )}

            {needsVerification && (
              resendStatus === 'sent' ? (
                <p className="text-sm text-explorer-text-secondary text-center bg-explorer-accent/10 rounded-lg px-3 py-2">
                  If the account requires verification, we've sent a new activation link. Check your inbox.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleResend}
                  isLoading={resendStatus === 'sending'}
                  disabled={resendStatus === 'sending'}
                  className="w-full"
                >
                  Resend activation link
                </Button>
              )
            )}

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            <Link to="/forgot-password" className="text-explorer-text-secondary hover:text-explorer-accent transition-colors">
              Forgot your password?
            </Link>
            <p className="text-explorer-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-explorer-muted hover:text-explorer-text transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
};
