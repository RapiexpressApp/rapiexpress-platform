import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { purchasesListHandler, staffPurchaseFixture } from '@/test/purchases-handlers';
import { renderPurchasesPage } from '@/test/purchases-page';

const location = () => screen.getByTestId('location');

const findPurchases = () => screen.findByRole('list', { name: 'Pre-alertas' });

const listItems = () => within(screen.getByRole('list', { name: 'Pre-alertas' }));

describe('PurchasesPage listing', () => {
  it('lists the pre-alerts of every customer', async () => {
    renderPurchasesPage('/prealertas', purchasesListHandler());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pre-alertas' })
    ).toBeInTheDocument();
    expect(await findPurchases()).toBeInTheDocument();
    expect(listItems().getByText('Jane Doe')).toBeInTheDocument();
    expect(listItems().getByText('MI-00001')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });

  it('names the page in the browser tab', async () => {
    renderPurchasesPage('/prealertas', purchasesListHandler());
    await findPurchases();

    expect(document.title).toBe('Pre-alertas · Rapiexpress');
  });

  it('shows a loading state, then the empty state when nobody has declared anything', async () => {
    renderPurchasesPage('/prealertas', purchasesListHandler([]));

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no hay pre-alertas.')).toBeInTheDocument();
  });

  it('shows an error with a retry that loads the list', async () => {
    let calls = 0;
    renderPurchasesPage(
      '/prealertas',
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar las pre-alertas.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await findPurchases()).toBeInTheDocument();
  });
});

describe('PurchasesPage search and status', () => {
  it('debounces the search into the URL and the request, and resets the page', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?page=3',
      purchasesListHandler([staffPurchaseFixture()], {
        total: 90,
        onRequest: (url) => requests.push(url),
      })
    );
    await findPurchases();
    const initial = requests.length;

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar pre-alertas' }), 'MI-00001');

    await waitFor(() => expect(location()).toHaveTextContent('?search=MI-00001'));
    await waitFor(() => expect(requests.length).toBeGreaterThan(initial));
    expect(requests.slice(initial)).toHaveLength(1);
    expect(requests.at(-1)?.searchParams.get('search')).toBe('MI-00001');
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('searches by guide, customer name or locker', async () => {
    renderPurchasesPage('/prealertas', purchasesListHandler());

    expect(
      await screen.findByPlaceholderText('Buscar por guía, cliente o casillero')
    ).toBeInTheDocument();
  });

  it('limits the search to the 100 characters the backend accepts', async () => {
    renderPurchasesPage('/prealertas', purchasesListHandler());

    expect(await screen.findByRole('searchbox', { name: 'Buscar pre-alertas' })).toHaveAttribute(
      'maxlength',
      '100'
    );
  });

  it('sends the chosen status and resets the page', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?page=2',
      purchasesListHandler([staffPurchaseFixture()], {
        total: 30,
        onRequest: (url) => requests.push(url),
      })
    );
    await findPurchases();

    await userEvent.click(screen.getByRole('button', { name: 'Recibidas' }));

    await waitFor(() => expect(location()).toHaveTextContent('?status=RECEIVED'));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('RECEIVED'));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
    expect(screen.getByRole('button', { name: 'Recibidas' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('stops sending the status when all pre-alerts are chosen again', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?status=CANCELLED',
      purchasesListHandler([staffPurchaseFixture()], { onRequest: (url) => requests.push(url) })
    );
    await findPurchases();
    expect(requests.at(-1)?.searchParams.get('status')).toBe('CANCELLED');

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));

    await waitFor(() => expect(requests.at(-1)?.searchParams.has('status')).toBe(false));
    expect(location()).toHaveTextContent(/^\/prealertas$/);
  });

  it('restores the status and the search from the URL', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?status=PENDING_RECEPTION&search=ana',
      purchasesListHandler([staffPurchaseFixture()], { onRequest: (url) => requests.push(url) })
    );
    await findPurchases();

    expect(screen.getByRole('button', { name: 'Por recibir' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('searchbox', { name: 'Buscar pre-alertas' })).toHaveValue('ana');
    expect(requests[0]?.searchParams.get('status')).toBe('PENDING_RECEPTION');
    expect(requests[0]?.searchParams.get('search')).toBe('ana');
  });

  it('ignores a status in the URL that does not exist', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?status=IN_WAREHOUSE',
      purchasesListHandler([staffPurchaseFixture()], { onRequest: (url) => requests.push(url) })
    );
    await findPurchases();

    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('explains an empty filtered list and clears the filters from there', async () => {
    renderPurchasesPage(
      '/prealertas?status=CANCELLED&search=zzz',
      http.get('*/api/purchases', ({ request }) => {
        const params = new URL(request.url).searchParams;
        const filtered = params.has('status') || params.has('search');
        return HttpResponse.json({
          items: filtered ? [] : [staffPurchaseFixture()],
          page: 1,
          pageSize: 20,
          total: filtered ? 0 : 1,
        });
      })
    );

    expect(
      await screen.findByText('No encontramos pre-alertas con estos filtros.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(await findPurchases()).toBeInTheDocument();
    expect(location()).toHaveTextContent(/^\/prealertas$/);
    expect(screen.getByRole('searchbox', { name: 'Buscar pre-alertas' })).toHaveValue('');
  });
});

describe('PurchasesPage pagination', () => {
  it('moves to the next page through the URL', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas',
      purchasesListHandler([staffPurchaseFixture()], {
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

  it.each(['0', '1e21', '99999999999', '10001', 'abc'])(
    'requests the first page when the URL says page=%s',
    async (page) => {
      const requests: URL[] = [];
      renderPurchasesPage(
        `/prealertas?page=${page}`,
        purchasesListHandler([staffPurchaseFixture()], { onRequest: (url) => requests.push(url) })
      );
      await findPurchases();

      expect(requests[0]?.searchParams.get('page')).toBe('1');
    }
  );

  it('leaves a page past the end for the last one that has pre-alerts', async () => {
    const requests: URL[] = [];
    renderPurchasesPage(
      '/prealertas?page=9',
      http.get('*/api/purchases', ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const page = Number(url.searchParams.get('page'));
        return HttpResponse.json({
          items: page <= 3 ? [staffPurchaseFixture()] : [],
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
    renderPurchasesPage(
      '/prealertas?page=4&status=RECEIVED',
      http.get('*/api/purchases', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json({ items: [], page, pageSize: 20, total: 0 });
      })
    );

    expect(
      await screen.findByText('No encontramos pre-alertas con estos filtros.')
    ).toBeInTheDocument();
    expect(location()).not.toHaveTextContent('page=');
  });
});
