import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderHomePage } from '@/test/home-page';
import { myPackageFixture, myPackagesBackendHandler } from '@/test/packages-handlers';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';

const SECTION = 'Resumen de tus paquetes';

const withStatus = (status: 'WAREHOUSE' | 'SHIPPED' | 'CUSTOMS' | 'AGENCY' | 'DELIVERED', n = 1) =>
  Array.from({ length: n }, (_, index) =>
    myPackageFixture({ id: `${status}-${index}`, warehouseNumber: `${status}-${index}`, status })
  );

const PACKAGES = [
  ...withStatus('WAREHOUSE'),
  ...withStatus('SHIPPED', 2),
  ...withStatus('CUSTOMS'),
  ...withStatus('AGENCY', 3),
  ...withStatus('DELIVERED', 4),
];

async function findCard(label: string) {
  const section = await screen.findByRole('region', { name: SECTION });
  const card = within(section).getByText(label).closest('li');
  if (!card) throw new Error(`No card for ${label}`);
  return within(card);
}

describe('HomePage stat cards', () => {
  it('shows the real count for each card', async () => {
    renderHomePage(
      myPackagesBackendHandler(PACKAGES),
      purchasesListHandler([purchaseFixture()], { total: 4 })
    );

    const inTransit = await findCard('En tránsito');
    expect(await inTransit.findByText('3')).toBeInTheDocument();
    const atAgency = await findCard('En agencia');
    expect(await atAgency.findByText('3')).toBeInTheDocument();
    const preAlerts = await findCard('Pre-alertas');
    expect(await preAlerts.findByText('4')).toBeInTheDocument();
  });

  it('counts from the total of one-item pages, one request per status', async () => {
    const requests: URL[] = [];
    renderHomePage(myPackagesBackendHandler(PACKAGES, (url) => requests.push(url)));

    await (await findCard('En tránsito')).findByText('3');
    await (await findCard('En agencia')).findByText('3');

    const counted = requests.filter((url) => url.searchParams.has('status'));
    expect(counted.map((url) => url.searchParams.get('status')).sort()).toEqual([
      'AGENCY',
      'CUSTOMS',
      'SHIPPED',
    ]);
    for (const url of counted) expect(url.searchParams.get('pageSize')).toBe('1');
  });

  it('describes the activity in the greeting', async () => {
    renderHomePage(myPackagesBackendHandler(PACKAGES));

    expect(
      await screen.findByText('Tienes 3 paquetes en camino y 3 en tu agencia.')
    ).toBeInTheDocument();
  });

  it('shows zeros and a calm summary for an account without packages', async () => {
    renderHomePage();

    expect(
      await screen.findByText('Por ahora no tienes paquetes en camino ni en tu agencia.')
    ).toBeInTheDocument();
    for (const label of ['En tránsito', 'En agencia', 'Pre-alertas']) {
      expect(await (await findCard(label)).findByText('0')).toBeInTheDocument();
    }
  });

  it('shows a loading placeholder while a count is pending', async () => {
    renderHomePage(myPackagesBackendHandler(PACKAGES));

    const card = await findCard('En agencia');
    expect(card.getByRole('status', { name: 'Cargando En agencia' })).toBeInTheDocument();
    await card.findByText('3');
  });

  it('fails one card on its own and retries it', async () => {
    let agencyCalls = 0;
    renderHomePage(
      http.get('*/api/me/packages', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        if (status === 'AGENCY') {
          agencyCalls += 1;
          if (agencyCalls === 1) return new HttpResponse(null, { status: 500 });
        }
        const items = PACKAGES.filter((item) => !status || item.status === status);
        return HttpResponse.json({
          items: items.slice(0, 1),
          page: 1,
          pageSize: 1,
          total: items.length,
        });
      })
    );

    const failed = await findCard('En agencia');
    expect(await failed.findByRole('alert')).toHaveTextContent('No pudimos cargar este dato.');
    expect(await (await findCard('En tránsito')).findByText('3')).toBeInTheDocument();
    expect(await (await findCard('Pre-alertas')).findByText('0')).toBeInTheDocument();

    await userEvent.click(failed.getByRole('button', { name: 'Reintentar En agencia' }));
    await waitFor(async () =>
      expect(await (await findCard('En agencia')).findByText('3')).toBeInTheDocument()
    );
  });
});
