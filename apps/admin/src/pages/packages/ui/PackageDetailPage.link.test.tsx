import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  createGate,
  packageActionHandler,
  packageDetailHandler,
  packageErrorHandler,
  packagePurchaseFixture,
  packageStaffDetailFixture,
} from '@/test/packages-handlers';
import { purchasesListHandler, staffPurchaseFixture } from '@/test/purchases-handlers';
import {
  customerSummaryFixture,
  OTHER_CUSTOMER_ID,
  OTHER_PURCHASE_ID,
  packageDetailFixture,
  PURCHASE_ID,
} from '@/test/reception-handlers';

const TITLE = 'Vincular compra';

const unassigned = () =>
  packageStaffDetailFixture({
    customer: null,
    label: { warehouseNumber: 'WH-000042', customerName: null, lockerCode: null },
  });

const otherCustomerPurchase = () =>
  staffPurchaseFixture({
    id: OTHER_PURCHASE_ID,
    store: 'Shein',
    trackingNumber: 'SHEIN9999999',
    customer: customerSummaryFixture({
      id: OTHER_CUSTOMER_ID,
      name: 'Rosa',
      lastName: 'Pérez',
      lockerCode: 'MI-00002',
    }),
  });

async function openLink() {
  await userEvent.click(await screen.findByRole('button', { name: TITLE }));
  return within(await screen.findByRole('dialog', { name: TITLE }));
}

async function choose(dialog: ReturnType<typeof within>, name: RegExp | string) {
  await userEvent.click(await dialog.findByRole('button', { name }));
}

describe('link a purchase availability', () => {
  it.each(['ADMIN', 'OPERATIONS'])('offers the action to %s', async (role) => {
    renderPackageDetailPage({ role }, packageDetailHandler());

    expect(await screen.findByRole('button', { name: TITLE })).toBeInTheDocument();
  });

  it('hides the action from warehouse staff, who cannot list purchases', async () => {
    const onPurchases = vi.fn();
    renderPackageDetailPage(
      { role: 'WAREHOUSE' },
      packageDetailHandler(),
      purchasesListHandler([], { onRequest: onPurchases })
    );
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });

    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
    expect(onPurchases).not.toHaveBeenCalled();
  });

  it('hides the action when a purchase is already linked', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({
          purchaseId: PURCHASE_ID,
          purchase: packagePurchaseFixture(),
        })
      )
    );
    await screen.findByRole('region', { name: 'Compra vinculada' });

    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
  });
});

