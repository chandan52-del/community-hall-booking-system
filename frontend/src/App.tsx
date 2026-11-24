import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { PageLoader } from './components/ui';

// Lazy-load page components for optimized bundle performance and code-splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ExploreHallsPage = lazy(() => import('./pages/ExploreHallsPage'));
const HallDetailPage = lazy(() => import('./pages/HallDetailPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CustomerPortalPage = lazy(() => import('./pages/CustomerPortalPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Application Layout & Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/halls" element={<ExploreHallsPage />} />
                <Route path="/halls/:id" element={<HallDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/customer" element={<CustomerPortalPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
