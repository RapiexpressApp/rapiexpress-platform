import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

export const NEW_PURCHASE = 'Nueva pre-alerta';

export async function openNewPurchase() {
  await userEvent.click(await screen.findByRole('button', { name: NEW_PURCHASE }));
  return within(await screen.findByRole('dialog', { name: NEW_PURCHASE }));
}

export async function pickCustomer(
  dialog: ReturnType<typeof within>,
  name: RegExp | string = /Jane Doe/
) {
  await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar cliente' }), 'Jane');
  await userEvent.click(await dialog.findByRole('button', { name }));
}
