import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useListParams } from './use-list-params';

function renderParams(route: string) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }
  return renderHook(() => useListParams(), { wrapper: Wrapper });
}

describe('useListParams page', () => {
  it('reads a valid page from the URL', () => {
    expect(renderParams('/?page=3').result.current.page).toBe(3);
  });

  it('accepts the largest supported page', () => {
    expect(renderParams('/?page=10000').result.current.page).toBe(10000);
  });

  it.each(['1e21', '99999999999', '10001', '0', '-2', '1.5', 'abc', ''])(
    'falls back to the first page for %j',
    (raw) => {
      expect(renderParams(`/?page=${raw}`).result.current.page).toBe(1);
    }
  );
});
