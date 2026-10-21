import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { purchasesListHandler } from '@/test/purchases-handlers';
import {
  NEW_PURCHASE,
  openNewPurchase,
  pickCustomer,
  renderPurchasesPage,
} from '@/test/purchases-page';
import {
  customerSearchHandler,
  customerSummaryFixture,
  OTHER_CUSTOMER_ID,
} from '@/test/reception-handlers';

function renderPage(...handlers: Parameters<typeof renderPurchasesPage>[1][]) {
  return renderPurchasesPage('/prealertas', purchasesListHandler(), ...handlers);
}

describe('new pre-alert, picking the customer', () => {
  it('opens a dialog on the customer search, with the search ready to type', async () => {
    renderPage(customerSearchHandler());

    const dialog = await openNewPurchase();

    expect(dialog.getByText('Paso 1 de 2 · Cliente')).toBeInTheDocument();
    expect(dialog.getByRole('searchbox', { name: 'Buscar cliente' })).toHaveFocus();
  });

  it('searches among the scoped reception customers', async () => {
    const requests: URL[] = [];
    renderPage(customerSearchHandler([customerSummaryFixture()], (url) => requests.push(url)));
    const dialog = await openNewPurchase();

    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar cliente' }), 'Jane');

    expect(await dialog.findByRole('button', { name: /Jane Doe/ })).toHaveTextContent('MI-00001');
    expect(requests.at(-1)?.pathname).toMatch(/\/packages\/reception\/customers$/);
    expect(requests.at(-1)?.searchParams.get('search')).toBe('Jane');
  });

  it('warns that only the first ten customers are shown', async () => {
    const customers = Array.from({ length: 10 }, (_, index) =>
      customerSummaryFixture({ id: `c-${index}`, name: `Cliente${index}` })
    );
    renderPage(customerSearchHandler(customers));
    const dialog = await openNewPurchase();

    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar cliente' }), 'Cli');

    expect(await dialog.findByText(/Mostramos los primeros 10 clientes/)).toBeInTheDocument();
  });

  it('moves to the second step with the chosen customer', async () => {
    renderPage(customerSearchHandler());
    const dialog = await openNewPurchase();

    await pickCustomer(dialog);

    expect(await dialog.findByText('Paso 2 de 2 · Datos de la compra')).toBeInTheDocument();
    expect(dialog.getByText('Jane Doe · MI-00001')).toBeInTheDocument();
    expect(dialog.queryByRole('searchbox', { name: 'Buscar cliente' })).toBeNull();
  });

  it('goes back to the search to change the customer', async () => {
    renderPage(
      customerSearchHandler([
        customerSummaryFixture(),
        customerSummaryFixture({ id: OTHER_CUSTOMER_ID, name: 'Rosa', lastName: 'Pérez' }),
      ])
    );
    const dialog = await openNewPurchase();
    await pickCustomer(dialog);

    await userEvent.click(await dialog.findByRole('button', { name: 'Cambiar cliente' }));

    expect(dialog.getByText('Paso 1 de 2 · Cliente')).toBeInTheDocument();
    expect(dialog.getByRole('searchbox', { name: 'Buscar cliente' })).toHaveFocus();
    await pickCustomer(dialog, /Rosa Pérez/);
    expect(await dialog.findByText('Rosa Pérez · MI-00001')).toBeInTheDocument();
  });

  it('closes with Cancelar and gives the focus back to the button that opened it', async () => {
    renderPage(customerSearchHandler());
    const dialog = await openNewPurchase();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: NEW_PURCHASE })).toHaveFocus();
  });

  it('closes with Escape', async () => {
    renderPage(customerSearchHandler());
    await openNewPurchase();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
