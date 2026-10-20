import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { PACKAGE_ID, packageListItemFixture, packagesListHandler } from '@/test/packages-handlers';
import { renderPackagesPage } from '@/test/packages-page';

const location = () => screen.getByTestId('location');

function getCardLink(name: string) {
  return within(screen.getByRole('list', { name: 'Paquetes' })).getByRole('link', { name });
}

describe('PackagesPage listing', () => {
  it('lists the packages with a link to each detail', async () => {
    renderPackagesPage('/paquetes', packagesListHandler());

    expect(await screen.findByRole('heading', { level: 1, name: 'Paquetes' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'WH-000042' })).toHaveAttribute(
      'href',
      `/paquetes/${PACKAGE_ID}`
    );
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });

  it('opens the detail of the package that was picked', async () => {
    renderPackagesPage('/paquetes', packagesListHandler());

    await userEvent.click(await screen.findByRole('link', { name: 'WH-000042' }));

    expect(await screen.findByText('Detalle del paquete')).toBeInTheDocument();
    expect(location()).toHaveTextContent(`/paquetes/${PACKAGE_ID}`);
  });

  it('shows a loading state, then the empty state of an empty warehouse', async () => {
    renderPackagesPage('/paquetes', packagesListHandler([]));

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no hay paquetes recibidos.')).toBeInTheDocument();
  });

  it('shows an error with a retry that loads the list', async () => {
    let calls = 0;
    renderPackagesPage(
      '/paquetes',
      http.get('*/api/packages', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({
              items: [packageListItemFixture()],
              page: 1,
              pageSize: 20,
              total: 1,
            });
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los paquetes.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: 'WH-000042' })).toBeInTheDocument();
  });
});

describe('PackagesPage search and filters', () => {
  it('debounces the search into the URL and the request, and resets the page', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes?page=3',
      packagesListHandler([packageListItemFixture()], {
        total: 90,
        onRequest: (url) => requests.push(url),
      })
    );
    await screen.findByRole('link', { name: 'WH-000042' });
    const initial = requests.length;

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar paquetes' }), 'MI-00001');

    await waitFor(() => expect(location()).toHaveTextContent('?search=MI-00001'));
    await waitFor(() => expect(requests.length).toBeGreaterThan(initial));
    expect(requests.slice(initial)).toHaveLength(1);
    expect(requests.at(-1)?.searchParams.get('search')).toBe('MI-00001');
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('sends the chosen status and resets the page', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes?page=2',
      packagesListHandler([packageListItemFixture()], {
        total: 30,
        onRequest: (url) => requests.push(url),
      })
    );
    await screen.findByRole('link', { name: 'WH-000042' });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'En aduana');

    await waitFor(() => expect(location()).toHaveTextContent('?status=IN_CUSTOMS'));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('IN_CUSTOMS'));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('sends the unassigned and incident filters only while they are on', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes',
      packagesListHandler([packageListItemFixture()], { onRequest: (url) => requests.push(url) })
    );
    await screen.findByRole('link', { name: 'WH-000042' });
    expect(requests.at(-1)?.searchParams.has('unassigned')).toBe(false);
    expect(requests.at(-1)?.searchParams.has('hasIncident')).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Sin cliente asignado' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('unassigned')).toBe('true'));

    await userEvent.click(screen.getByRole('button', { name: 'Con incidencia abierta' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('hasIncident')).toBe('true'));
    expect(location()).toHaveTextContent('unassigned=true');
    expect(location()).toHaveTextContent('hasIncident=true');

    await userEvent.click(screen.getByRole('button', { name: 'Sin cliente asignado' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('unassigned')).toBe(false));
    expect(requests.at(-1)?.searchParams.get('hasIncident')).toBe('true');
  });

  it('restores the filters from the URL', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes?status=SHIPPED&unassigned=true&hasIncident=true&search=ana',
      packagesListHandler([packageListItemFixture()], { onRequest: (url) => requests.push(url) })
    );
    await screen.findByRole('link', { name: 'WH-000042' });

    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('SHIPPED');
    expect(screen.getByRole('button', { name: 'Sin cliente asignado' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Con incidencia abierta' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('searchbox', { name: 'Buscar paquetes' })).toHaveValue('ana');
    const params = requests[0]?.searchParams;
    expect(params?.get('status')).toBe('SHIPPED');
    expect(params?.get('unassigned')).toBe('true');
    expect(params?.get('hasIncident')).toBe('true');
    expect(params?.get('search')).toBe('ana');
  });

  it('ignores a status in the URL that does not exist', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes?status=WAREHOUSE',
      packagesListHandler([packageListItemFixture()], { onRequest: (url) => requests.push(url) })
    );
    await screen.findByRole('link', { name: 'WH-000042' });

    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('');
  });

  it('explains an empty filtered list and clears the filters from there', async () => {
    renderPackagesPage(
      '/paquetes?status=DELIVERED&hasIncident=true&search=zzz',
      http.get('*/api/packages', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const filtered = params.has('status') || params.has('hasIncident') || params.has('search');
        return HttpResponse.json({
          items: filtered ? [] : [packageListItemFixture()],
          page: 1,
          pageSize: 20,
          total: filtered ? 0 : 1,
        });
      })
    );

    expect(
      await screen.findByText('No encontramos paquetes con estos filtros.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(await screen.findByRole('link', { name: 'WH-000042' })).toBeInTheDocument();
    expect(location()).toHaveTextContent(/^\/paquetes$/);
    expect(screen.getByRole('searchbox', { name: 'Buscar paquetes' })).toHaveValue('');
  });
});

