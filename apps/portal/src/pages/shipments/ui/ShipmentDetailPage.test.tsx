import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import {
  myPackageDetailFixture,
  myPackageDetailHandler,
  myPackagesListHandler,
  PACKAGE_ID,
} from '@/test/packages-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { renderShipmentDetailPage } from '@/test/shipment-detail-page';

const AGENCY_TIMELINE = [
  { status: 'WAREHOUSE', reachedAt: '2026-03-10T12:00:00.000Z' },
  { status: 'SHIPPED', reachedAt: '2026-03-12T12:00:00.000Z' },
  { status: 'CUSTOMS', reachedAt: '2026-03-15T12:00:00.000Z' },
  { status: 'AGENCY', reachedAt: '2026-03-18T12:00:00.000Z' },
] as const;

describe('ShipmentDetailPage header and data', () => {
  it('shows the warehouse number, the guide and the document title', async () => {
    server.use(myPackageDetailHandler());

    renderShipmentDetailPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000123' })).toBeInTheDocument();
    expect(screen.getByText('Guía TBA123456789')).toBeInTheDocument();
    expect(document.title).toBe('Envío WH-000123 · Rapiexpress');
  });

  it('shows the current status next to the header', async () => {
    server.use(myPackageDetailHandler(myPackageDetailFixture({ status: 'CUSTOMS' })));

    renderShipmentDetailPage();

    const header = (await screen.findByRole('heading', { level: 1 })).closest('header');
    expect(within(header as HTMLElement).getByText('Aduana')).toBeInTheDocument();
  });

  it('shows the package data', async () => {
    server.use(myPackageDetailHandler());

    renderShipmentDetailPage();

    const data = within(await screen.findByRole('region', { name: 'Datos del paquete' }));
    expect(data.getByText('Audífonos inalámbricos')).toBeInTheDocument();
    expect(data.getByText('1,5 lb · 0,68 kg')).toBeInTheDocument();
    expect(data.getByText('4x4')).toBeInTheDocument();
    expect(data.getByText('USD 120,50')).toBeInTheDocument();
    expect(data.getByText('15 mar 2026')).toBeInTheDocument();
  });

  it('falls back when the optional data is missing', async () => {
    server.use(
      myPackageDetailHandler(
        myPackageDetailFixture({ description: null, category: null, declaredValueUsd: null })
      )
    );

    renderShipmentDetailPage();

    const data = within(await screen.findByRole('region', { name: 'Datos del paquete' }));
    expect(data.getByText('Sin descripción')).toBeInTheDocument();
    expect(data.getByText('Sin categoría')).toBeInTheDocument();
    expect(data.getByText('Sin declarar')).toBeInTheDocument();
  });

  it('links back to the shipments list', async () => {
    server.use(myPackageDetailHandler());

    renderShipmentDetailPage();

    await userEvent.click(await screen.findByRole('link', { name: 'Mis envíos' }));

    expect(await screen.findByText('Lista de envíos')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/shipments');
  });

  it('shows a loading skeleton first', async () => {
    server.use(myPackageDetailHandler());

    renderShipmentDetailPage();

    expect(screen.getByRole('status', { name: 'Cargando envío' })).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1, name: 'WH-000123' });
  });
});