describe('link a purchase picker', () => {
  it('lists the purchases waiting to be received', async () => {
    const requests: URL[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler([staffPurchaseFixture(), otherCustomerPurchase()], {
        onRequest: (url) => requests.push(url),
      })
    );
    const dialog = await openLink();

    expect(await dialog.findByRole('button', { name: /Amazon/ })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: /Shein/ })).toBeInTheDocument();
    expect(requests[0]?.searchParams.get('status')).toBe('PENDING_RECEPTION');
    expect(requests[0]?.searchParams.has('search')).toBe(false);
  });

  it('shows the customer, the value and the weight of each purchase', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler());
    const dialog = await openLink();

    const option = within(await dialog.findByRole('button', { name: /Amazon/ }));

    expect(option.getByText(/1Z999AA10123456784/)).toBeInTheDocument();
    expect(option.getByText(/Jane Doe · MI-00001/)).toBeInTheDocument();
    expect(option.getByText(/USD 59,99/)).toBeInTheDocument();
    expect(option.getByText(/2,5 lb/)).toBeInTheDocument();
  });

  it('only shows the purchases of the package customer, searched by locker', async () => {
    const requests: URL[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      purchasesListHandler([staffPurchaseFixture(), otherCustomerPurchase()], {
        onRequest: (url) => requests.push(url),
      })
    );
    const dialog = await openLink();

    expect(await dialog.findByRole('button', { name: /Amazon/ })).toBeInTheDocument();
    expect(dialog.queryByRole('button', { name: /Shein/ })).toBeNull();
    expect(requests[0]?.searchParams.get('search')).toBe('MI-00001');
    expect(requests[0]?.searchParams.get('status')).toBe('PENDING_RECEPTION');
  });

  it('searches by the customer name when the customer has no locker', async () => {
    const requests: URL[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({ customer: customerSummaryFixture({ lockerCode: null }) })
      ),
      purchasesListHandler([], { onRequest: (url) => requests.push(url) })
    );
    await openLink();

    await waitFor(() => expect(requests[0]?.searchParams.get('search')).toBe('Jane'));
  });

  it('searches what the operator types, debounced, keeping the customer filter', async () => {
    const requests: URL[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      purchasesListHandler([staffPurchaseFixture(), otherCustomerPurchase()], {
        onRequest: (url) => requests.push(url),
      })
    );
    const dialog = await openLink();
    await dialog.findByRole('button', { name: /Amazon/ });
    const initial = requests.length;

    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar pre-alerta' }), 'TBA123');

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('search')).toBe('TBA123'));
    expect(requests.slice(initial)).toHaveLength(1);
    expect(dialog.queryByRole('button', { name: /Shein/ })).toBeNull();
  });

  it('says when the customer has no purchase to link', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      purchasesListHandler([otherCustomerPurchase()])
    );
    const dialog = await openLink();

    expect(
      await dialog.findByText('No hay pre-alertas por recibir de este cliente.')
    ).toBeInTheDocument();
  });

  it('says when the search finds nothing', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler([]));
    const dialog = await openLink();

    expect(await dialog.findByText('No hay pre-alertas por recibir.')).toBeInTheDocument();
  });

  it('shows a loading state, then an error with a working retry', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      http.get('*/api/purchases', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({
              items: [staffPurchaseFixture()],
              page: 1,
              pageSize: 20,
              total: 1,
            });
      })
    );
    const dialog = await openLink();

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las pre-alertas.'
    );
    await userEvent.click(dialog.getByRole('button', { name: 'Reintentar' }));

    expect(await dialog.findByRole('button', { name: /Amazon/ })).toBeInTheDocument();
  });

  it('says when a typed search finds nothing', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler([]));
    const dialog = await openLink();
    await dialog.findByText('No hay pre-alertas por recibir.');

    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar pre-alerta' }), 'NOPE123');

    expect(
      await dialog.findByText('No encontramos pre-alertas por recibir con esa búsqueda.')
    ).toBeInTheDocument();
  });

  it('says whose purchases are listed when the package has a customer', async () => {
    renderPackageDetailPage({}, packageDetailHandler(), purchasesListHandler());
    const dialog = await openLink();

    expect(
      await dialog.findByText('Solo se muestran las pre-alertas de Jane Doe.')
    ).toBeInTheDocument();
  });

  it('says that the purchase customer is taken when the package has none', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler());
    const dialog = await openLink();

    expect(
      await dialog.findByText(/El paquete no tiene cliente: tomará el de la pre-alerta que elijas/)
    ).toBeInTheDocument();
  });

  it('warns when the list was cut short', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler([staffPurchaseFixture()], { total: 55 })
    );
    const dialog = await openLink();

    expect(await dialog.findByText(/Mostramos las primeras 20 pre-alertas/)).toBeInTheDocument();
  });
});

