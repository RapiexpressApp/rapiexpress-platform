import type { RequestHandler } from 'msw';
import { Route, Routes } from 'react-router';

import PackageDetailPage from '@/pages/packages/ui/PackageDetailPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { PACKAGE_ID } from '@/test/packages-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

interface DetailOptions {
  id?: string;
  role?: string;
}

export function renderPackageDetailPage(
  { id = PACKAGE_ID, role = 'OPERATIONS' }: DetailOptions,
  ...handlers: RequestHandler[]
) {
  server.use(refreshOkHandler(), meHandler(role), ...handlers);
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/paquetes" element={<p>Listado de paquetes</p>} />
        <Route path="/paquetes/:id" element={<PackageDetailPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route: `/paquetes/${id}` }
  );
}
