import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useListParams } from './use-list-params';

function renderParams(route: string) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }
  return renderHook(() => ({ params: useListParams(), location: useLocation() }), {
    wrapper: Wrapper,
  });
}

describe('useListParams page', () => {
  it('reads a valid page from the URL', () => {
    expect(renderParams('/?page=3').result.current.params.page).toBe(3);
  });

  it('accepts the largest supported page', () => {
    expect(renderParams('/?page=10000').result.current.params.page).toBe(10000);
  });

  it.each(['1e21', '99999999999', '10001', '0', '-2', '1.5', 'abc', ''])(
    'falls back to the first page for %j',
    (raw) => {
      expect(renderParams(`/?page=${raw}`).result.current.params.page).toBe(1);
    }
  );
});

describe('useListParams update', () => {
  it('exposes the raw search params', () => {
    const { result } = renderParams('/?status=SHIPPED&unassigned=true');

    expect(result.current.params.searchParams.get('status')).toBe('SHIPPED');
    expect(result.current.params.searchParams.get('unassigned')).toBe('true');
  });

  it('sets and removes several params at once', () => {
    const { result } = renderParams('/?status=SHIPPED&search=ana');

    act(() => result.current.params.update({ status: null, unassigned: 'true' }));

    expect(result.current.location.search).toBe('?search=ana&unassigned=true');
  });

  it('drops the page when asked to reset it', () => {
    const { result } = renderParams('/?page=4&status=SHIPPED');

    act(() => result.current.params.update({ status: 'DELIVERED' }, { resetPage: true }));

    expect(result.current.location.search).toBe('?status=DELIVERED');
  });

  it('keeps the page when it is not reset', () => {
    const { result } = renderParams('/?page=4');

    act(() => result.current.params.update({ hasIncident: 'true' }));

    expect(result.current.location.search).toBe('?page=4&hasIncident=true');
  });

  it('replaces the history entry on request', () => {
    const { result } = renderParams('/?page=2');

    act(() => result.current.params.update({ page: null }, { replace: true }));

    expect(result.current.location.search).toBe('');
  });
});
