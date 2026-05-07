import React, { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import { ApiRequestError } from '../services/api';
import { Input, Textarea, Button, Spinner } from '../components/ui';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getInitials(firstName?: string | null, lastName?: string | null, username?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  return '??';
}

const AvatarSection: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = getInitials(user?.firstName, user?.lastName, user?.username);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(''); setSuccessMessage('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setFileError('Unsupported format. Accepted: JPEG, PNG, WebP.'); return; }
    if (file.size > MAX_FILE_SIZE) { setFileError('File too large. Maximum size is 5 MB.'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const result = await userService.uploadAvatar(selectedFile);
      if (user) setUser({ ...user, avatarUrl: result.avatarUrl });
      setSuccessMessage('Avatar updated successfully.');
      setSelectedFile(null); setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { setFileError('Failed to upload avatar. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const displayImageUrl = previewUrl ?? user?.avatarUrl ?? null;

  return (
    <section className="card p-6">
      <h2 className="font-display font-semibold text-explorer-text mb-4">Profile photo</h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0">
          {displayImageUrl ? (
            <img src={displayImageUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-explorer-border" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-explorer-accent/20 text-explorer-accent text-xl font-bold flex items-center justify-center ring-2 ring-explorer-border">
              {initials}
            </div>
          )}
        </div>
        <form onSubmit={handleUpload} className="flex flex-1 flex-col gap-3">
          <div>
            <label htmlFor="avatar-file" className="mb-1.5 block text-sm font-medium text-explorer-text-secondary">Choose new photo</label>
            <input ref={fileInputRef} id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={isLoading} className="block w-full text-sm text-explorer-text-secondary file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-explorer-accent/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-explorer-accent hover:file:bg-explorer-accent/20 disabled:opacity-50" />
            <p className="mt-1 text-xs text-explorer-muted">JPEG, PNG or WebP, max 5 MB</p>
          </div>
          {fileError && <p className="text-xs text-explorer-danger" role="alert">{fileError}</p>}
          {successMessage && <p className="text-xs text-explorer-success" role="status">{successMessage}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isLoading} disabled={isLoading || !selectedFile}>Upload photo</Button>
          </div>
        </form>
      </div>
    </section>
  );
};

const ProfileEditSection: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username ?? '');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters.';
    if (bio.length > 500) newErrors.bio = 'Bio cannot exceed 500 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      const updatedUser = await userService.updateProfile({ username: username.trim(), firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined, bio: bio.trim() || undefined });
      setUser(updatedUser);
      setSuccessMessage('Profile updated successfully.');
      setErrors({});
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) setErrors({ username: 'This username is already taken.' });
      else setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally { setIsLoading(false); }
  };

  return (
    <section className="card p-6">
      <h2 className="font-display font-semibold text-explorer-text mb-4">Edit profile</h2>
      {errors.general && <p className="mb-4 text-sm text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">{errors.general}</p>}
      {successMessage && <p className="mb-4 text-sm text-explorer-success bg-explorer-success/10 rounded-lg px-3 py-2" role="status">{successMessage}</p>}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input id="username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} required minLength={3} disabled={isLoading} autoComplete="username" />
        <div className="grid grid-cols-2 gap-3">
          <Input id="firstName" label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} autoComplete="given-name" />
          <Input id="lastName" label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} autoComplete="family-name" />
        </div>
        <div>
          <Textarea id="bio" label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} error={errors.bio} rows={3} placeholder="Tell us about yourself..." disabled={isLoading} maxLength={500} />
          <p className="mt-1 text-right text-xs text-explorer-muted">{bio.length}/500</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isLoading} disabled={isLoading}>Save changes</Button>
        </div>
      </form>
    </section>
  );
};

const ChangePasswordSection: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = 'Current password is required.';
    if (newPassword.length < 8) newErrors.newPassword = 'New password must be at least 8 characters.';
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    if (!validate()) return;
    setIsLoading(true);
    try {
      await userService.changePassword({ currentPassword, newPassword, confirmNewPassword });
      setSuccessMessage('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setErrors({});
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400 && err.code === 'INVALID_CURRENT_PASSWORD') setErrors({ currentPassword: 'Current password is incorrect.' });
      else setErrors({ general: 'Failed to change password. Please try again.' });
    } finally { setIsLoading(false); }
  };

  return (
    <section className="card p-6">
      <h2 className="font-display font-semibold text-explorer-text mb-4">Change password</h2>
      {errors.general && <p className="mb-4 text-sm text-explorer-danger bg-explorer-danger/10 rounded-lg px-3 py-2" role="alert">{errors.general}</p>}
      {successMessage && <p className="mb-4 text-sm text-explorer-success bg-explorer-success/10 rounded-lg px-3 py-2" role="status">{successMessage}</p>}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input id="currentPassword" type="password" label="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} error={errors.currentPassword} required disabled={isLoading} autoComplete="current-password" />
        <Input id="newPassword" type="password" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={errors.newPassword} required minLength={8} disabled={isLoading} autoComplete="new-password" />
        <Input id="confirmNewPassword" type="password" label="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} error={errors.confirmNewPassword} required disabled={isLoading} autoComplete="new-password" />
        <div className="flex justify-end">
          <Button type="submit" size="sm" isLoading={isLoading} disabled={isLoading}>Change password</Button>
        </div>
      </form>
    </section>
  );
};

export const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <div className="flex justify-center items-center py-24"><Spinner size="lg" /></div>;
  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-explorer-text mb-6">My Profile</h1>
      <div className="flex flex-col gap-5">
        <AvatarSection />
        <ProfileEditSection />
        <ChangePasswordSection />
      </div>
    </div>
  );
};
