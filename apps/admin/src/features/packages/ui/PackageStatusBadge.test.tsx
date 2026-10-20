import { PACKAGE_STATUSES } from '@rapiexpress/api-client/packages.schemas';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PACKAGE_STATUS_LABEL } from '@/shared/model/package-labels';
import { renderWithProviders } from '@/test/render';

import PackageStatusBadge from './PackageStatusBadge';

describe('PackageStatusBadge', () => {
  it.each(PACKAGE_STATUSES)('names the %s status in Spanish', (status) => {
    renderWithProviders(<PackageStatusBadge status={status} />, { withSession: false });

    expect(screen.getByText(PACKAGE_STATUS_LABEL[status])).toBeInTheDocument();
  });
});
