import { QueryClientProvider, useMutation } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render';

import { useSingleFlight } from './use-single-flight';

function setup(mutationFn: (value: number) => Promise<string>) {
  const queryClient = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return renderHook(() => useSingleFlight(useMutation({ mutationFn })), { wrapper: Wrapper });
}

function deferred() {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { gate, release };
}

describe('useSingleFlight', () => {
  it('lets only one of two submits in the same tick through', async () => {
    const { gate, release } = deferred();
    const mutationFn = vi.fn(async () => {
      await gate;
      return 'ok';
    });
    const { result } = setup(mutationFn);

    act(() => {
      result.current.submit(1);
      result.current.submit(2);
    });
    release();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(mutationFn).toHaveBeenCalledWith(1, expect.anything());
  });

  it('accepts a new submit once the first one succeeded', async () => {
    const mutationFn = vi.fn(async () => 'ok');
    const { result } = setup(mutationFn);

    act(() => result.current.submit(1));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    act(() => result.current.submit(2));
    await waitFor(() => expect(mutationFn).toHaveBeenCalledTimes(2));
  });

  it('accepts a new submit once the first one failed', async () => {
    const mutationFn = vi
      .fn<(value: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok');
    const { result } = setup(mutationFn);

    act(() => result.current.submit(1));
    await waitFor(() => expect(result.current.isError).toBe(true));
    act(() => result.current.submit(2));

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(mutationFn).toHaveBeenCalledTimes(2);
  });

  it('runs the callbacks of the submit that went through', async () => {
    const onSuccess = vi.fn();
    const onSettled = vi.fn();
    const { result } = setup(async () => 'done');

    act(() => result.current.submit(1, { onSuccess, onSettled }));

    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
    expect(onSuccess).toHaveBeenCalledWith('done', 1, undefined, expect.anything());
  });
});
