import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { receptionLookupFixture } from '@/test/reception-handlers';
import { server } from '@/test/server';

import { useReceptionLookup } from './use-reception-lookup';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useReceptionLookup', () => {
  it('ignores an older lookup that resolves after a newer one', async () => {
    let releaseOlder: () => void = () => {};
    const olderGate = new Promise<void>((resolve) => {
      releaseOlder = resolve;
    });
    const served: string[] = [];
    server.use(
      http.get('*/api/packages/reception/lookup', async ({ request }) => {
        const guide = new URL(request.url).searchParams.get('trackingNumber') ?? '';
        if (guide === 'OLDER0001') await olderGate;
        served.push(guide);
        return HttpResponse.json(receptionLookupFixture({ trackingNumber: guide }));
      })
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useReceptionLookup(), { wrapper });

    act(() => {
      result.current.mutate('OLDER0001', { onSuccess: (data) => onSuccess(data.trackingNumber) });
      result.current.mutate('NEWER0001', { onSuccess: (data) => onSuccess(data.trackingNumber) });
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('NEWER0001'));
    expect(served).toEqual(['NEWER0001']);

    releaseOlder();
    await waitFor(() => expect(served).toEqual(['NEWER0001', 'OLDER0001']));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.data?.trackingNumber).toBe('NEWER0001');
  });
});
