import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { getApiErrorCode } from './http-error.ts';
import { getExistingPackages } from './package-errors.ts';
import { createPackagesApi } from './packages.api.ts';
import { setAccessToken } from './token-store.ts';

const existing = {
  id: 'k0',
  warehouseNumber: 'WH-000041',
  status: 'SHIPPED',
  customerId: null,
  createdAt: '2025-12-31T00:00:00.000Z',
};

const duplicateBody = {
  statusCode: 409,
  error: 'Conflict',
  code: 'DUPLICATE_TRACKING_NUMBER',
  message: 'A package with this tracking number was already received; confirm to store it again',
  existingPackages: [existing],
};

const failure = (data: unknown, status = 409) =>
  Object.assign(new AxiosError('failed'), { response: { status, data } });

describe('getExistingPackages', () => {
  it('reads the existing packages of a duplicate tracking number conflict', () => {
    expect(getExistingPackages(failure(duplicateBody))).toEqual([existing]);
  });

  it('returns undefined for any other error code', () => {
    const other = { ...duplicateBody, code: 'CUSTOMER_PURCHASE_MISMATCH' };

    expect(getExistingPackages(failure(other))).toBeUndefined();
  });

  it('returns undefined when the packages do not match the contract', () => {
    const drifted = { ...duplicateBody, existingPackages: [{ ...existing, status: 'LOST' }] };

    expect(getExistingPackages(failure(drifted))).toBeUndefined();
    expect(
      getExistingPackages(failure({ ...duplicateBody, existingPackages: undefined }))
    ).toBeUndefined();
  });

  it('returns undefined for non axios errors and missing bodies', () => {
    expect(getExistingPackages(new Error('nope'))).toBeUndefined();
    expect(getExistingPackages(duplicateBody)).toBeUndefined();
    expect(getExistingPackages(new AxiosError('offline'))).toBeUndefined();
    expect(getExistingPackages(failure(undefined))).toBeUndefined();
    expect(getExistingPackages(failure(null))).toBeUndefined();
  });

  it('works on the error thrown by a rejected reception', async () => {
    setAccessToken('tok');
    server.use(
      http.post('*/api/packages', () => HttpResponse.json(duplicateBody, { status: 409 }))
    );
    const packagesApi = createPackagesApi(createApiClient({ baseURL: '/api' }));

    const error = await packagesApi
      .receive({ trackingNumber: '1Z999AA10123456784', weightLb: 2.5 })
      .catch((caught: unknown) => caught);

    expect(getApiErrorCode(error)).toBe('DUPLICATE_TRACKING_NUMBER');
    expect(getExistingPackages(error)).toEqual([existing]);
  });
});
