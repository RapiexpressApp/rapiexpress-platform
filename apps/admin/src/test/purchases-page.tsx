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

export interface PurchaseFormEntries {
  store?: string;
  guide?: string;
  description?: string;
  value?: string;
  weight?: string;
  category?: string;
}

const DEFAULT_ENTRIES: Required<PurchaseFormEntries> = {
  store: 'Amazon',
  guide: '1Z999AA10123456784',
  description: 'Zapatos deportivos',
  value: '59,99',
  weight: '2,5',
  category: 'G (migrante)',
};

export async function fillPurchaseForm(
  dialog: ReturnType<typeof within>,
  entries: PurchaseFormEntries = {}
) {
  const values = { ...DEFAULT_ENTRIES, ...entries };
  const type = async (name: string, text: string) => {
    if (text) await userEvent.type(dialog.getByRole('textbox', { name }), text);
  };
  await type('Tienda', values.store);
  await type('Guía de seguimiento', values.guide);
  await type('Descripción', values.description);
  await type('Valor declarado (USD)', values.value);
  await type('Peso estimado (lb)', values.weight);
  if (values.category) {
    await userEvent.selectOptions(
      dialog.getByRole('combobox', { name: 'Categoría sugerida' }),
      values.category
    );
  }
}

export async function submitPurchase(dialog: ReturnType<typeof within>) {
  await userEvent.click(dialog.getByRole('button', { name: 'Crear pre-alerta' }));
}
