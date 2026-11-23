import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AparProvider } from './shared/context/AparContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import LoginPage from './shared/pages/LoginPage';
import UserLayout from './user/components/UserLayout';
import UserDashboard from './user/pages/UserDashboard';
import UserAparList from './user/pages/UserAparList';
import UserAparDetail from './user/pages/UserAparDetail';
import UserScanPage from './user/pages/UserScanPage';
import UserInspectForm from './user/pages/UserInspectForm';
import UserMaintenances from './user/pages/UserMaintenances';
import UserHistory from './user/pages/UserHistory';
import AdminPlaceholder from './admin/AdminPlaceholder';

export default function App() {
  return (
    <AparProvider>
      <BrowserRouter>
        <Routes>
          {/* Halaman Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rute Modul User (Dilindungi ProtectedRoute & Dibungkus UserLayout) */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="apars" element={<UserAparList />} />
            <Route path="apars/:id" element={<UserAparDetail />} />
            <Route path="scan" element={<UserScanPage />} />
            <Route path="inspect/:aparId" element={<UserInspectForm />} />
            <Route path="maintenances" element={<UserMaintenances />} />
            <Route path="history" element={<UserHistory />} />
          </Route>

          {/* Placeholder Rute Admin */}
          <Route path="/admin/*" element={<AdminPlaceholder />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AparProvider>
  );
}
