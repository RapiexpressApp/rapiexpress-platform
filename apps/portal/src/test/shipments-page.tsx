import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';

import ShipmentsPage from '@/pages/shipments/ui/ShipmentsPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderShipmentsPage(route = '/shipments') {
  server.use(refreshOkHandler(), meHandler());
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/shipments/:id" element={<p>Detalle del envío</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}

export async function findShipmentsList() {
  return within(await screen.findByRole('list', { name: 'Envíos' }));
}
