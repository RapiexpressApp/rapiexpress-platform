import { Navigate, Route, Routes } from 'react-router';

import DashboardLayout from '@/app/layouts/DashboardLayout';
import HomePage from '@/pages/home/ui/HomePage';
import LoginPage from '@/pages/login/ui/LoginPage';
import NotFoundPage from '@/pages/not-found/ui/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<HomePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