describe('ShipmentDetailPage timeline', () => {
  async function findSteps() {
    const timeline = await screen.findByRole('list', { name: 'Seguimiento del envío' });
    return within(timeline).getAllByRole('listitem');
  }

  it('shows reached steps with their date, the current step highlighted and the rest pending', async () => {
    server.use(
      myPackageDetailHandler(
        myPackageDetailFixture({
          status: 'CUSTOMS',
          timeline: AGENCY_TIMELINE.slice(0, 3).map((step) => ({ ...step })),
        })
      )
    );

    renderShipmentDetailPage();

    const steps = await findSteps();
    expect(steps).toHaveLength(5);
    expect(steps[0]).toHaveTextContent('Bodega, completado');
    expect(steps[0]).toHaveTextContent('10 mar 2026');
    expect(steps[1]).toHaveTextContent('Embarcado, completado');
    expect(steps[1]).toHaveTextContent('12 mar 2026');
    expect(steps[2]).toHaveTextContent('Aduana, paso actual');
    expect(steps[2]).toHaveTextContent('15 mar 2026');
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(steps[3]).toHaveTextContent('Agencia, pendiente');
    expect(steps[4]).toHaveTextContent('Entregado, pendiente');
    expect(steps[3]).not.toHaveTextContent(/\d{4}/);
    expect(steps.filter((step) => step.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('completes every step once the package is delivered', async () => {
    server.use(
      myPackageDetailHandler(
        myPackageDetailFixture({
          status: 'DELIVERED',
          timeline: [
            ...AGENCY_TIMELINE.map((step) => ({ ...step })),
            { status: 'DELIVERED', reachedAt: '2026-03-20T12:00:00.000Z' },
          ],
        })
      )
    );

    renderShipmentDetailPage();

    const steps = await findSteps();
    for (const step of steps) expect(step).toHaveTextContent('completado');
    expect(steps[4]).toHaveTextContent('20 mar 2026');
  });
});

describe('ShipmentDetailPage ready for pickup', () => {
  it('calls out a package that is ready for pickup', async () => {
    server.use(
      myPackageDetailHandler(
        myPackageDetailFixture({
          status: 'AGENCY',
          readyForPickup: true,
          timeline: AGENCY_TIMELINE.map((step) => ({ ...step })),
        })
      )
    );

    renderShipmentDetailPage();

    expect(await screen.findByText('Listo para retirar')).toBeInTheDocument();
    expect(screen.getByText(/ya está en la agencia/)).toBeInTheDocument();
  });

  it('shows no callout for a package that is still on its way', async () => {
    server.use(
      myPackageDetailHandler(
        myPackageDetailFixture({
          status: 'AGENCY',
          readyForPickup: false,
          timeline: AGENCY_TIMELINE.map((step) => ({ ...step })),
        })
      )
    );

    renderShipmentDetailPage();

    await screen.findByRole('heading', { level: 1, name: 'WH-000123' });
    expect(screen.queryByText('Listo para retirar')).not.toBeInTheDocument();
  });
});

describe('ShipmentDetailPage errors', () => {
  it('shows a not-found state with a link back to the list', async () => {
    server.use(
      http.get('*/api/me/packages/:id', () =>
        HttpResponse.json(
          { statusCode: 404, code: 'PACKAGE_NOT_FOUND', message: 'Package not found' },
          { status: 404 }
        )
      )
    );

    renderShipmentDetailPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos este envío' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.title).toBe('Envío no encontrado · Rapiexpress');

    await userEvent.click(screen.getByRole('link', { name: 'Ver mis envíos' }));
    expect(await screen.findByText('Lista de envíos')).toBeInTheDocument();
  });

  it('shows the not-found state for an id that is not a UUID without calling the API', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/me/packages/:id', () => {
        calls += 1;
        return new HttpResponse(null, { status: 400 });
      })
    );

    renderShipmentDetailPage('..%2Fauth');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No encontramos este envío' })
    ).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('shows an error with a working retry for any other failure', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/me/packages/:id', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(myPackageDetailFixture());
      })
    );

    renderShipmentDetailPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar este envío.');
    expect(screen.queryByText('No encontramos este envío')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000123' })).toBeInTheDocument();
  });
});

describe('ShipmentDetailPage route', () => {
  it('is reachable inside the authenticated layout', async () => {
    server.use(refreshOkHandler(), meHandler(), myPackageDetailHandler());

    renderWithProviders(<AppRoutes />, { route: `/shipments/${PACKAGE_ID}` });

    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000123' })).toBeInTheDocument();
  });

  it('opens the detail of the package picked in the list', async () => {
    server.use(
      refreshOkHandler(),
      meHandler(),
      myPackagesListHandler(),
      myPackageDetailHandler(myPackageDetailFixture({ status: 'CUSTOMS' }))
    );

    renderWithProviders(<AppRoutes />, { route: '/shipments' });

    await userEvent.click(await screen.findByRole('link', { name: 'WH-000123' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'WH-000123' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Datos del paquete' })).toBeInTheDocument();
  });
});
