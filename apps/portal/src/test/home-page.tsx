import { screen, within } from '@testing-library/react';
import type { RequestHandler } from 'msw';
import { Route, Routes } from 'react-router';

import HomePage from '@/pages/home/ui/HomePage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { myPackagesBackendHandler } from '@/test/packages-handlers';
import { purchasesListHandler } from '@/test/purchases-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderHomePage(...handlers: RequestHandler[]) {
  server.use(
    ...handlers,
    myPackagesBackendHandler([]),
    purchasesListHandler([]),
    refreshOkHandler(),
    meHandler()
  );
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/shipments" element={<p>Lista de envíos</p>} />
        <Route path="/shipments/:id" element={<p>Detalle del envío</p>} />
        <Route path="/pre-alerts" element={<p>Lista de pre-alertas</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: '/dashboard' }
  );
}

export function findHomeSection(name: string) {
  return screen.findByRole('region', { name }).then((section) => within(section));
}
