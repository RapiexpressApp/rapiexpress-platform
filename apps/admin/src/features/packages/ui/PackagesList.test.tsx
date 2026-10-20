import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PACKAGE_ID, packageListItemFixture } from '@/test/packages-handlers';
import { customerSummaryFixture } from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import PackagesList from './PackagesList';

function renderList(...items: ReturnType<typeof packageListItemFixture>[]) {
  return renderWithProviders(<PackagesList packages={items} />, { withSession: false });
}

function getCard(warehouseNumber: string) {
  const list = screen.getByRole('list', { name: 'Paquetes' });
  const link = within(list).getByRole('link', { name: warehouseNumber });
  return link.closest('li') as HTMLElement;
}

function getRow(warehouseNumber: string) {
  const table = screen.getByRole('table', { name: 'Paquetes', hidden: true });
  const link = within(table).getByRole('link', { name: warehouseNumber, hidden: true });
  return link.closest('tr') as HTMLElement;
}

describe('PackagesList cards', () => {
  it('links each package to its detail', () => {
    renderList(packageListItemFixture());

    expect(within(getCard('WH-000042')).getByRole('link', { name: 'WH-000042' })).toHaveAttribute(
      'href',
      `/paquetes/${PACKAGE_ID}`
    );
  });

  it('shows the guide, customer, status, weight, value and received date', () => {
    renderList(packageListItemFixture({ status: 'SHIPPED' }));
    const card = within(getCard('WH-000042'));

    expect(card.getByText(/Guía 1Z999AA10123456784/)).toBeInTheDocument();
    expect(card.getByText('Jane Doe')).toBeInTheDocument();
    expect(card.getByText('MI-00001')).toBeInTheDocument();
    expect(card.getByText('Embarcado')).toBeInTheDocument();
    expect(card.getByText(/2,5 lb/)).toBeInTheDocument();
    expect(card.getByText(/USD 59,99/)).toBeInTheDocument();
    expect(card.getByText(/15 mar 2026/)).toBeInTheDocument();
  });

  it('names a package without a customer as unassigned', () => {
    renderList(packageListItemFixture({ customer: null }));

    expect(within(getCard('WH-000042')).getByText('Sin asignar')).toBeInTheDocument();
  });

  it('shows a customer without a locker without inventing one', () => {
    renderList(packageListItemFixture({ customer: customerSummaryFixture({ lockerCode: null }) }));

    expect(within(getCard('WH-000042')).getByText('Sin casillero')).toBeInTheDocument();
  });

  it('says when the declared value is missing', () => {
    renderList(packageListItemFixture({ declaredValueUsd: null }));

    expect(within(getCard('WH-000042')).getByText(/Sin valor declarado/)).toBeInTheDocument();
  });

  it('flags only the packages with an open incident', () => {
    renderList(
      packageListItemFixture({ hasOpenIncident: true }),
      packageListItemFixture({ id: 'second', warehouseNumber: 'WH-000043' })
    );

    expect(within(getCard('WH-000042')).getByText('Incidencia abierta')).toBeInTheDocument();
    expect(within(getCard('WH-000043')).queryByText('Incidencia abierta')).toBeNull();
  });
});

describe('PackagesList table', () => {
  it('has one column per field the operator scans for', () => {
    renderList(packageListItemFixture());
    const table = within(screen.getByRole('table', { name: 'Paquetes', hidden: true }));

    const headers = table
      .getAllByRole('columnheader', { hidden: true })
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Bodega',
      'Guía',
      'Cliente',
      'Estado',
      'Incidencia',
      'Peso',
      'Valor declarado',
      'Recibido',
    ]);
  });

  it('shows the same package data as the cards', () => {
    renderList(packageListItemFixture({ hasOpenIncident: true, status: 'IN_CUSTOMS' }));
    const row = within(getRow('WH-000042'));

    expect(row.getByText('1Z999AA10123456784')).toBeInTheDocument();
    expect(row.getByText('Jane Doe')).toBeInTheDocument();
    expect(row.getByText('MI-00001')).toBeInTheDocument();
    expect(row.getByText('En aduana')).toBeInTheDocument();
    expect(row.getByText('Incidencia abierta')).toBeInTheDocument();
    expect(row.getByText('2,5 lb')).toBeInTheDocument();
    expect(row.getByText('1,13 kg')).toBeInTheDocument();
    expect(row.getByText('USD 59,99')).toBeInTheDocument();
    expect(row.getByText('15 mar 2026')).toBeInTheDocument();
  });
});
