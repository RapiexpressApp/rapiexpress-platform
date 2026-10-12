import { Navigate, Route, Routes } from 'react-router';

import DashboardLayout from '@/app/layouts/DashboardLayout';
import HomePage from '@/pages/home/ui/HomePage';
import LoginPage from '@/pages/login/ui/LoginPage';
import NotFoundPage from '@/pages/not-found/ui/NotFoundPage';
import RegisterPage from '@/pages/register/ui/RegisterPage';

import GuestOnly from './GuestOnly';
import RequireAuth from './RequireAuth';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<HomePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
