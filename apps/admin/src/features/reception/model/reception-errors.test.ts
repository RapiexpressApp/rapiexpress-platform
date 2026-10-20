import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { packagesApi } from '@/shared/api/api';
import { existingPackageFixture, receiveErrorHandler } from '@/test/reception-handlers';
import { server } from '@/test/server';

import {
  classifyReceiveError,
  CUSTOMER_INACTIVE_MESSAGE,
  CUSTOMER_MISMATCH_MESSAGE,
  DUPLICATE_UNREADABLE_MESSAGE,
  PURCHASE_UNAVAILABLE_MESSAGE,
  RECEIVE_FAILED_MESSAGE,
} from './reception-errors';

async function apiError(status: number, data: Record<string, unknown>): Promise<unknown> {
  server.use(receiveErrorHandler(status, data));
  return rejectionOf();
}

async function rejectionOf(): Promise<unknown> {
  try {
    await packagesApi.receive({ trackingNumber: 'TBA123456789', weightLb: 2.5 });
  } catch (error) {
    return error;
  }
  throw new Error('the request was expected to fail');
}

describe('classifyReceiveError', () => {
  it('returns the packages stored under the same guide for a duplicate', async () => {
    const packages = [existingPackageFixture(), existingPackageFixture({ id: 'k2' })];

    const error = await apiError(409, {
      code: 'DUPLICATE_TRACKING_NUMBER',
      existingPackages: packages,
    });

    expect(classifyReceiveError(error)).toEqual({ kind: 'duplicate', packages });
  });

  it('asks for a new lookup when a duplicate arrives without a readable list', async () => {
    const error = await apiError(409, { code: 'DUPLICATE_TRACKING_NUMBER', existingPackages: 1 });

    expect(classifyReceiveError(error)).toEqual({
      kind: 'relookup',
      message: DUPLICATE_UNREADABLE_MESSAGE,
    });
  });

  it.each(['PURCHASE_NOT_PENDING', 'PURCHASE_NOT_FOUND'])(
    'asks for a new lookup when %s',
    async (code) => {
      expect(classifyReceiveError(await apiError(409, { code }))).toEqual({
        kind: 'relookup',
        message: PURCHASE_UNAVAILABLE_MESSAGE,
      });
    }
  );

  it('asks for a new lookup when the purchase belongs to another customer', async () => {
    const error = await apiError(409, { code: 'CUSTOMER_PURCHASE_MISMATCH' });

    expect(classifyReceiveError(error)).toEqual({
      kind: 'relookup',
      message: CUSTOMER_MISMATCH_MESSAGE,
    });
  });

  it('flags a customer that is no longer active', async () => {
    const error = await apiError(404, { code: 'CUSTOMER_NOT_FOUND' });

    expect(classifyReceiveError(error)).toEqual({
      kind: 'customer-inactive',
      message: CUSTOMER_INACTIVE_MESSAGE,
    });
  });

  it.each([
    ['an unknown code', 500, { code: 'SOMETHING_ELSE' }],
    ['no code', 500, { message: 'boom' }],
    ['a validation error', 400, { statusCode: 400, message: ['weightLb must be positive'] }],
  ])('falls back to a generic message for %s', async (_label, status, body) => {
    const error = await apiError(status, body);

    expect(classifyReceiveError(error)).toEqual({
      kind: 'generic',
      message: RECEIVE_FAILED_MESSAGE,
    });
  });

  it('falls back to a generic message for a network failure', async () => {
    server.use(http.post('*/api/packages', () => HttpResponse.error()));

    expect(classifyReceiveError(await rejectionOf())).toEqual({
      kind: 'generic',
      message: RECEIVE_FAILED_MESSAGE,
    });
  });

  it.each([new Error('boom'), 'boom', undefined])(
    'falls back to a generic message for the non api error %j',
    (error) => {
      expect(classifyReceiveError(error)).toEqual({
        kind: 'generic',
        message: RECEIVE_FAILED_MESSAGE,
      });
    }
  );

  it('writes the messages in Spanish for the operator', () => {
    expect(PURCHASE_UNAVAILABLE_MESSAGE).toMatch(/ya no está pendiente/);
    expect(CUSTOMER_INACTIVE_MESSAGE).toMatch(/ya no está activo/);
    expect(CUSTOMER_MISMATCH_MESSAGE).toMatch(/otro cliente/);
    expect(RECEIVE_FAILED_MESSAGE).toMatch(/No pudimos registrar la recepción/);
  });
});