describe('link a purchase', () => {
  it('keeps the confirm button disabled until a purchase is chosen', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler());
    const dialog = await openLink();
    await dialog.findByRole('button', { name: /Amazon/ });

    expect(dialog.getByRole('button', { name: TITLE })).toBeDisabled();
    await choose(dialog, /Amazon/);

    expect(dialog.getByRole('button', { name: TITLE })).toBeEnabled();
    expect(dialog.getByRole('button', { name: /Amazon/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('links the chosen purchase, toasts, refreshes and shows the purchase', async () => {
    const bodies: unknown[] = [];
    let current = unassigned();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      purchasesListHandler(),
      packageActionHandler('post', '/link-purchase', packageDetailFixture(), {
        onRequest: (body) => {
          bodies.push(body);
          current = packageStaffDetailFixture({
            purchaseId: PURCHASE_ID,
            purchase: packagePurchaseFixture(),
          });
        },
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await screen.findByText('Compra vinculada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toEqual([{ purchaseId: PURCHASE_ID }]);
    const section = within(await screen.findByRole('region', { name: 'Compra vinculada' }));
    expect(await section.findByText('Amazon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
  });

  it('invalidates the package and the purchases once linked', async () => {
    const { queryClient } = renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler(),
      packageActionHandler('post', '/link-purchase', packageDetailFixture())
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    await screen.findByText('Compra vinculada.');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.packages.all });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.purchases.all });
  });

  it('returns focus to the page heading once the link button is gone', async () => {
    let current = unassigned();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      purchasesListHandler(),
      packageActionHandler('post', '/link-purchase', packageDetailFixture(), {
        onRequest: () => {
          current = packageStaffDetailFixture({
            purchaseId: PURCHASE_ID,
            purchase: packagePurchaseFixture(),
          });
        },
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'WH-000042' })).toHaveFocus()
    );
  });

  it('returns focus to the link button when the operator backs out', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), purchasesListHandler());
    const trigger = await screen.findByRole('button', { name: TITLE });
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: TITLE });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes and explains when the package was linked meanwhile, then refreshes', async () => {
    let current = unassigned();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      purchasesListHandler(),
      packageErrorHandler('post', '/link-purchase', 'PACKAGE_ALREADY_LINKED')
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);
    current = packageStaffDetailFixture({
      purchaseId: OTHER_PURCHASE_ID,
      purchase: packagePurchaseFixture({ id: OTHER_PURCHASE_ID, store: 'Shein' }),
    });

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este paquete ya está vinculado a una compra.'
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByText('Shein')).toBeInTheDocument();
  });

  it.each([
    ['PURCHASE_NOT_PENDING', 409, 'Esa pre-alerta ya fue recibida o cancelada. Elige otra.'],
    ['PURCHASE_NOT_FOUND', 404, 'Esa pre-alerta ya no existe. Elige otra.'],
    [
      'CUSTOMER_PURCHASE_MISMATCH',
      409,
      'Esa pre-alerta pertenece a otro cliente distinto al del paquete. Elige otra.',
    ],
  ])(
    'keeps the picker open on %s and asks to choose another one',
    async (code, status, message) => {
      let listCalls = 0;
      renderPackageDetailPage(
        {},
        packageDetailHandler(unassigned()),
        http.get('*/api/purchases', () => {
          listCalls += 1;
          return HttpResponse.json({
            items: listCalls === 1 ? [staffPurchaseFixture()] : [],
            page: 1,
            pageSize: 20,
            total: listCalls === 1 ? 1 : 0,
          });
        }),
        packageErrorHandler('post', '/link-purchase', code, {}, status)
      );
      const dialog = await openLink();
      await choose(dialog, /Amazon/);

      await userEvent.click(dialog.getByRole('button', { name: TITLE }));

      expect(await dialog.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
      expect(dialog.getByRole('button', { name: TITLE })).toBeDisabled();
      await waitFor(() => expect(dialog.queryByRole('button', { name: /Amazon/ })).toBeNull());
    }
  );

  it('drops the choice when a new search no longer lists the chosen purchase', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      http.get('*/api/purchases', ({ request }) => {
        const searched = new URL(request.url).searchParams.get('search');
        return HttpResponse.json({
          items: searched ? [otherCustomerPurchase()] : [staffPurchaseFixture()],
          page: 1,
          pageSize: 20,
          total: 1,
        });
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);
    expect(dialog.getByRole('button', { name: TITLE })).toBeEnabled();

    await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar pre-alerta' }), 'Shein');

    await dialog.findByRole('button', { name: /Shein/ });
    expect(dialog.getByRole('button', { name: TITLE })).toBeDisabled();
  });

  it('closes and explains when the package no longer exists', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler(),
      packageErrorHandler('post', '/link-purchase', 'PACKAGE_NOT_FOUND', {}, 404)
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este paquete ya no existe.');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the choice when the connection drops and links on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler(),
      http.post('*/api/packages/:id/link-purchase', () => {
        calls += 1;
        return calls === 1 ? HttpResponse.error() : HttpResponse.json(packageDetailFixture());
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos vincular la compra. Revisa tu conexión e inténtalo de nuevo.'
    );
    expect(dialog.getByRole('button', { name: /Amazon/ })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await screen.findByText('Compra vinculada.')).toBeInTheDocument();
  });

  it('keeps the choice on a generic failure and links on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler(),
      http.post('*/api/packages/:id/link-purchase', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(packageDetailFixture());
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos vincular la compra. Inténtalo de nuevo.'
    );
    expect(dialog.getByRole('button', { name: TITLE })).toBeEnabled();

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await screen.findByText('Compra vinculada.')).toBeInTheDocument();
  });

  it('sends one request when confirmed twice in the same tick and cannot be closed meanwhile', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      purchasesListHandler(),
      packageActionHandler('post', '/link-purchase', packageDetailFixture(), {
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openLink();
    await choose(dialog, /Amazon/);
    const confirm = dialog.getByRole('button', { name: TITLE });

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    await userEvent.keyboard('{Escape}');

    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });
});
