import { describe, expect, it } from 'vitest';

import { buildPurchaseListParams, parsePurchaseStatus } from './purchase-list-params';

describe('parsePurchaseStatus', () => {
  it.each(['PENDING_RECEPTION', 'RECEIVED', 'CANCELLED'])('reads the %s status', (status) => {
    expect(parsePurchaseStatus(new URLSearchParams({ status }))).toBe(status);
  });

  it.each(['', 'received', 'WAREHOUSE', 'IN_WAREHOUSE'])('ignores %j', (status) => {
    expect(parsePurchaseStatus(new URLSearchParams({ status }))).toBeNull();
  });

  it('has no status when the URL has none', () => {
    expect(parsePurchaseStatus(new URLSearchParams())).toBeNull();
  });
});

describe('buildPurchaseListParams', () => {
  it('sends only the page when nothing is filtered', () => {
    expect(buildPurchaseListParams({ page: 1, pageSize: 20, search: '' }, null)).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('adds the search and the status when they are set', () => {
    expect(
      buildPurchaseListParams({ page: 3, pageSize: 20, search: 'MI-00001' }, 'RECEIVED')
    ).toEqual({ page: 3, pageSize: 20, search: 'MI-00001', status: 'RECEIVED' });
  });

  it('cuts the search at the 100 characters the backend accepts', () => {
    const params = buildPurchaseListParams(
      { page: 1, pageSize: 20, search: 'a'.repeat(150) },
      null
    );

    expect(params.search).toBe('a'.repeat(100));
  });

  it('keeps a search of exactly 100 characters', () => {
    const search = 'b'.repeat(100);

    expect(buildPurchaseListParams({ page: 1, pageSize: 20, search }, null).search).toBe(search);
  });
});