describe('PackagesPage pagination', () => {
  it('moves to the next page through the URL', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes',
      packagesListHandler([packageListItemFixture()], {
        total: 45,
        onRequest: (url) => requests.push(url),
      })
    );
    await screen.findByText('Página 1 de 3');

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(location()).toHaveTextContent('page=2'));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('page')).toBe('2');
  });

  it.each(['0', '1e21', '99999999999', 'abc'])(
    'requests the first page when the URL says page=%s',
    async (page) => {
      const requests: URL[] = [];
      renderPackagesPage(
        `/paquetes?page=${page}`,
        packagesListHandler([packageListItemFixture()], { onRequest: (url) => requests.push(url) })
      );
      await screen.findByRole('link', { name: 'WH-000042' });

      expect(requests[0]?.searchParams.get('page')).toBe('1');
    }
  );

  it('leaves a page past the end for the last one that has packages', async () => {
    const requests: URL[] = [];
    renderPackagesPage(
      '/paquetes?page=9',
      http.get('*/api/packages', ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const page = Number(url.searchParams.get('page'));
        return HttpResponse.json({
          items: page <= 3 ? [packageListItemFixture()] : [],
          page,
          pageSize: 20,
          total: 45,
        });
      })
    );

    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument();
    expect(location()).toHaveTextContent('page=3');
    expect(requests.map((url) => url.searchParams.get('page'))).toEqual(['9', '3']);
  });

  it('falls back to the first page when the filtered list is empty', async () => {
    renderPackagesPage(
      '/paquetes?page=4&status=DELIVERED',
      http.get('*/api/packages', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json({ items: [], page, pageSize: 20, total: 0 });
      })
    );

    expect(
      await screen.findByText('No encontramos paquetes con estos filtros.')
    ).toBeInTheDocument();
    expect(location()).not.toHaveTextContent('page=');
  });
});

describe('PackagesPage cards', () => {
  it('keeps every row reachable as a link on narrow screens', async () => {
    renderPackagesPage(
      '/paquetes',
      packagesListHandler([
        packageListItemFixture(),
        packageListItemFixture({ id: 'second', warehouseNumber: 'WH-000043', customer: null }),
      ])
    );
    await screen.findByRole('list', { name: 'Paquetes' });

    expect(getCardLink('WH-000042')).toBeInTheDocument();
    expect(getCardLink('WH-000043')).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Paquetes' })).getByText('Sin asignar')
    ).toBeInTheDocument();
  });
});
