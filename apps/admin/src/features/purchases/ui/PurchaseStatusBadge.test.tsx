import { PURCHASE_STATUSES } from '@rapiexpress/api-client/purchases.schemas';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PURCHASE_STATUS_LABEL } from '@/shared/model/purchase-labels';
import { renderWithProviders } from '@/test/render';

import PurchaseStatusBadge from './PurchaseStatusBadge';

describe('PurchaseStatusBadge', () => {
  it.each(PURCHASE_STATUSES)('names the %s status in Spanish', (status) => {
    renderWithProviders(<PurchaseStatusBadge status={status} />, { withSession: false });

    expect(screen.getByText(PURCHASE_STATUS_LABEL[status])).toBeInTheDocument();
  });

  it('uses the same words as the customer portal', () => {
    expect(PURCHASE_STATUS_LABEL).toEqual({
      PENDING_RECEPTION: 'Por recibir',
      RECEIVED: 'Recibida',
      CANCELLED: 'Cancelada',
    });
  });
});
