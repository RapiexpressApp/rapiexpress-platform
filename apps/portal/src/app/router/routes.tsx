import { Navigate, Route, Routes } from 'react-router';

import LoginPage from '@/pages/login/ui/LoginPage';
import NotFoundPage from '@/pages/not-found/ui/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
