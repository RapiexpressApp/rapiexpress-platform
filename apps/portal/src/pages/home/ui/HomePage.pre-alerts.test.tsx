import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { findHomeSection, renderHomePage } from '@/test/home-page';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';

const SECTION = 'Pre-alertas por recibir';

describe('HomePage pending pre-alerts', () => {
  it('shows the store, description and guide of each pending purchase', async () => {
    renderHomePage(
      purchasesListHandler([
        purchaseFixture({ id: 'p1', store: 'Amazon', description: 'Teclado mecánico' }),
        purchaseFixture({
          id: 'p2',
          store: 'eBay',
          description: 'Cámara instantánea',
          trackingNumber: 'EB9988776655',
        }),
      ])
    );

    const section = await findHomeSection(SECTION);
    const list = within(await section.findByRole('list', { name: SECTION }));
    expect(list.getAllByRole('listitem')).toHaveLength(2);
    expect(list.getByText('Amazon')).toBeInTheDocument();
    expect(list.getByText('Teclado mecánico')).toBeInTheDocument();
    expect(list.getByText(/EB9988776655/)).toBeInTheDocument();
  });

  it('asks for the first three pending purchases only', async () => {
    const requests: URL[] = [];
    renderHomePage(
      purchasesListHandler([purchaseFixture()], { onRequest: (u) => requests.push(u) })
    );

    const section = await findHomeSection(SECTION);
    await section.findByRole('list', { name: SECTION });

    expect(requests[0]?.searchParams.get('status')).toBe('PENDING_RECEPTION');
    expect(requests[0]?.searchParams.get('page')).toBe('1');
    expect(requests[0]?.searchParams.get('pageSize')).toBe('3');
  });

  it('links to the pre-alerts page and says how many more are waiting', async () => {
    renderHomePage(purchasesListHandler([purchaseFixture()], { total: 4 }));

    const section = await findHomeSection(SECTION);
    expect(await section.findByText('y 3 más')).toBeInTheDocument();

    await userEvent.click(section.getByRole('link', { name: 'Ver todas' }));
    expect(await screen.findByText('Lista de pre-alertas')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/pre-alerts');
  });

  it('shows an empty state with a way to pre-alert a purchase', async () => {
    renderHomePage();

    const section = await findHomeSection(SECTION);
    expect(await section.findByText('No tienes pre-alertas por recibir.')).toBeInTheDocument();
    expect(section.queryByRole('link', { name: 'Ver todas' })).not.toBeInTheDocument();

    await userEvent.click(section.getByRole('link', { name: 'Pre-alertar una compra' }));
    expect(await screen.findByText('Lista de pre-alertas')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toHaveTextContent('?new=1');
  });

  it('shows a loading state first', async () => {
    renderHomePage(purchasesListHandler());

    const section = await findHomeSection(SECTION);
    expect(section.getByRole('status', { name: 'Cargando pre-alertas' })).toBeInTheDocument();
    await section.findByRole('list', { name: SECTION });
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    renderHomePage(
      http.get('*/api/me/purchases', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ items: [purchaseFixture()], page: 1, pageSize: 3, total: 1 });
      })
    );

    const section = await findHomeSection(SECTION);
    expect(await section.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tus pre-alertas.'
    );

    await userEvent.click(section.getByRole('button', { name: 'Reintentar' }));
    expect(await section.findByText('Amazon')).toBeInTheDocument();
  });
});
