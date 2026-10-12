import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { getHttpStatus } from './http-error.ts';

describe('getHttpStatus', () => {
  it('returns the response status of an axios error', () => {
    const error = Object.assign(new AxiosError('conflict'), { response: { status: 409 } });

    expect(getHttpStatus(error)).toBe(409);
  });

  it('returns undefined without a response or for non axios errors', () => {
    expect(getHttpStatus(new AxiosError('offline'))).toBeUndefined();
    expect(getHttpStatus(new Error('nope'))).toBeUndefined();
    expect(getHttpStatus(undefined)).toBeUndefined();
  });
});
