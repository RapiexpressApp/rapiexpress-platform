import type { MutateOptions, UseMutationResult } from '@tanstack/react-query';
import { useRef } from 'react';

export function useSingleFlight<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>
) {
  const inFlight = useRef(false);

  function submit(variables: TVariables, options: MutateOptions<TData, TError, TVariables> = {}) {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(variables, {
      ...options,
      onSettled: (...args) => {
        inFlight.current = false;
        options.onSettled?.(...args);
      },
    });
  }

  return {
    submit,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
