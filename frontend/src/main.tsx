import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/ui/AppLayout';

// Strony publiczne
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Strony chronione
import { CatalogPage } from './pages/CatalogPage';
import { FindDetailPage } from './pages/FindDetailPage';
import { NewFindPage } from './pages/NewFindPage';
import { EditFindPage } from './pages/EditFindPage';
import { PlacesCatalogPage } from './pages/PlacesCatalogPage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { NewPlacePage } from './pages/NewPlacePage';
import { EditPlacePage } from './pages/EditPlacePage';
import { MapPage } from './pages/MapPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LandingPage } from './pages/LandingPage';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Publiczne */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Chronione */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/finds/new" element={<NewFindPage />} />
            <Route path="/finds/:id" element={<FindDetailPage />} />
            <Route path="/finds/:id/edit" element={<EditFindPage />} />
            <Route path="/places" element={<PlacesCatalogPage />} />
            <Route path="/places/new" element={<NewPlacePage />} />
            <Route path="/places/:id" element={<PlaceDetailPage />} />
            <Route path="/places/:id/edit" element={<EditPlacePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const gtmId = import.meta.env.VITE_GTM_ID;
if (gtmId) {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(s);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
