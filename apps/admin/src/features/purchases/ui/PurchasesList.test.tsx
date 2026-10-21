import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { staffPurchaseFixture } from '@/test/purchases-handlers';
import { customerSummaryFixture } from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import PurchasesList from './PurchasesList';

function renderList(...items: ReturnType<typeof staffPurchaseFixture>[]) {
  return renderWithProviders(<PurchasesList purchases={items} />, { withSession: false });
}

function getCards() {
  return within(screen.getByRole('list', { name: 'Pre-alertas' }));
}

function getTable() {
  return within(screen.getByRole('table', { name: 'Pre-alertas', hidden: true }));
}

describe('PurchasesList cards', () => {
  it('shows what the operator checks before the package arrives', () => {
    renderList(staffPurchaseFixture());
    const cards = getCards();

    expect(cards.getByText('Amazon')).toBeInTheDocument();
    expect(cards.getByText(/Guía 1Z999AA10123456784/)).toBeInTheDocument();
    expect(cards.getByText('Jane Doe')).toBeInTheDocument();
    expect(cards.getByText('MI-00001')).toBeInTheDocument();
    expect(cards.getByText('Zapatos deportivos')).toBeInTheDocument();
    expect(cards.getByText(/USD 59,99/)).toBeInTheDocument();
    expect(cards.getByText(/2,5 lb/)).toBeInTheDocument();
    expect(cards.getByText(/G \(migrante\)/)).toBeInTheDocument();
    expect(cards.getByText('Por recibir')).toBeInTheDocument();
    expect(cards.getByText(/10 mar 2026/)).toBeInTheDocument();
  });

  it('lists one card per purchase', () => {
    renderList(staffPurchaseFixture(), staffPurchaseFixture({ id: 'second', store: 'Shein' }));

    expect(getCards().getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows a customer without a locker without inventing one', () => {
    renderList(staffPurchaseFixture({ customer: customerSummaryFixture({ lockerCode: null }) }));

    expect(getCards().getByText('Sin casillero')).toBeInTheDocument();
  });

  it.each([
    ['RECEIVED', 'Recibida'],
    ['CANCELLED', 'Cancelada'],
  ] as const)('shows a %s purchase as %s', (status, label) => {
    renderList(staffPurchaseFixture({ status }));

    expect(getCards().getByText(label)).toBeInTheDocument();
  });
});

describe('PurchasesList table', () => {
  it('has one column per field the operator scans for', () => {
    renderList(staffPurchaseFixture());

    const headers = getTable()
      .getAllByRole('columnheader', { hidden: true })
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Tienda',
      'Guía',
      'Cliente',
      'Descripción',
      'Valor declarado',
      'Peso estimado',
      'Categoría',
      'Estado',
      'Creada',
    ]);
  });

  it('shows the same purchase data as the cards', () => {
    renderList(staffPurchaseFixture({ suggestedCategory: 'COMMERCIAL', status: 'RECEIVED' }));
    const row = within(getTable().getAllByRole('row', { hidden: true })[1] as HTMLElement);

    expect(row.getByText('Amazon')).toBeInTheDocument();
    expect(row.getByText('1Z999AA10123456784')).toBeInTheDocument();
    expect(row.getByText('Jane Doe')).toBeInTheDocument();
    expect(row.getByText('MI-00001')).toBeInTheDocument();
    expect(row.getByText('Zapatos deportivos')).toBeInTheDocument();
    expect(row.getByText('USD 59,99')).toBeInTheDocument();
    expect(row.getByText('2,5 lb')).toBeInTheDocument();
    expect(row.getByText('C (comercial)')).toBeInTheDocument();
    expect(row.getByText('Recibida')).toBeInTheDocument();
    expect(row.getByText('10 mar 2026')).toBeInTheDocument();
  });

  it('lets a long guide wrap instead of stretching the table', () => {
    renderList(staffPurchaseFixture({ trackingNumber: 'T'.repeat(64) }));

    expect(getTable().getByText('T'.repeat(64))).toHaveStyle({ overflowWrap: 'anywhere' });
  });
});
