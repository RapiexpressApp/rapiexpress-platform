import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { createQueryClient } from './query-client.ts';

type RetryPolicy = (failureCount: number, error: unknown) => boolean;
type RetryDelay = (failureCount: number, error: unknown) => number;

function policy() {
  const queries = createQueryClient().getDefaultOptions().queries;

  return {
    retry: queries?.retry as RetryPolicy,
    retryDelay: queries?.retryDelay as RetryDelay,
  };
}

function httpError(status: number, headers: Record<string, string> = {}) {
  return Object.assign(new AxiosError(`status ${status}`), {
    response: { status, headers },
  });
}

describe('createQueryClient retry', () => {
  const { retry } = policy();

  it('retries a rate limited response until the attempt budget runs out', () => {
    const error = httpError(429);

    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it.each([400, 401, 403, 404, 409])('does not retry other client errors (%s)', (status) => {
    expect(retry(0, httpError(status))).toBe(false);
  });

  it('retries server errors and network failures', () => {
    expect(retry(0, httpError(503))).toBe(true);
    expect(retry(0, new AxiosError('Network Error'))).toBe(true);
  });
});

describe('createQueryClient retryDelay', () => {
  const { retryDelay } = policy();

  it('waits the rate limit window announced by the API', () => {
    expect(retryDelay(0, httpError(429, { 'retry-after-short': '1' }))).toBe(1000);
  });

  it('caps the announced wait', () => {
    expect(retryDelay(0, httpError(429, { 'retry-after-short': '60' }))).toBe(10_000);
  });

  it('falls back to exponential backoff without the header', () => {
    expect(retryDelay(0, httpError(429))).toBe(1000);
    expect(retryDelay(1, httpError(429))).toBe(2000);
  });
});
