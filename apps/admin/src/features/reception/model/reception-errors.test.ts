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
  PURCHASE_NOT_FOUND_MESSAGE,
  PURCHASE_NOT_PENDING_MESSAGE,
  RECEIVE_FAILED_MESSAGE,
  RECEIVE_OFFLINE_MESSAGE,
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

  it('explains that the purchase no longer exists and asks for a new lookup', async () => {
    const error = await apiError(404, { code: 'PURCHASE_NOT_FOUND' });

    expect(classifyReceiveError(error)).toEqual({
      kind: 'relookup',
      message: PURCHASE_NOT_FOUND_MESSAGE,
    });
  });

  it('explains that the purchase was already received or cancelled and asks for a new lookup', async () => {
    const error = await apiError(409, { code: 'PURCHASE_NOT_PENDING' });

    expect(classifyReceiveError(error)).toEqual({
      kind: 'relookup',
      message: PURCHASE_NOT_PENDING_MESSAGE,
    });
  });

  it('words the two purchase failures differently', () => {
    expect(PURCHASE_NOT_FOUND_MESSAGE).not.toBe(PURCHASE_NOT_PENDING_MESSAGE);
  });

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
  ])(
    'does not blame the connection when the server answered with %s',
    async (_label, status, body) => {
      const error = await apiError(status, body);

      expect(classifyReceiveError(error)).toEqual({
        kind: 'generic',
        message: RECEIVE_FAILED_MESSAGE,
      });
    }
  );

  it('blames the connection only for a real network failure', async () => {
    server.use(http.post('*/api/packages', () => HttpResponse.error()));

    expect(classifyReceiveError(await rejectionOf())).toEqual({
      kind: 'generic',
      message: RECEIVE_OFFLINE_MESSAGE,
    });
  });

  it.each([new Error('boom'), 'boom', undefined])(
    'does not blame the connection for the non api error %j',
    (error) => {
      expect(classifyReceiveError(error)).toEqual({
        kind: 'generic',
        message: RECEIVE_FAILED_MESSAGE,
      });
    }
  );

  it('writes the messages in Spanish for the operator', () => {
    expect(PURCHASE_NOT_FOUND_MESSAGE).toMatch(/ya no existe/);
    expect(PURCHASE_NOT_PENDING_MESSAGE).toMatch(/ya fue recibida o cancelada/);
    expect(CUSTOMER_INACTIVE_MESSAGE).toMatch(/ya no está activo/);
    expect(CUSTOMER_MISMATCH_MESSAGE).toMatch(/otro cliente/);
    expect(RECEIVE_FAILED_MESSAGE).toMatch(/No pudimos registrar la recepción/);
    expect(RECEIVE_FAILED_MESSAGE).not.toMatch(/conexión/);
    expect(RECEIVE_OFFLINE_MESSAGE).toMatch(/Revisa tu conexión/);
  });
});
