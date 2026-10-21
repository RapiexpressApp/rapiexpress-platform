import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { createGate } from '@/test/packages-handlers';
import {
  createPurchaseHandler,
  purchasesListHandler,
  staffPurchaseFixture,
} from '@/test/purchases-handlers';
import {
  fillPurchaseForm,
  NEW_PURCHASE,
  openNewPurchase,
  pickCustomer,
  renderPurchasesPage,
  submitPurchase,
} from '@/test/purchases-page';
import { CUSTOMER_ID, customerSearchHandler } from '@/test/reception-handlers';

function renderPage(...handlers: Parameters<typeof renderPurchasesPage>[1][]) {
  return renderPurchasesPage(
    '/prealertas',
    purchasesListHandler(),
    customerSearchHandler(),
    ...handlers
  );
}

async function openForm() {
  const dialog = await openNewPurchase();
  await pickCustomer(dialog);
  await dialog.findByRole('textbox', { name: 'Tienda' });
  return dialog;
}

describe('new pre-alert, the form', () => {
  it('asks for the data of the purchase and focuses the first field', async () => {
    renderPage();
    const dialog = await openForm();

    expect(dialog.getByRole('textbox', { name: 'Tienda' })).toHaveFocus();
    expect(dialog.getByRole('textbox', { name: 'Guía de seguimiento' })).toBeInTheDocument();
    expect(dialog.getByRole('textbox', { name: 'Descripción' })).toBeInTheDocument();
    expect(dialog.getByRole('textbox', { name: /Valor declarado \(USD\)/ })).toBeInTheDocument();
    expect(dialog.getByRole('textbox', { name: /Peso estimado \(lb\)/ })).toBeInTheDocument();
    expect(dialog.getByRole('combobox', { name: 'Categoría sugerida' })).toBeInTheDocument();
  });

  it('explains the customs categories next to the category field', async () => {
    renderPage();
    const dialog = await openForm();

    const select = dialog.getByRole('combobox', { name: 'Categoría sugerida' });

    expect(select).toHaveAccessibleDescription(/4x4: Hasta USD 400 y 8,5 lb\./);
    expect(select).toHaveAccessibleDescription(/G \(migrante\): Para uso personal\./);
    expect(select).toHaveAccessibleDescription(/C \(comercial\): Hasta 100 kg y USD 5\.000\./);
  });

  it('offers the three categories in the select', async () => {
    renderPage();
    const dialog = await openForm();

    const options = within(dialog.getByRole('combobox', { name: 'Categoría sugerida' }))
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toEqual(['Selecciona una categoría', '4x4', 'G (migrante)', 'C (comercial)']);
  });

  it('keeps what was typed when the customer is changed', async () => {
    renderPage();
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await userEvent.click(dialog.getByRole('button', { name: 'Cambiar cliente' }));
    await pickCustomer(dialog);

    expect(await dialog.findByRole('textbox', { name: 'Tienda' })).toHaveValue('Amazon');
    expect(dialog.getByRole('textbox', { name: 'Guía de seguimiento' })).toHaveValue(
      '1Z999AA10123456784'
    );
    expect(dialog.getByRole('combobox', { name: 'Categoría sugerida' })).toHaveValue('MIGRANT');
  });
});

