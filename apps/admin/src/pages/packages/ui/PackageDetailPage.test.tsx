import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  packageDetailHandler,
  packageEventFixture,
  packageIncidentFixture,
  packageNotFoundHandler,
  packagePurchaseFixture,
  packageStaffDetailFixture,
  staffUserFixture,
} from '@/test/packages-handlers';
import { customerSummaryFixture } from '@/test/reception-handlers';

async function findSection(name: string) {
  return screen.findByRole('region', { name });
}

describe('PackageDetailPage header', () => {
  it('names the package and its internal status', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ status: 'AT_AGENCY' }))
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000042' })).toBeInTheDocument();
    expect(screen.getByText('En agencia')).toBeInTheDocument();
    expect(screen.getByText(/Guía 1Z999AA10123456784/)).toBeInTheDocument();
  });

  it('links back to the list of packages', async () => {
    renderPackageDetailPage({}, packageDetailHandler());

    await userEvent.click(await screen.findByRole('link', { name: 'Paquetes' }));

    expect(await screen.findByText('Listado de paquetes')).toBeInTheDocument();
  });

  it('flags an open incident next to the status', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({
          openIncident: packageIncidentFixture(),
          incidents: [packageIncidentFixture()],
        })
      )
    );
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });

    const header = screen.getByRole('banner');
    expect(within(header).getByText('Incidencia abierta')).toBeInTheDocument();
  });

  it('shows no incident flag when there is none', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });

    expect(screen.queryByText('Incidencia abierta')).toBeNull();
  });
});

describe('PackageDetailPage data', () => {
  it('shows the package data with both weights', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ packageType: 'FRAGILE' }))
    );
    const section = within(await findSection('Datos del paquete'));

    expect(section.getByText('Frágil')).toBeInTheDocument();
    expect(section.getByText('G (migrante)')).toBeInTheDocument();
    expect(section.getByText('2,5 lb · 1,13 kg')).toBeInTheDocument();
    expect(section.getByText('USD 59,99')).toBeInTheDocument();
    expect(section.getByText('Zapatos deportivos')).toBeInTheDocument();
    expect(section.getByText('Caja con una esquina golpeada')).toBeInTheDocument();
    expect(section.getByText('1Z999AA10123456784')).toBeInTheDocument();
    expect(section.getByText('15 mar 2026')).toBeInTheDocument();
  });

  it('says what is missing instead of leaving blanks', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({
          category: null,
          declaredValueUsd: null,
          description: null,
          notes: null,
        })
      )
    );
    const section = within(await findSection('Datos del paquete'));

    expect(section.getByText('Sin categoría')).toBeInTheDocument();
    expect(section.getByText('Sin valor declarado')).toBeInTheDocument();
    expect(section.getByText('Sin descripción')).toBeInTheDocument();
    expect(section.getByText('Sin notas')).toBeInTheDocument();
  });

  it.each([
    [false, 'No'],
    [true, 'Sí, se confirmó pese a una guía repetida'],
  ])('reports the duplicate flag %s', async (duplicateConfirmed, text) => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ duplicateConfirmed }))
    );
    const section = within(await findSection('Datos del paquete'));

    expect(section.getByText(text)).toBeInTheDocument();
  });
});

describe('PackageDetailPage customer and purchase', () => {
  it('shows the customer with the locker', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const section = within(await findSection('Cliente'));

    expect(section.getByText('Jane Doe')).toBeInTheDocument();
    expect(section.getByText('MI-00001')).toBeInTheDocument();
  });

  it('names a customer without a locker without inventing one', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({ customer: customerSummaryFixture({ lockerCode: null }) })
      )
    );
    const section = within(await findSection('Cliente'));

    expect(section.getByText('Sin casillero')).toBeInTheDocument();
  });

  it('says the package is unassigned', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ customer: null }))
    );
    const section = within(await findSection('Cliente'));

    expect(section.getByText('Sin asignar')).toBeInTheDocument();
  });

  it('summarizes the linked purchase', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({
          purchaseId: packagePurchaseFixture().id,
          purchase: packagePurchaseFixture(),
        })
      )
    );
    const section = within(await findSection('Compra vinculada'));

    expect(section.getByText('Amazon')).toBeInTheDocument();
    expect(section.getByText('1Z999AA10123456784')).toBeInTheDocument();
    expect(section.getByText('USD 59,99')).toBeInTheDocument();
    expect(section.getByText('2,5 lb')).toBeInTheDocument();
    expect(section.getByText('G (migrante)')).toBeInTheDocument();
    expect(section.getByText('10 mar 2026')).toBeInTheDocument();
  });

  it('says there is no linked purchase', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const section = within(await findSection('Compra vinculada'));

    expect(section.getByText('Sin compra vinculada')).toBeInTheDocument();
  });
});

