import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  customerSearchHandler,
  customerSummaryFixture,
  OTHER_CUSTOMER_ID,
} from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import CustomerSearch from './CustomerSearch';

function renderSearch() {
  const onChoose = vi.fn();
  renderWithProviders(<CustomerSearch onChoose={onChoose} />, { withSession: false });
  return { onChoose, input: screen.getByRole('searchbox', { name: 'Buscar cliente' }) };
}

describe('CustomerSearch', () => {
  it('waits for two characters before searching', async () => {
    const requests: URL[] = [];
    server.use(customerSearchHandler([], (url) => requests.push(url)));
    const { input } = renderSearch();

    await userEvent.type(input, 'j');

    expect(screen.getByText('Escribe al menos 2 caracteres para buscar.')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(requests).toHaveLength(0);
  });

  it('searches once after the operator stops typing and lists name and locker', async () => {
    const requests: URL[] = [];
    server.use(
      customerSearchHandler(
        [
          customerSummaryFixture(),
          customerSummaryFixture({
            id: OTHER_CUSTOMER_ID,
            name: 'Janet',
            lastName: 'Ruiz',
            lockerCode: null,
          }),
        ],
        (url) => requests.push(url)
      )
    );
    const { input } = renderSearch();

    await userEvent.type(input, '  jane ');

    expect(await screen.findByRole('button', { name: /Jane Doe/ })).toHaveTextContent('MI-00001');
    expect(screen.getByRole('button', { name: /Janet Ruiz/ })).toHaveTextContent('Sin casillero');
    expect(requests).toHaveLength(1);
    expect(requests[0]?.searchParams.get('search')).toBe('jane');
  });

  it('hands over the customer the operator picks', async () => {
    server.use(customerSearchHandler([customerSummaryFixture()]));
    const { input, onChoose } = renderSearch();

    await userEvent.type(input, 'MI-00001');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));

    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith(customerSummaryFixture());
  });

  it('shows a loading state while the search runs', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/api/packages/reception/customers', async () => {
        await gate;
        return HttpResponse.json([]);
      })
    );
    const { input } = renderSearch();

    await userEvent.type(input, 'jane');

    expect(await screen.findByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    release();
    expect(
      await screen.findByText('No encontramos clientes con esa búsqueda.')
    ).toBeInTheDocument();
  });

  it('shows only the latest search when the responses arrive out of order', async () => {
    let releaseSlow: () => void = () => {};
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const requested: string[] = [];
    const served: string[] = [];
    server.use(
      http.get('*/api/packages/reception/customers', async ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? '';
        requested.push(search);
        if (search === 'ja') await slowGate;
        served.push(search);
        return HttpResponse.json(
          search === 'ja'
            ? [customerSummaryFixture({ name: 'Jane', lastName: 'Doe' })]
            : [customerSummaryFixture({ id: OTHER_CUSTOMER_ID, name: 'Janet', lastName: 'Ruiz' })]
        );
      })
    );
    const { input } = renderSearch();

    await userEvent.type(input, 'ja');
    await waitFor(() => expect(requested).toEqual(['ja']));
    await userEvent.type(input, 'n');

    expect(await screen.findByRole('button', { name: /Janet Ruiz/ })).toBeInTheDocument();
    expect(served).toEqual(['jan']);

    releaseSlow();
    await waitFor(() => expect(served).toEqual(['jan', 'ja']));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByRole('button', { name: /Janet Ruiz/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Jane Doe/ })).toBeNull();
  });

  describe('when the backend limit may have cut the results', () => {
    const customers = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        customerSummaryFixture({
          id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          name: 'Jane',
          lastName: `Doe ${index}`,
          lockerCode: `MI-${String(index).padStart(5, '0')}`,
        })
      );

    it('asks the operator to refine the search when the list is full', async () => {
      server.use(customerSearchHandler(customers(10)));
      const { input } = renderSearch();

      await userEvent.type(input, 'jane');

      expect(await screen.findAllByRole('button', { name: /Jane Doe/ })).toHaveLength(10);
      expect(
        screen.getByText('Mostramos los primeros 10 clientes. Escribe más para afinar la búsqueda.')
      ).toBeInTheDocument();
    });

    it('stays quiet when fewer results than the limit came back', async () => {
      server.use(customerSearchHandler(customers(9)));
      const { input } = renderSearch();

      await userEvent.type(input, 'jane');

      expect(await screen.findAllByRole('button', { name: /Jane Doe/ })).toHaveLength(9);
      expect(screen.queryByText(/Escribe más para afinar/)).toBeNull();
    });
  });

  it('shows an empty state when nobody matches', async () => {
    server.use(customerSearchHandler([]));
    const { input } = renderSearch();

    await userEvent.type(input, 'zzz');

    expect(
      await screen.findByText('No encontramos clientes con esa búsqueda.')
    ).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/packages/reception/customers', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json([customerSummaryFixture()]);
      })
    );
    const { input } = renderSearch();

    await userEvent.type(input, 'jane');

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos buscar clientes.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: /Jane Doe/ })).toBeInTheDocument();
  });

  it('hides the results again when the search is shortened below two characters', async () => {
    server.use(customerSearchHandler([customerSummaryFixture()]));
    const { input } = renderSearch();

    await userEvent.type(input, 'jane');
    await screen.findByRole('button', { name: /Jane Doe/ });
    await userEvent.clear(input);
    await userEvent.type(input, 'j');

    await waitFor(() => expect(screen.queryByRole('button', { name: /Jane Doe/ })).toBeNull());
    expect(screen.getByText('Escribe al menos 2 caracteres para buscar.')).toBeInTheDocument();
  });

  it('limits the search to the 100 characters the backend accepts', () => {
    const { input } = renderSearch();

    expect(input).toHaveAttribute('maxlength', '100');
  });
});
