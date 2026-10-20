import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorCode, getHttpStatus, isNetworkError } from './http-error.ts';

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

describe('isNetworkError', () => {
  it('is true for an axios error that never got a response', () => {
    expect(isNetworkError(new AxiosError('Network Error'))).toBe(true);
  });

  it.each([400, 404, 409, 500, 503])('is false when the server answered with %s', (status) => {
    const error = Object.assign(new AxiosError('failed'), { response: { status } });

    expect(isNetworkError(error)).toBe(false);
  });

  it('is false for errors that are not axios errors', () => {
    expect(isNetworkError(new Error('nope'))).toBe(false);
    expect(isNetworkError('Network Error')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('getApiErrorCode', () => {
  const failure = (data: unknown, status = 409) =>
    Object.assign(new AxiosError('failed'), { response: { status, data } });

  it('reads the machine code of an axios error body', () => {
    const error = failure({
      statusCode: 409,
      error: 'Conflict',
      code: 'DUPLICATE_PURCHASE',
      message: 'An active purchase with this tracking number is already declared',
    });

    expect(getApiErrorCode(error)).toBe('DUPLICATE_PURCHASE');
  });

  it('returns undefined for errors that are not axios errors', () => {
    expect(getApiErrorCode(new Error('nope'))).toBeUndefined();
    expect(getApiErrorCode({ response: { data: { code: 'X' } } })).toBeUndefined();
    expect(getApiErrorCode('DUPLICATE_PURCHASE')).toBeUndefined();
    expect(getApiErrorCode(undefined)).toBeUndefined();
    expect(getApiErrorCode(null)).toBeUndefined();
  });

  it('returns undefined without a response or a body', () => {
    expect(getApiErrorCode(new AxiosError('offline'))).toBeUndefined();
    expect(getApiErrorCode(failure(undefined))).toBeUndefined();
    expect(getApiErrorCode(failure(null))).toBeUndefined();
    expect(getApiErrorCode(failure(''))).toBeUndefined();
  });

  it('returns undefined when the body has no usable code', () => {
    expect(getApiErrorCode(failure({ message: 'Bad request' }, 400))).toBeUndefined();
    expect(getApiErrorCode(failure({ code: 409 }))).toBeUndefined();
    expect(getApiErrorCode(failure({ code: null }))).toBeUndefined();
    expect(getApiErrorCode(failure(['DUPLICATE_PURCHASE']))).toBeUndefined();
    expect(getApiErrorCode(failure('<html>Bad gateway</html>', 502))).toBeUndefined();
  });
});
