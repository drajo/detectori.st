import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input, Button } from '../components/ui';
import { authService } from '../services/authService';
import { ApiRequestError } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmNewPassword?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!newPassword) newErrors.newPassword = 'Password is required.';
    else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters.';
    if (!confirmNewPassword) newErrors.confirmNewPassword = 'Please confirm your password.';
    else if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!token) return;
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, newPassword, confirmNewPassword });
      setSuccessMessage('Your password has been reset. You can now sign in.');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) setErrors({ general: 'This reset link is invalid or has expired.' });
        else setErrors({ general: err.message });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center">
            <h1 className="font-display text-xl font-bold text-explorer-text mb-2">Invalid link</h1>
            <p className="text-sm text-explorer-danger mb-4" role="alert">This password reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="text-sm text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
              Request a new reset link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-explorer-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <h1 className="font-display text-xl font-bold text-explorer-text mb-1">Set new password</h1>
          <p className="text-sm text-explorer-text-secondary mb-6">Choose a strong password for your account.</p>

          {successMessage ? (
            <div className="text-center">
              <p className="text-sm text-explorer-success bg-explorer-success/10 rounded-lg px-4 py-3 mb-4" role="status">{successMessage}</p>
              <Link to="/login" className="text-sm text-explorer-accent hover:text-explorer-accent-hover font-medium transition-colors">
                Go to sign in →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input id="newPassword" type="password" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.newPassword} required autoComplete="new-password" disabled={isLoading} placeholder="Min. 8 characters" />
              <Input id="confirmNewPassword" type="password" label="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} error={errors.confirmNewPassword} required autoComplete="new-password" disabled={isLoading} placeholder="••••••••" />
              {errors.general && (
                <p className="text-sm text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">{errors.general}</p>
              )}
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading} className="w-full mt-1">
                Reset password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
