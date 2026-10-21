import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { existingPackageFixture } from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import DuplicateWarning from './DuplicateWarning';

function renderWarning(packages = [existingPackageFixture()]) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <DuplicateWarning packages={packages} onConfirm={onConfirm} onCancel={onCancel} />,
    { withSession: false }
  );
  return { ...view, onConfirm, onCancel };
}

describe('DuplicateWarning', () => {
  it('warns that the guide was already received and moves focus to the warning', () => {
    renderWarning();

    expect(screen.getByRole('heading', { name: 'Esta guía ya fue recibida' })).toHaveFocus();
  });

  it('lists every stored package with its warehouse number, status and date', () => {
    renderWarning([
      existingPackageFixture({
        warehouseNumber: 'WH-000041',
        status: 'SHIPPED',
        customerId: null,
        createdAt: '2026-03-12T12:00:00.000Z',
      }),
      existingPackageFixture({
        id: 'k2',
        warehouseNumber: 'WH-000030',
        status: 'IN_WAREHOUSE',
        customerId: 'c1',
        createdAt: '2026-02-01T12:00:00.000Z',
      }),
    ]);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText('WH-000041')).toBeInTheDocument();
    expect(within(items[0]!).getByText('Embarcado')).toBeInTheDocument();
    expect(within(items[0]!).getByText('12 mar 2026')).toBeInTheDocument();
    expect(within(items[0]!).getByText('Sin asignar')).toBeInTheDocument();
    expect(within(items[1]!).getByText('WH-000030')).toBeInTheDocument();
    expect(within(items[1]!).getByText('En bodega')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Asignado')).toBeInTheDocument();
  });

  it('counts the stored packages in singular and plural', () => {
    const { unmount } = renderWarning([existingPackageFixture()]);
    expect(screen.getByText(/Hay 1 bulto registrado con esta guía/)).toBeInTheDocument();
    unmount();

    renderWarning([existingPackageFixture(), existingPackageFixture({ id: 'k2' })]);
    expect(screen.getByText(/Hay 2 bultos registrados con esta guía/)).toBeInTheDocument();
  });

  it('requires an explicit confirmation to continue', async () => {
    const { onConfirm, onCancel } = renderWarning();

    await userEvent.click(screen.getByRole('button', { name: 'Es otro bulto' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('lets the operator scan another guide instead', async () => {
    const { onConfirm, onCancel } = renderWarning();

    await userEvent.click(screen.getByRole('button', { name: 'Escanear otra guía' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