describe('PackageDetailPage history', () => {
  it('lists the status changes oldest first with who made them', async () => {
    const events = [
      packageEventFixture({ fromStatus: null, toStatus: 'IN_WAREHOUSE' }),
      packageEventFixture({
        fromStatus: 'IN_WAREHOUSE',
        toStatus: 'IN_BAG',
        source: 'MANUAL',
        actor: staffUserFixture({ name: 'Luis', lastName: 'Pérez' }),
        occurredAt: '2026-03-16T14:05:00.000Z',
      }),
      packageEventFixture({
        fromStatus: 'IN_BAG',
        toStatus: 'SHIPPED',
        source: 'MANUAL',
        occurredAt: '2026-03-17T09:30:00.000Z',
      }),
    ];
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ status: 'SHIPPED', events }))
    );
    const section = within(await findSection('Historial'));

    const items = section.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('En bodega');
    expect(items[0]).not.toHaveTextContent('→');
    expect(items[0]).toHaveTextContent('Recepción');
    expect(items[0]).toHaveTextContent('Ana Rojas');
    expect(items[0]).toHaveTextContent('15 mar 2026, 12:00');
    expect(items[1]).toHaveTextContent('En bodega → En saco');
    expect(items[1]).toHaveTextContent('Manual');
    expect(items[1]).toHaveTextContent('Luis Pérez');
    expect(items[1]).toHaveTextContent('16 mar 2026, 14:05');
    expect(items[2]).toHaveTextContent('En saco → Embarcado');
  });

  it('puts the oldest event first even when the server sends them mixed', async () => {
    const events = [
      packageEventFixture({
        fromStatus: 'IN_WAREHOUSE',
        toStatus: 'IN_BAG',
        occurredAt: '2026-03-16T14:05:00.000Z',
      }),
      packageEventFixture({ occurredAt: '2026-03-15T12:00:00.000Z' }),
    ];
    renderPackageDetailPage({}, packageDetailHandler(packageStaffDetailFixture({ events })));
    const section = within(await findSection('Historial'));

    const items = section.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('15 mar 2026');
    expect(items[1]).toHaveTextContent('En bodega → En saco');
  });
});

describe('PackageDetailPage incidents', () => {
  it('says when there are no incidents', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const section = within(await findSection('Incidencias'));

    expect(section.getByText('Sin incidencias registradas')).toBeInTheDocument();
  });

  it('shows the open incident and keeps the resolved ones as history', async () => {
    const resolved = packageIncidentFixture({
      id: 'resolved-1',
      type: 'LOST',
      reason: 'No aparecía en el sacón',
      resolvedBy: staffUserFixture({ name: 'Luis', lastName: 'Pérez' }),
      resolvedAt: '2026-03-18T10:00:00.000Z',
      resolutionNote: 'Apareció en otro sacón',
    });
    const open = packageIncidentFixture({ type: 'CUSTOMS_HOLD', reason: 'Retenido por revisión' });
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({ openIncident: open, incidents: [resolved, open] })
      )
    );
    const section = within(await findSection('Incidencias'));

    const current = within(section.getByRole('group', { name: 'Incidencia abierta' }));
    expect(current.getByText('Retenido en aduana')).toBeInTheDocument();
    expect(current.getByText('Retenido por revisión')).toBeInTheDocument();
    expect(current.getByText(/Ana Rojas/)).toBeInTheDocument();

    const history = within(section.getByRole('list', { name: 'Incidencias resueltas' }));
    expect(history.getAllByRole('listitem')).toHaveLength(1);
    expect(history.getByText('Extraviado')).toBeInTheDocument();
    expect(history.getByText('No aparecía en el sacón')).toBeInTheDocument();
    expect(history.getByText(/Luis Pérez/)).toBeInTheDocument();
    expect(history.getByText('Apareció en otro sacón')).toBeInTheDocument();
  });

  it('shows resolved incidents without a note', async () => {
    const resolved = packageIncidentFixture({
      resolvedBy: staffUserFixture(),
      resolvedAt: '2026-03-18T10:00:00.000Z',
    });
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ incidents: [resolved] }))
    );
    const section = within(await findSection('Incidencias'));

    expect(section.getByText('Sin nota de resolución')).toBeInTheDocument();
    expect(section.queryByRole('group', { name: 'Incidencia abierta' })).toBeNull();
  });
});

describe('PackageDetailPage states', () => {
  it('shows a loading state first', async () => {
    renderPackageDetailPage({}, packageDetailHandler());

    expect(screen.getByRole('status', { name: 'Cargando paquete' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000042' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Cargando paquete' })).toBeNull();
  });

  it('shows the not found state for an id that is not a UUID, without a request', async () => {
    const onRequest = vi.fn();
    renderPackageDetailPage({ id: 'abc' }, packageDetailHandler(undefined, onRequest));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos este paquete' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver paquetes' })).toHaveAttribute('href', '/paquetes');
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('shows the not found state when the package does not exist', async () => {
    renderPackageDetailPage({}, packageNotFoundHandler());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos este paquete' })
    ).toBeInTheDocument();
  });

  it('offers a retry for any other failure', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(packageStaffDetailFixture());
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar este paquete.');
    expect(screen.queryByText('No encontramos este paquete')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000042' })).toBeInTheDocument();
  });
});
