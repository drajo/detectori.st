import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button } from '../components/ui';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (!username.trim()) newErrors.username = 'Username is required.';
    else if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.register({ email, username, password, confirmPassword });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 409) {
          if (err.field === 'email') setErrors({ email: 'This email address is already taken.' });
          else if (err.field === 'username') setErrors({ username: 'This username is already taken.' });
          else setErrors({ general: err.message });
        } else {
          setErrors({ general: err.message });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-explorer-success/10 text-explorer-success flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-bold text-explorer-text mb-2">Check your inbox</h1>
            <p className="text-sm text-explorer-text-secondary mb-6">
              We sent a verification link to <strong className="text-explorer-text">{email}</strong>. Click it to activate your account.
            </p>
            <Link to="/login" className="text-sm text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
              Go to sign in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4 py-8">
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
          <h1 className="font-display text-xl font-bold text-explorer-text mb-1">Create account</h1>
          <p className="text-sm text-explorer-text-secondary mb-6">Start cataloging your finds today</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input id="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required autoComplete="email" disabled={isLoading} placeholder="you@example.com" />
            <Input id="username" type="text" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} required autoComplete="username" disabled={isLoading} placeholder="your_username" />
            <Input id="password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required autoComplete="new-password" disabled={isLoading} placeholder="Min. 8 characters" />
            <Input id="confirmPassword" type="password" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} required autoComplete="new-password" disabled={isLoading} placeholder="••••••••" />

            {errors.general && (
              <p className="text-sm text-explorer-danger text-center bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">
                {errors.general}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full mt-1">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-explorer-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
              Sign in
            </Link>
          </p>
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
