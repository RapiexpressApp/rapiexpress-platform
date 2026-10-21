import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  createGate,
  packageActionHandler,
  packageDetailHandler,
  packageErrorHandler,
  packageStaffDetailFixture,
} from '@/test/packages-handlers';
import {
  CUSTOMER_ID,
  customerSearchHandler,
  customerSummaryFixture,
  OTHER_CUSTOMER_ID,
  packageDetailFixture,
} from '@/test/reception-handlers';

const unassigned = () =>
  packageStaffDetailFixture({
    customer: null,
    label: { warehouseNumber: 'WH-000042', customerName: null, lockerCode: null },
  });

const TITLE = 'Asignar cliente';

async function openAssign() {
  await userEvent.click(await screen.findByRole('button', { name: TITLE }));
  return within(await screen.findByRole('dialog', { name: TITLE }));
}

async function search(dialog: ReturnType<typeof within>, term: string) {
  await userEvent.type(dialog.getByRole('searchbox', { name: 'Buscar cliente' }), term);
}

async function pick(dialog: ReturnType<typeof within>, name: RegExp | string) {
  await userEvent.click(await dialog.findByRole('button', { name }));
}

describe('assign a customer availability', () => {
  it('offers the action while the package has no customer', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()));

    expect(await screen.findByRole('button', { name: TITLE })).toBeInTheDocument();
  });

  it('hides the action once the package has a customer', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });

    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
  });

  it.each(['ADMIN', 'OPERATIONS', 'WAREHOUSE'])('lets %s assign a customer', async (role) => {
    renderPackageDetailPage({ role }, packageDetailHandler(unassigned()));

    expect(await screen.findByRole('button', { name: TITLE })).toBeInTheDocument();
  });
});

describe('assign a customer', () => {
  it('searches among the scoped reception customers', async () => {
    const requests: URL[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler([customerSummaryFixture()], (url) => requests.push(url))
    );
    const dialog = await openAssign();

    await search(dialog, 'Jane');

    expect(await dialog.findByRole('button', { name: /Jane Doe/ })).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('search')).toBe('Jane');
  });

  it('warns that only the first ten customers are shown', async () => {
    const customers = Array.from({ length: 10 }, (_, index) =>
      customerSummaryFixture({ id: `c-${index}`, name: `Cliente${index}` })
    );
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler(customers)
    );
    const dialog = await openAssign();

    await search(dialog, 'Cli');

    expect(await dialog.findByText(/Mostramos los primeros 10 clientes/)).toBeInTheDocument();
  });

  it('asks to confirm the chosen customer, then assigns and shows the customer', async () => {
    const bodies: unknown[] = [];
    let current = unassigned();
    const assigned = packageDetailFixture({ customer: customerSummaryFixture() });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      customerSearchHandler(),
      packageActionHandler('post', '/assign-customer', assigned, {
        onRequest: (body) => {
          bodies.push(body);
          current = packageStaffDetailFixture();
        },
      })
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);

    expect(dialog.getByText(/El paquete WH-000042 quedará asignado a/)).toBeInTheDocument();
    expect(dialog.getByText(/Jane Doe · MI-00001/)).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await screen.findByText('Cliente asignado.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toEqual([{ customerId: CUSTOMER_ID }]);
    const section = within(await screen.findByRole('region', { name: 'Cliente' }));
    expect(await section.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
  });

  it('goes back to the search to choose someone else without sending anything', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler([
        customerSummaryFixture(),
        customerSummaryFixture({ id: OTHER_CUSTOMER_ID, name: 'Rosa', lastName: 'Pérez' }),
      ]),
      packageActionHandler('post', '/assign-customer', packageDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openAssign();
    await search(dialog, 'Ja');
    await pick(dialog, /Jane Doe/);

    await userEvent.click(dialog.getByRole('button', { name: 'Elegir otro cliente' }));

    expect(await dialog.findByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('returns focus to the page heading once the assign button is gone', async () => {
    let current = unassigned();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      customerSearchHandler(),
      packageActionHandler('post', '/assign-customer', packageDetailFixture(), {
        onRequest: () => {
          current = packageStaffDetailFixture();
        },
      })
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'WH-000042' })).toHaveFocus()
    );
  });

  it('returns focus to the assign button when the operator backs out', async () => {
    renderPackageDetailPage({}, packageDetailHandler(unassigned()), customerSearchHandler());
    const trigger = await screen.findByRole('button', { name: TITLE });
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: TITLE });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe('assign a customer failures', () => {
  it('closes and explains when someone assigned the package first, then refreshes', async () => {
    let current = unassigned();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      customerSearchHandler(),
      packageErrorHandler('post', '/assign-customer', 'PACKAGE_ALREADY_ASSIGNED')
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);
    current = packageStaffDetailFixture({
      customer: customerSummaryFixture({ id: OTHER_CUSTOMER_ID, name: 'Rosa', lastName: 'Pérez' }),
    });

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este paquete ya tiene un cliente asignado.'
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByText('Rosa Pérez')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TITLE })).toBeNull();
  });

  it('asks for another customer when the chosen one is not active', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler(),
      packageErrorHandler('post', '/assign-customer', 'CUSTOMER_NOT_FOUND', {}, 404)
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'El cliente ya no está activo. Elige otro cliente.'
    );
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
    expect(await dialog.findByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument();
  });

  it('keeps the chosen customer on a generic failure and assigns on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler(),
      http.post('*/api/packages/:id/assign-customer', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(packageDetailFixture());
      })
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos asignar el cliente. Inténtalo de nuevo.'
    );
    expect(dialog.getByText(/Jane Doe · MI-00001/)).toBeInTheDocument();

    await userEvent.click(dialog.getByRole('button', { name: TITLE }));
    expect(await screen.findByText('Cliente asignado.')).toBeInTheDocument();
  });
});

describe('assign a customer while pending', () => {
  it('sends one request when confirmed twice in the same tick and cannot be closed meanwhile', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(unassigned()),
      customerSearchHandler(),
      packageActionHandler('post', '/assign-customer', packageDetailFixture(), {
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openAssign();
    await search(dialog, 'Jane');
    await pick(dialog, /Jane Doe/);
    const confirm = dialog.getByRole('button', { name: TITLE });

    await act(async () => {
      fireEvent.click(confirm);
      fireEvent.click(confirm);
    });
    await userEvent.keyboard('{Escape}');

    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Elegir otro cliente' })).toBeDisabled();
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });
});
