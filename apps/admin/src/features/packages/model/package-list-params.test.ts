import { describe, expect, it } from 'vitest';

import { buildPackageListParams, filtersToQuery, parsePackageFilters } from './package-list-params';

describe('parsePackageFilters', () => {
  it('reads every filter from the URL', () => {
    const filters = parsePackageFilters(
      new URLSearchParams('status=IN_CUSTOMS&unassigned=true&hasIncident=true')
    );

    expect(filters).toEqual({ status: 'IN_CUSTOMS', unassigned: true, hasIncident: true });
  });

  it('starts with no filter', () => {
    expect(parsePackageFilters(new URLSearchParams())).toEqual({
      status: null,
      unassigned: false,
      hasIncident: false,
    });
  });

  it.each(['WAREHOUSE', 'in_customs', '', 'SHIPPED,DELIVERED'])(
    'ignores the unknown status %j',
    (status) => {
      const filters = parsePackageFilters(new URLSearchParams({ status }));

      expect(filters.status).toBeNull();
    }
  );

  it.each(['false', '1', 'TRUE', ''])('treats %j as a switched off flag', (value) => {
    const filters = parsePackageFilters(
      new URLSearchParams({ unassigned: value, hasIncident: value })
    );

    expect(filters.unassigned).toBe(false);
    expect(filters.hasIncident).toBe(false);
  });
});

describe('buildPackageListParams', () => {
  const none = { status: null, unassigned: false, hasIncident: false };

  it('sends only the page when nothing is filtered', () => {
    expect(buildPackageListParams({ page: 2, pageSize: 20, search: '' }, none)).toEqual({
      page: 2,
      pageSize: 20,
    });
  });

  it('sends the search and every active filter', () => {
    const params = buildPackageListParams(
      { page: 1, pageSize: 20, search: 'MI-00001' },
      { status: 'SHIPPED', unassigned: true, hasIncident: true }
    );

    expect(params).toEqual({
      page: 1,
      pageSize: 20,
      search: 'MI-00001',
      status: 'SHIPPED',
      unassigned: true,
      hasIncident: true,
    });
  });

  it('does not send a switched off flag, which would filter the opposite way', () => {
    const params = buildPackageListParams({ page: 1, pageSize: 20, search: '' }, none);

    expect(params).not.toHaveProperty('unassigned');
    expect(params).not.toHaveProperty('hasIncident');
  });
});

describe('filtersToQuery', () => {
  it('writes a status and switched on flags', () => {
    expect(filtersToQuery({ status: 'AT_AGENCY', unassigned: true, hasIncident: true })).toEqual({
      status: 'AT_AGENCY',
      unassigned: 'true',
      hasIncident: 'true',
    });
  });

  it('clears the params of the filters that are switched off', () => {
    expect(filtersToQuery({ status: null, unassigned: false, hasIncident: false })).toEqual({
      status: null,
      unassigned: null,
      hasIncident: null,
    });
  });

  it('only touches the filters that changed', () => {
    expect(filtersToQuery({ hasIncident: true })).toEqual({ hasIncident: 'true' });
  });
});
