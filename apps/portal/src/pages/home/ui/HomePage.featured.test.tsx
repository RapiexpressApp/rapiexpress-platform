import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderHomePage } from '@/test/home-page';
import {
  myPackageDetailFixture,
  myPackageDetailHandler,
  myPackageFixture,
  myPackagesBackendHandler,
} from '@/test/packages-handlers';

type Status = 'WAREHOUSE' | 'SHIPPED' | 'CUSTOMS' | 'AGENCY' | 'DELIVERED';

const pkg = (id: string, status: Status, receivedAt: string, readyForPickup = false) =>
  myPackageFixture({
    id,
    status,
    receivedAt,
    readyForPickup,
    warehouseNumber: `WH-${id}`,
    description: `Compra ${id}`,
  });

const detailOf = (
  id: string,
  status: Status,
  timeline: { status: Status; reachedAt: string }[],
  readyForPickup = false
) =>
  myPackageDetailFixture({
    id,
    status,
    readyForPickup,
    timeline,
    warehouseNumber: `WH-${id}`,
    description: `Compra ${id}`,
  });

const READY = pkg('ready', 'AGENCY', '2026-03-01T12:00:00.000Z', true);
const NEWER = [
  pkg('n1', 'WAREHOUSE', '2026-03-20T12:00:00.000Z'),
  pkg('n2', 'SHIPPED', '2026-03-19T12:00:00.000Z'),
  pkg('n3', 'DELIVERED', '2026-03-18T12:00:00.000Z'),
  pkg('n4', 'DELIVERED', '2026-03-17T12:00:00.000Z'),
  pkg('n5', 'DELIVERED', '2026-03-16T12:00:00.000Z'),
];

const READY_DETAIL = detailOf(
  'ready',
  'AGENCY',
  [
    { status: 'WAREHOUSE', reachedAt: '2026-03-01T12:00:00.000Z' },
    { status: 'SHIPPED', reachedAt: '2026-03-03T12:00:00.000Z' },
    { status: 'CUSTOMS', reachedAt: '2026-03-05T12:00:00.000Z' },
    { status: 'AGENCY', reachedAt: '2026-03-08T12:00:00.000Z' },
  ],
  true
);

async function findFeatured(description: string) {
  return within(await screen.findByRole('region', { name: description }, { timeout: 3000 }));
}

describe('HomePage featured shipment', () => {
  it('features a package ready for pickup even when it is outside the latest five', async () => {
    renderHomePage(
      myPackagesBackendHandler([...NEWER, READY]),
      myPackageDetailHandler(READY_DETAIL)
    );

    const featured = await findFeatured('Compra ready');
    expect(featured.getByText('Listo para retirar')).toBeInTheDocument();
    expect(featured.getByText(/WH-ready/)).toBeInTheDocument();
  });

  it('features the newest package that is not delivered when none is ready', async () => {
    const packages = [
      pkg('d1', 'DELIVERED', '2026-03-22T12:00:00.000Z'),
      pkg('customs', 'CUSTOMS', '2026-03-10T12:00:00.000Z'),
      pkg('wh', 'WAREHOUSE', '2026-03-12T12:00:00.000Z'),
    ];
    renderHomePage(
      myPackagesBackendHandler(packages),
      myPackageDetailHandler(
        detailOf('wh', 'WAREHOUSE', [
          { status: 'WAREHOUSE', reachedAt: '2026-03-12T12:00:00.000Z' },
        ])
      )
    );

    const featured = await findFeatured('Compra wh');
    expect(featured.getByText('Tu envío más reciente')).toBeInTheDocument();
    expect(featured.queryByText('Listo para retirar')).not.toBeInTheDocument();
  });

  it('shows the shared timeline from the detail endpoint', async () => {
    renderHomePage(myPackagesBackendHandler([READY]), myPackageDetailHandler(READY_DETAIL));

    const featured = await findFeatured('Compra ready');
    const steps = within(await featured.findByRole('list', { name: 'Seguimiento del envío' }));
    const items = steps.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent('Bodega, completado');
    expect(items[0]).toHaveTextContent('1 mar 2026');
    expect(items[3]).toHaveTextContent('Agencia, paso actual');
    expect(items[3]).toHaveTextContent('8 mar 2026');
    expect(items[4]).toHaveTextContent('Entregado, pendiente');
  });

  it('links to the detail of the featured package', async () => {
    renderHomePage(myPackagesBackendHandler([READY]), myPackageDetailHandler(READY_DETAIL));

    const featured = await findFeatured('Compra ready');
    await userEvent.click(featured.getByRole('link', { name: 'Ver detalle del envío' }));

    expect(await screen.findByText('Detalle del envío')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/shipments/ready');
  });

  it('shows no featured block for an account without packages', async () => {
    renderHomePage();

    await screen.findByText('Aún no tienes envíos');
    expect(screen.queryByRole('link', { name: 'Ver detalle del envío' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: 'Cargando envío destacado' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no featured block when every package is delivered', async () => {
    renderHomePage(
      myPackagesBackendHandler([
        pkg('d1', 'DELIVERED', '2026-03-22T12:00:00.000Z'),
        pkg('d2', 'DELIVERED', '2026-03-21T12:00:00.000Z'),
      ])
    );

    await screen.findByRole('link', { name: 'WH-d1' });
    expect(screen.queryByRole('link', { name: 'Ver detalle del envío' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: 'Cargando envío destacado' })
    ).not.toBeInTheDocument();
  });

  it('shows a loading state first', async () => {
    renderHomePage(myPackagesBackendHandler([READY]), myPackageDetailHandler(READY_DETAIL));

    expect(screen.getByRole('status', { name: 'Cargando envío destacado' })).toBeInTheDocument();
    await findFeatured('Compra ready');
  });

  it('fails on its own when the detail cannot be loaded, and retries', async () => {
    let calls = 0;
    renderHomePage(
      myPackagesBackendHandler([READY]),
      http.get('*/api/me/packages/:id', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(READY_DETAIL);
      })
    );

    const alert = await screen.findByText('No pudimos cargar tu envío destacado.', undefined, {
      timeout: 3000,
    });
    expect(alert).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'WH-ready' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await findFeatured('Compra ready')).toBeTruthy();
    expect(screen.queryByText('No pudimos cargar tu envío destacado.')).not.toBeInTheDocument();
  });
});
