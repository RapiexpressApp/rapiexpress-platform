import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  createPurchaseErrorHandler,
  createPurchaseHandler,
  purchaseFixture,
  purchasesListHandler,
} from '@/test/purchases-handlers';
import {
  fillPurchaseForm,
  NEW_PURCHASE,
  openNewPurchase,
  pickCustomer,
  renderPurchasesPage,
  submitPurchase,
} from '@/test/purchases-page';
import {
  CUSTOMER_ID,
  customerSearchHandler,
  customerSummaryFixture,
  OTHER_CUSTOMER_ID,
} from '@/test/reception-handlers';

function renderPage(...handlers: Parameters<typeof renderPurchasesPage>[1][]) {
  return renderPurchasesPage(
    '/prealertas',
    purchasesListHandler(),
    customerSearchHandler([
      customerSummaryFixture(),
      customerSummaryFixture({ id: OTHER_CUSTOMER_ID, name: 'Rosa', lastName: 'Pérez' }),
    ]),
    ...handlers
  );
}

async function submitFilledForm() {
  const dialog = await openNewPurchase();
  await pickCustomer(dialog);
  await dialog.findByRole('textbox', { name: 'Tienda' });
  await fillPurchaseForm(dialog);
  await submitPurchase(dialog);
  return dialog;
}

describe('new pre-alert, a guide the customer already declared', () => {
  const duplicate = () =>
    createPurchaseErrorHandler(409, { statusCode: 409, code: 'DUPLICATE_PURCHASE' });

  it('shows the problem on the guide field and focuses it', async () => {
    renderPage(duplicate());

    const dialog = await submitFilledForm();

    expect(
      await dialog.findByText('Este cliente ya tiene una pre-alerta activa con esta guía.')
    ).toBeInTheDocument();
    expect(dialog.getByRole('textbox', { name: 'Guía de seguimiento' })).toBeInvalid();
    await waitFor(() =>
      expect(dialog.getByRole('textbox', { name: 'Guía de seguimiento' })).toHaveFocus()
    );
  });

  it('keeps the dialog open with everything that was typed, and no generic alert', async () => {
    renderPage(duplicate());

    const dialog = await submitFilledForm();
    await dialog.findByText('Este cliente ya tiene una pre-alerta activa con esta guía.');

    expect(screen.getByRole('dialog', { name: NEW_PURCHASE })).toBeInTheDocument();
    expect(dialog.getByRole('textbox', { name: 'Tienda' })).toHaveValue('Amazon');
    expect(dialog.getByRole('textbox', { name: 'Descripción' })).toHaveValue('Zapatos deportivos');
    expect(dialog.queryByRole('alert')).toBeNull();
    expect(dialog.getByRole('button', { name: 'Crear pre-alerta' })).toBeEnabled();
  });

  it('lets the operator fix the guide and create the pre-alert', async () => {
    const bodies: Record<string, unknown>[] = [];
    let calls = 0;
    renderPage(
      http.post('*/api/purchases', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ statusCode: 409, code: 'DUPLICATE_PURCHASE' }, { status: 409 })
          : HttpResponse.json(purchaseFixture(), { status: 201 });
      })
    );
    const dialog = await submitFilledForm();
    await dialog.findByText('Este cliente ya tiene una pre-alerta activa con esta guía.');

    const guide = dialog.getByRole('textbox', { name: 'Guía de seguimiento' });
    await userEvent.clear(guide);
    await userEvent.type(guide, 'ZZ9999999999');
    await submitPurchase(dialog);

    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    expect(bodies.map((body) => body.trackingNumber)).toEqual([
      '1Z999AA10123456784',
      'ZZ9999999999',
    ]);
  });
});

describe('new pre-alert, a customer that is no longer active', () => {
  const inactive = () =>
    createPurchaseErrorHandler(404, { statusCode: 404, code: 'CUSTOMER_NOT_FOUND' });

  it('sends the operator back to the customer step with a clear message', async () => {
    renderPage(inactive());

    const dialog = await submitFilledForm();

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'El cliente ya no está activo. Elige otro cliente.'
    );
    expect(dialog.getByText('Paso 1 de 2 · Cliente')).toBeInTheDocument();
    expect(dialog.getByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: NEW_PURCHASE })).toBeInTheDocument();
  });

  it('keeps the data so another customer can take the pre-alert', async () => {
    const bodies: Record<string, unknown>[] = [];
    let calls = 0;
    renderPage(
      http.post('*/api/purchases', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ statusCode: 404, code: 'CUSTOMER_NOT_FOUND' }, { status: 404 })
          : HttpResponse.json(purchaseFixture(), { status: 201 });
      })
    );
    const dialog = await submitFilledForm();
    await dialog.findByRole('alert');

    await pickCustomer(dialog, /Rosa Pérez/);

    expect(await dialog.findByRole('textbox', { name: 'Tienda' })).toHaveValue('Amazon');
    expect(dialog.queryByRole('alert')).toBeNull();
    await submitPurchase(dialog);
    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    expect(bodies.map((body) => body.customerId)).toEqual([CUSTOMER_ID, OTHER_CUSTOMER_ID]);
  });
});

describe('new pre-alert, other failures', () => {
  it('asks to review the form when the server rejects the data', async () => {
    renderPage(
      createPurchaseErrorHandler(400, { statusCode: 400, message: ['store must be a string'] })
    );

    const dialog = await submitFilledForm();

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'El servidor rechazó algún dato. Revisa el formulario e inténtalo de nuevo.'
    );
    expect(dialog.getByRole('textbox', { name: 'Tienda' })).toHaveValue('Amazon');
  });

  it('keeps the data on a generic failure and lets the operator retry', async () => {
    let calls = 0;
    renderPage(
      http.post('*/api/purchases', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ statusCode: 500 }, { status: 500 })
          : HttpResponse.json(purchaseFixture(), { status: 201 });
      })
    );

    const dialog = await submitFilledForm();

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos crear la pre-alerta. Inténtalo de nuevo.'
    );
    expect(dialog.getByRole('textbox', { name: 'Guía de seguimiento' })).toHaveValue(
      '1Z999AA10123456784'
    );
    await submitPurchase(dialog);
    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('suggests checking the connection when the request got no response', async () => {
    renderPage(http.post('*/api/purchases', () => HttpResponse.error()));

    const dialog = await submitFilledForm();

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos crear la pre-alerta. Revisa tu conexión e inténtalo de nuevo.'
    );
    expect(dialog.getByRole('button', { name: 'Crear pre-alerta' })).toBeEnabled();
  });

  it('clears the failure while the retry is pending', async () => {
    let calls = 0;
    renderPage(
      http.post('*/api/purchases', async () => {
        calls += 1;
        if (calls === 1) return HttpResponse.json({ statusCode: 500 }, { status: 500 });
        await new Promise(() => {});
        return HttpResponse.json({});
      })
    );
    const dialog = await submitFilledForm();
    await dialog.findByRole('alert');

    await submitPurchase(dialog);

    await waitFor(() => expect(dialog.queryByRole('alert')).toBeNull());
    expect(await dialog.findByRole('button', { name: /Creando/ })).toBeDisabled();
  });

  it('does not show the failure of a creation that worked', async () => {
    renderPage(createPurchaseHandler());

    await submitFilledForm();

    await screen.findByText('Pre-alerta creada.');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
