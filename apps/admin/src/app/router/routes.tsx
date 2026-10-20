import { Route, Routes } from 'react-router';

import AdminLayout from '@/app/layouts/AdminLayout';
import CustomersPage from '@/pages/customers/ui/CustomersPage';
import LoginPage from '@/pages/login/ui/LoginPage';
import NotFoundPage from '@/pages/not-found/ui/NotFoundPage';
import PackagesPage from '@/pages/packages/ui/PackagesPage';
import ReceptionPage from '@/pages/reception/ui/ReceptionPage';
import UsersPage from '@/pages/users/ui/UsersPage';

import GuestOnly from './GuestOnly';
import RequireRole from './RequireRole';
import RequireStaff from './RequireStaff';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/" element={<LoginPage />} />
      </Route>
      <Route element={<RequireStaff />}>
        <Route element={<AdminLayout />}>
          <Route element={<RequireRole allow={['ADMIN']} />}>
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>
          <Route element={<RequireRole allow={['ADMIN', 'OPERATIONS']} />}>
            <Route path="/clientes" element={<CustomersPage />} />
          </Route>
          <Route path="/recepcion" element={<ReceptionPage />} />
          <Route path="/paquetes" element={<PackagesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
