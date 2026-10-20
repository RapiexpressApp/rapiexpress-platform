import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';

import PreAlertsPage from '@/pages/pre-alerts/ui/PreAlertsPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderPreAlertsPage(route = '/pre-alerts') {
  server.use(refreshOkHandler(), meHandler());
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/pre-alerts" element={<PreAlertsPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}

export async function findPurchasesList() {
  return within(await screen.findByRole('list', { name: 'Pre-alertas' }));
}
