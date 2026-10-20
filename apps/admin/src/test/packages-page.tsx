import type { RequestHandler } from 'msw';
import { Route, Routes } from 'react-router';

import PackagesPage from '@/pages/packages/ui/PackagesPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderPackagesPage(route: string, ...handlers: RequestHandler[]) {
  server.use(refreshOkHandler(), meHandler('OPERATIONS'), ...handlers);
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/paquetes" element={<PackagesPage />} />
        <Route path="/paquetes/:id" element={<p>Detalle del paquete</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}
