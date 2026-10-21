import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { findPurchasesList, renderPreAlertsPage } from '@/test/pre-alerts-page';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';
import { server } from '@/test/server';

const pending = purchaseFixture();
const received = purchaseFixture({ id: 'p2', trackingNumber: 'TBA000000002', status: 'RECEIVED' });
const cancelled = purchaseFixture({
  id: 'p3',
  trackingNumber: 'TBA000000003',
  status: 'CANCELLED',
});

async function openConfirmation(guide = pending.trackingNumber) {
  const list = await findPurchasesList();
  await userEvent.click(list.getByRole('button', { name: `Cancelar pre-alerta ${guide}` }));
  return within(await screen.findByRole('alertdialog', { name: 'Cancelar pre-alerta' }));
}

const confirm = (dialog: ReturnType<typeof within>) =>
  userEvent.click(dialog.getByRole('button', { name: 'Cancelar pre-alerta' }));

describe('PreAlertsPage cancel', () => {
  it('offers Cancelar only on rows that are still pending', async () => {
    server.use(purchasesListHandler([pending, received, cancelled]));
    renderPreAlertsPage();

    const list = await findPurchasesList();

    expect(list.getAllByRole('button', { name: /^Cancelar pre-alerta/ })).toHaveLength(1);
    expect(
      list.getByRole('button', { name: 'Cancelar pre-alerta TBA123456789' })
    ).toBeInTheDocument();
  });

  it('asks for confirmation naming the purchase before doing anything', async () => {
    let posts = 0;
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', () => {
        posts += 1;
        return HttpResponse.json(pending);
      })
    );
    renderPreAlertsPage();

    const dialog = await openConfirmation();

    expect(dialog.getByText(/Amazon/)).toBeInTheDocument();
    expect(dialog.getByText(/TBA123456789/)).toBeInTheDocument();
    expect(dialog.getByText(/no se puede deshacer/)).toBeInTheDocument();
    expect(posts).toBe(0);
  });

  it('moves focus into the dialog, closes on Escape and returns focus to the row action', async () => {
    server.use(purchasesListHandler([pending]));
    renderPreAlertsPage();
    const list = await findPurchasesList();
    const trigger = list.getByRole('button', { name: 'Cancelar pre-alerta TBA123456789' });

    await userEvent.click(trigger);
    const dialog = await screen.findByRole('alertdialog', { name: 'Cancelar pre-alerta' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('puts initial focus on the safe action', async () => {
    // jsdom has no layout, so the focus trap sees no focusable element unless boxes exist.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(0, 0, 100, 40),
    ] as unknown as DOMRectList);
    server.use(purchasesListHandler([pending]));
    renderPreAlertsPage();

    const dialog = await openConfirmation();

    await waitFor(() =>
      expect(dialog.getByRole('button', { name: 'Mantener pre-alerta' })).toHaveFocus()
    );
  });

  it('keeps the pre-alert when the customer backs out', async () => {
    let posts = 0;
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', () => {
        posts += 1;
        return HttpResponse.json(pending);
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await userEvent.click(dialog.getByRole('button', { name: 'Mantener pre-alerta' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(posts).toBe(0);
  });

  it('closes with the explicit close button', async () => {
    server.use(purchasesListHandler([pending]));
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await userEvent.click(dialog.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('cancels, closes the dialog, confirms inline and refreshes the list', async () => {
    let cancelledId: string | readonly string[] | undefined;
    let listCalls = 0;
    server.use(
      http.get('*/api/me/purchases', () => {
        listCalls += 1;
        return HttpResponse.json({
          items: [listCalls === 1 ? pending : { ...pending, status: 'CANCELLED' }],
          page: 1,
          pageSize: 10,
          total: 1,
        });
      }),
      http.post('*/api/me/purchases/:id/cancel', ({ params }) => {
        cancelledId = params.id;
        return HttpResponse.json({ ...pending, status: 'CANCELLED' });
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);

    expect(await screen.findByText('Pre-alerta cancelada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(cancelledId).toBe('p1');
    const list = await findPurchasesList();
    await waitFor(() => expect(list.getByText('Cancelada')).toBeInTheDocument());
    expect(list.queryByRole('button', { name: /^Cancelar pre-alerta/ })).not.toBeInTheDocument();
  });

  it('steps back to the previous page when cancelling the only row of the last page', async () => {
    const requests: URL[] = [];
    let cancelledOne = false;
    server.use(
      http.get('*/api/me/purchases', ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const page = Number(url.searchParams.get('page'));
        const total = cancelledOne ? 10 : 11;
        const items = page === 1 ? [received] : cancelledOne ? [] : [pending];
        return HttpResponse.json({ items, page, pageSize: 10, total });
      }),
      http.post('*/api/me/purchases/:id/cancel', () => {
        cancelledOne = true;
        return HttpResponse.json({ ...pending, status: 'CANCELLED' });
      })
    );
    renderPreAlertsPage('/pre-alerts?page=2');
    const dialog = await openConfirmation();

    await confirm(dialog);

    expect(await screen.findByText('Pre-alerta cancelada.')).toBeInTheDocument();
    expect(await screen.findByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.queryByText(/No tienes pre-alertas/)).not.toBeInTheDocument();
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('moves focus to the page heading once the cancelled row has lost its actions', async () => {
    let cancelledOne = false;
    server.use(
      http.get('*/api/me/purchases', () =>
        HttpResponse.json({
          items: [cancelledOne ? { ...pending, status: 'CANCELLED' } : pending],
          page: 1,
          pageSize: 10,
          total: 1,
        })
      ),
      http.post('*/api/me/purchases/:id/cancel', () => {
        cancelledOne = true;
        return HttpResponse.json({ ...pending, status: 'CANCELLED' });
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);

    await screen.findByText('Pre-alerta cancelada.');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Pre-alertas' })).toHaveFocus()
    );
  });

  it('moves focus to the page heading when the purchase was no longer pending', async () => {
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', () =>
        HttpResponse.json({ code: 'PURCHASE_NOT_PENDING', message: 'Not pending' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Pre-alertas' })).toHaveFocus()
    );
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
      http.post('*/api/me/purchases/:id/cancel', () =>
        HttpResponse.json({ code: 'PURCHASE_NOT_PENDING', message: 'Not pending' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);

    expect(
      await screen.findByText(
        'Esta pre-alerta ya fue recibida o cancelada y no se puede modificar. Actualizamos tu lista.'
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    const list = await findPurchasesList();
    await waitFor(() => expect(list.getByText('Recibida')).toBeInTheDocument());
  });

  it('shows one retry message for other errors and lets the customer try again', async () => {
    let calls = 0;
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ ...pending, status: 'CANCELLED' });
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos cancelar la pre-alerta. Inténtalo de nuevo.'
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await confirm(dialog);

    expect(await screen.findByText('Pre-alerta cancelada.')).toBeInTheDocument();
  });

  it('cannot be closed while cancelling and still confirms afterwards', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', async () => {
        await gate;
        return HttpResponse.json({ ...pending, status: 'CANCELLED' });
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);
    await waitFor(() => expect(dialog.getByRole('button', { name: /Cancelando/ })).toBeDisabled());
    await userEvent.keyboard('{Escape}');
    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();

    expect(screen.getByRole('alertdialog', { name: 'Cancelar pre-alerta' })).toBeInTheDocument();
    release();
    expect(await screen.findByText('Pre-alerta cancelada.')).toBeInTheDocument();
  });

  it('blocks a double confirmation while the request is pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    server.use(
      purchasesListHandler([pending]),
      http.post('*/api/me/purchases/:id/cancel', async () => {
        calls += 1;
        await gate;
        return new HttpResponse(null, { status: 503 });
      })
    );
    renderPreAlertsPage();
    const dialog = await openConfirmation();

    await confirm(dialog);
    await waitFor(() => expect(dialog.getByRole('button', { name: /Cancelando/ })).toBeDisabled());
    await userEvent.click(dialog.getByRole('button', { name: /Cancelando/ }));

    expect(calls).toBe(1);
    release();
    await dialog.findByRole('alert');
  });
});
