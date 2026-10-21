import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import PurchaseStatusFilter from './PurchaseStatusFilter';

function renderFilter(value: Parameters<typeof PurchaseStatusFilter>[0]['value'] = null) {
  const onChange = vi.fn();
  renderWithProviders(<PurchaseStatusFilter value={value} onChange={onChange} />, {
    withSession: false,
  });
  return onChange;
}

describe('PurchaseStatusFilter', () => {
  it('offers all purchases and each status, in the words of the portal', () => {
    renderFilter();
    const group = within(screen.getByRole('group', { name: 'Filtrar por estado' }));

    expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Todas',
      'Por recibir',
      'Recibidas',
      'Canceladas',
    ]);
  });

  it('marks all purchases as chosen when there is no status', () => {
    renderFilter();

    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Recibidas' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('marks only the chosen status', () => {
    renderFilter('PENDING_RECEPTION');

    expect(screen.getByRole('button', { name: 'Por recibir' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the status that was chosen', async () => {
    const onChange = renderFilter();

    await userEvent.click(screen.getByRole('button', { name: 'Canceladas' }));

    expect(onChange).toHaveBeenCalledWith('CANCELLED');
  });

  it('reports no status when all purchases are chosen again', async () => {
    const onChange = renderFilter('RECEIVED');

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('can be operated from the keyboard', async () => {
    const onChange = renderFilter();

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('PENDING_RECEPTION');
  });
});
