import { VISIBLE_PACKAGE_STATUSES } from '@rapiexpress/api-client/tracking.schemas';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import PackageStatusIndicator from './PackageStatusIndicator';
import ReadyForPickupBadge from './ReadyForPickupBadge';

const LABELS = {
  WAREHOUSE: 'Bodega',
  SHIPPED: 'Embarcado',
  CUSTOMS: 'Aduana',
  AGENCY: 'Agencia',
  DELIVERED: 'Entregado',
} as const;

describe('PackageStatusIndicator', () => {
  it.each(VISIBLE_PACKAGE_STATUSES)('labels %s in Spanish', (status) => {
    renderWithProviders(<PackageStatusIndicator status={status} />, { withSession: false });

    expect(screen.getByText(LABELS[status])).toBeInTheDocument();
  });
});

describe('ReadyForPickupBadge', () => {
  it('announces that the package can be picked up', () => {
    renderWithProviders(<ReadyForPickupBadge />, { withSession: false });

    expect(screen.getByText('Listo para retirar')).toBeInTheDocument();
  });
});
