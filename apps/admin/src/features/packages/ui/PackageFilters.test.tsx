import { PACKAGE_STATUSES } from '@rapiexpress/api-client/packages.schemas';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';
import { renderWithProviders } from '@/test/render';

import type { PackageFilters as Filters } from '../model/package-list-params';
import PackageFilters from './PackageFilters';

const NONE: Filters = { status: null, unassigned: false, hasIncident: false };

function renderFilters(filters: Filters = NONE, onChange = vi.fn()) {
  renderWithProviders(<PackageFilters filters={filters} onChange={onChange} />, {
    withSession: false,
  });
  return onChange;
}

describe('PackageFilters', () => {
  it('offers all eight internal statuses with their Spanish labels', () => {
    renderFilters();
    const select = screen.getByRole('combobox', { name: 'Estado' });

    const labels = within(select)
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(labels).toEqual([
      'Todos los estados',
      ...PACKAGE_STATUSES.map((status) => PACKAGE_STATUS_LABEL[status]),
    ]);
  });

  it('reports the chosen status', async () => {
    const onChange = renderFilters();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'En aduana');

    expect(onChange).toHaveBeenCalledWith({ status: 'IN_CUSTOMS' });
  });

  it('clears the status when all statuses are chosen again', async () => {
    const onChange = renderFilters({ ...NONE, status: 'SHIPPED' });

    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('SHIPPED');
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Estado' }),
      'Todos los estados'
    );

    expect(onChange).toHaveBeenCalledWith({ status: null });
  });

  it('shows which flag filters are on and toggles them', async () => {
    const onChange = renderFilters({ ...NONE, unassigned: true });

    const unassigned = screen.getByRole('button', { name: 'Sin cliente asignado' });
    const incident = screen.getByRole('button', { name: 'Con incidencia abierta' });
    expect(unassigned).toHaveAttribute('aria-pressed', 'true');
    expect(incident).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(incident);
    expect(onChange).toHaveBeenLastCalledWith({ hasIncident: true });

    await userEvent.click(unassigned);
    expect(onChange).toHaveBeenLastCalledWith({ unassigned: false });
  });
});
