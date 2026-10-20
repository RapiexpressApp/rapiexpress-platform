import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { findPurchasesList, renderPreAlertsPage } from '@/test/pre-alerts-page';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';
import { server } from '@/test/server';

const pending = purchaseFixture();
const received = purchaseFixture({
  id: 'p2',
  trackingNumber: 'TBA000000002',
  status: 'RECEIVED',
  receivedAt: '2026-03-20T12:00:00.000Z',
});
const cancelled = purchaseFixture({
  id: 'p3',
  trackingNumber: 'TBA000000003',
  status: 'CANCELLED',
  cancelledAt: '2026-03-18T12:00:00.000Z',
});

async function openEdit(guide = pending.trackingNumber) {
  const list = await findPurchasesList();
  await userEvent.click(list.getByRole('button', { name: `Editar pre-alerta ${guide}` }));
  return within(await screen.findByRole('dialog', { name: 'Editar pre-alerta' }));
}

const save = (form: ReturnType<typeof within>) =>
  userEvent.click(form.getByRole('button', { name: 'Guardar cambios' }));

describe('PreAlertsPage edit', () => {
  it('offers Editar only on rows that are still pending', async () => {
    server.use(purchasesListHandler([pending, received, cancelled]));
    renderPreAlertsPage();

    const list = await findPurchasesList();

    expect(list.getAllByRole('button', { name: /^Editar pre-alerta/ })).toHaveLength(1);
    expect(
      list.getByRole('button', { name: 'Editar pre-alerta TBA123456789' })
    ).toBeInTheDocument();
  });

  it('opens a dialog prefilled with the current values', async () => {
    server.use(purchasesListHandler([pending]));
    renderPreAlertsPage();

    const form = await openEdit();

    expect(form.getByLabelText('Tienda')).toHaveValue('Amazon');
    expect(form.getByLabelText('Guía de seguimiento')).toHaveValue('TBA123456789');
    expect(form.getByLabelText('Descripción')).toHaveValue('Audífonos inalámbricos');
    expect(form.getByLabelText('Valor declarado (USD)')).toHaveValue('120.5');
    expect(form.getByLabelText('Peso estimado (lb)')).toHaveValue('1.5');
    expect(form.getByLabelText('Categoría sugerida')).toHaveValue('FOUR_BY_FOUR');
  });

  it('moves focus into the dialog, closes on Escape and returns focus to the row action', async () => {
    server.use(purchasesListHandler([pending]));
    renderPreAlertsPage();
    const list = await findPurchasesList();
    const trigger = list.getByRole('button', { name: 'Editar pre-alerta TBA123456789' });

    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Editar pre-alerta' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('sends only the fields that changed and confirms inline', async () => {
    let body: unknown;
    let patchedId: string | readonly string[] | undefined;
    let listCalls = 0;
    server.use(
      http.get('*/api/me/purchases', () => {
        listCalls += 1;
        return HttpResponse.json({ items: [pending], page: 1, pageSize: 10, total: 1 });
      }),
      http.patch('*/api/me/purchases/:id', async ({ request, params }) => {
        body = await request.json();
        patchedId = params.id;
        return HttpResponse.json({ ...pending, store: 'eBay', estimatedWeightLb: 2.25 });
      })
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Tienda'));
    await userEvent.type(form.getByLabelText('Tienda'), 'eBay');
    await userEvent.clear(form.getByLabelText('Peso estimado (lb)'));
    await userEvent.type(form.getByLabelText('Peso estimado (lb)'), '2,25');

    await save(form);

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(body).toEqual({ store: 'eBay', estimatedWeightLb: 2.25 });
    expect(patchedId).toBe('p1');
    expect(listCalls).toBe(2);
  });

  it('does not treat a guide typed in another case as a change', async () => {
    let body: unknown;
    server.use(
      purchasesListHandler([pending]),
      http.patch('*/api/me/purchases/:id', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(pending);
      })
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Guía de seguimiento'));
    await userEvent.type(form.getByLabelText('Guía de seguimiento'), 'tba-123456789');
    await userEvent.clear(form.getByLabelText('Descripción'));
    await userEvent.type(form.getByLabelText('Descripción'), 'Cargador');

    await save(form);

    await screen.findByText('Cambios guardados.');
    expect(body).toEqual({ description: 'Cargador' });
  });

  it('asks for a change instead of sending an empty request', async () => {
    let patches = 0;
    server.use(
      purchasesListHandler([pending]),
      http.patch('*/api/me/purchases/:id', () => {
        patches += 1;
        return HttpResponse.json(pending);
      })
    );
    renderPreAlertsPage();
    const form = await openEdit();

    await save(form);

    expect(await form.findByRole('alert')).toHaveTextContent(
      'Modifica al menos un campo para guardar los cambios.'
    );
    expect(patches).toBe(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('validates before the request', async () => {
    let patches = 0;
    server.use(
      purchasesListHandler([pending]),
      http.patch('*/api/me/purchases/:id', () => {
        patches += 1;
        return HttpResponse.json(pending);
      })
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Tienda'));

    await save(form);

    expect(await form.findByText('Ingresa la tienda.')).toBeInTheDocument();
    expect(patches).toBe(0);
  });

  it('shows the duplicate guide on its field', async () => {
    server.use(
      purchasesListHandler([pending]),
      http.patch('*/api/me/purchases/:id', () =>
        HttpResponse.json({ code: 'DUPLICATE_PURCHASE', message: 'Duplicate' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Guía de seguimiento'));
    await userEvent.type(form.getByLabelText('Guía de seguimiento'), 'TBA999999999');

    await save(form);

    expect(await form.findByText('Ya tienes una pre-alerta con esta guía.')).toBeInTheDocument();
    expect(form.getByLabelText('Guía de seguimiento')).toBeInvalid();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('explains that it was already received or cancelled and refreshes the list', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/api/me/purchases', () => {
        listCalls += 1;
        return HttpResponse.json({
          items: [listCalls === 1 ? pending : { ...pending, status: 'RECEIVED' }],
          page: 1,
          pageSize: 10,
          total: 1,
        });
      }),
      http.patch('*/api/me/purchases/:id', () =>
        HttpResponse.json({ code: 'PURCHASE_NOT_PENDING', message: 'Not pending' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Tienda'));
    await userEvent.type(form.getByLabelText('Tienda'), 'eBay');

    await save(form);

    expect(
      await screen.findByText(
        'Esta pre-alerta ya fue recibida o cancelada y no se puede modificar. Actualizamos tu lista.'
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(listCalls).toBe(2));
    const list = await findPurchasesList();
    await waitFor(() =>
      expect(list.queryByRole('button', { name: /^Editar/ })).not.toBeInTheDocument()
    );
    expect(list.getByText('Recibida')).toBeInTheDocument();
  });

  it('shows one generic retry message for other errors and keeps the dialog open', async () => {
    server.use(
      purchasesListHandler([pending]),
      http.patch('*/api/me/purchases/:id', () => new HttpResponse(null, { status: 500 }))
    );
    renderPreAlertsPage();
    const form = await openEdit();
    await userEvent.clear(form.getByLabelText('Tienda'));
    await userEvent.type(form.getByLabelText('Tienda'), 'eBay');

    await save(form);

    expect(await form.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar los cambios. Revisa los datos e inténtalo de nuevo.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
