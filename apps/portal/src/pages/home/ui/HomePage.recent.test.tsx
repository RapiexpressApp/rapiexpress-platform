import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { findHomeSection, renderHomePage } from '@/test/home-page';
import {
  myPackageFixture,
  myPackagesBackendHandler,
  myPackagesListHandler,
} from '@/test/packages-handlers';

describe('HomePage recent shipments', () => {
  it('shows the latest packages with their status and a link to each detail', async () => {
    renderHomePage(
      myPackagesListHandler([
        myPackageFixture({ id: 'a', warehouseNumber: 'WH-000001', status: 'CUSTOMS' }),
        myPackageFixture({
          id: 'b',
          warehouseNumber: 'WH-000002',
          status: 'AGENCY',
          readyForPickup: true,
        }),
      ])
    );

    const recent = await findHomeSection('Envíos recientes');
    const list = within(await recent.findByRole('list', { name: 'Envíos' }));
    expect(list.getByRole('link', { name: 'WH-000001' })).toBeInTheDocument();
    expect(list.getByText('Aduana')).toBeInTheDocument();
    expect(list.getByText('Listo para retirar')).toBeInTheDocument();

    await userEvent.click(list.getByRole('link', { name: 'WH-000002' }));
    expect(await screen.findByText('Detalle del envío')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/shipments/b');
  });

  it('asks for the five latest packages without a status filter', async () => {
    const requests: URL[] = [];
    renderHomePage(myPackagesBackendHandler([myPackageFixture()], (url) => requests.push(url)));

    const section = await findHomeSection('Envíos recientes');
    await section.findByRole('list', { name: 'Envíos' });

    const recent = requests.find((url) => !url.searchParams.has('status'));
    expect(recent?.searchParams.get('page')).toBe('1');
    expect(recent?.searchParams.get('pageSize')).toBe('5');
  });

  it('links to the full list', async () => {
    renderHomePage(myPackagesListHandler());

    const recent = await findHomeSection('Envíos recientes');
    await userEvent.click(await recent.findByRole('link', { name: 'Ver todos' }));

    expect(await screen.findByText('Lista de envíos')).toBeInTheDocument();
  });

  it('shows an empty state that points to the first pre-alert', async () => {
    renderHomePage();

    const recent = await findHomeSection('Envíos recientes');
    expect(await recent.findByText('Aún no tienes envíos')).toBeInTheDocument();
    expect(recent.queryByRole('link', { name: 'Ver todos' })).not.toBeInTheDocument();

    await userEvent.click(recent.getByRole('link', { name: 'Pre-alertar mi primera compra' }));
    expect(await screen.findByText('Lista de pre-alertas')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toHaveTextContent('?new=1');
  });

  it('shows a loading state first', async () => {
    renderHomePage(myPackagesListHandler());

    const recent = await findHomeSection('Envíos recientes');
    expect(recent.getByRole('status', { name: 'Cargando envíos recientes' })).toBeInTheDocument();
    await recent.findByRole('list', { name: 'Envíos' });
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    renderHomePage(
      http.get('*/api/me/packages', ({ request }) => {
        if (new URL(request.url).searchParams.has('status')) return HttpResponse.json(EMPTY_LIST);
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ ...EMPTY_LIST, items: [myPackageFixture()], total: 1 });
      })
    );

    const recent = await findHomeSection('Envíos recientes');
    expect(await recent.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tus envíos recientes.'
    );

    await userEvent.click(recent.getByRole('button', { name: 'Reintentar' }));
    expect(await recent.findByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
  });
});

const EMPTY_LIST = { items: [], page: 1, pageSize: 5, total: 0 };
