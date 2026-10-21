import type { RequestHandler } from 'msw';
import { Route, Routes } from 'react-router';

import PurchasesPage from '@/pages/purchases/ui/PurchasesPage';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import LocationProbe from '@/test/LocationProbe';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

export function renderPurchasesPage(route: string, ...handlers: RequestHandler[]) {
  server.use(refreshOkHandler(), meHandler('OPERATIONS'), ...handlers);
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/prealertas" element={<PurchasesPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}