describe('new pre-alert, validation', () => {
  it('shows every missing field and sends nothing', async () => {
    const bodies: unknown[] = [];
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body) }));
    const dialog = await openForm();

    await submitPurchase(dialog);

    expect(await dialog.findByText('Ingresa la tienda.')).toBeInTheDocument();
    expect(
      dialog.getByText('La guía debe tener entre 6 y 64 letras o números.')
    ).toBeInTheDocument();
    expect(dialog.getByText('Ingresa la descripción.')).toBeInTheDocument();
    expect(dialog.getByText('El valor declarado es obligatorio.')).toBeInTheDocument();
    expect(dialog.getByText('El peso estimado es obligatorio.')).toBeInTheDocument();
    expect(dialog.getByText('Selecciona una categoría.')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('moves the focus to the first invalid field', async () => {
    renderPage();
    const dialog = await openForm();

    await submitPurchase(dialog);

    await waitFor(() => expect(dialog.getByRole('textbox', { name: 'Tienda' })).toHaveFocus());
  });

  it('rejects values the backend would reject, before the request', async () => {
    const bodies: unknown[] = [];
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body) }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog, { value: '1,005', weight: '2,5 lb', guide: 'AB#12' });

    await submitPurchase(dialog);

    expect(
      await dialog.findByText('El valor declarado admite como máximo 2 decimales.')
    ).toBeInTheDocument();
    expect(dialog.getByText('El peso estimado debe ser un número.')).toBeInTheDocument();
    expect(
      dialog.getByText('La guía debe tener entre 6 y 64 letras o números.')
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });
});

describe('new pre-alert, creating', () => {
  it('sends the customer and the data, with decimal commas turned into numbers', async () => {
    const bodies: unknown[] = [];
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body) }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog, { guide: ' 1z99-9aa1 0123456784 ' });

    await submitPurchase(dialog);

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      customerId: CUSTOMER_ID,
      store: 'Amazon',
      trackingNumber: '1Z999AA10123456784',
      description: 'Zapatos deportivos',
      declaredValueUsd: 59.99,
      estimatedWeightLb: 2.5,
      suggestedCategory: 'MIGRANT',
    });
  });

  it('closes the dialog, confirms it and gives the focus back to the button', async () => {
    renderPage(createPurchaseHandler());
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await submitPurchase(dialog);

    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: NEW_PURCHASE })).toHaveFocus();
  });

  it('refreshes the purchases so the new one shows up', async () => {
    let created = false;
    const { queryClient } = renderPurchasesPage(
      '/prealertas',
      customerSearchHandler(),
      createPurchaseHandler(undefined, {
        onRequest: () => {
          created = true;
        },
      }),
      http.get('*/api/purchases', () =>
        HttpResponse.json({
          items: created
            ? [staffPurchaseFixture({ id: 'new', store: 'Shein', description: 'Vestido azul' })]
            : [staffPurchaseFixture()],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await submitPurchase(dialog);

    const list = await screen.findByRole('list', { name: 'Pre-alertas' });
    expect(await within(list).findByText('Vestido azul')).toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.purchases.all });
  });

  it('keeps the dialog open and the form locked while the request is pending', async () => {
    const { gate, release } = createGate();
    renderPage(createPurchaseHandler(undefined, { gate }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await submitPurchase(dialog);

    const creating = await dialog.findByRole('button', { name: /Creando/ });
    expect(creating).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: NEW_PURCHASE })).toBeInTheDocument();

    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('submits with Enter from a field', async () => {
    const bodies: unknown[] = [];
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body) }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await userEvent.type(dialog.getByRole('textbox', { name: /Peso estimado/ }), '{Enter}');

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ store: 'Amazon', suggestedCategory: 'MIGRANT' });
  });
});

describe('new pre-alert, double submits', () => {
  it('sends one request when the form is submitted twice in the same tick', async () => {
    const bodies: unknown[] = [];
    const { gate, release } = createGate();
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body), gate }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog);
    const form = dialog.getByRole('form', { name: 'Datos de la pre-alerta' });

    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    await waitFor(() => expect(bodies.length).toBeGreaterThan(0));
    release();

    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
  });

  it('sends one request when the button is double clicked', async () => {
    const bodies: unknown[] = [];
    const { gate, release } = createGate();
    renderPage(createPurchaseHandler(undefined, { onRequest: (body) => bodies.push(body), gate }));
    const dialog = await openForm();
    await fillPurchaseForm(dialog);

    await userEvent.dblClick(dialog.getByRole('button', { name: 'Crear pre-alerta' }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(0));
    release();

    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
  });
});
