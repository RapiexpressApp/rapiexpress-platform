import { Route, Routes } from 'react-router';

import ShipmentDetailPage from '@/pages/shipments/ui/ShipmentDetailPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { PACKAGE_ID } from '@/test/packages-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderShipmentDetailPage(id = PACKAGE_ID) {
  server.use(refreshOkHandler(), meHandler());
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/shipments" element={<p>Lista de envíos</p>} />
        <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route: `/shipments/${id}` }
  );
}
