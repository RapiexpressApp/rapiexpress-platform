import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { purchasesApi } from '@/shared/api/api';
import { CUSTOMER_ID } from '@/test/reception-handlers';
import { server } from '@/test/server';

import { classifyCreateError } from './purchase-errors';

async function rejection(): Promise<unknown> {
  try {
    await purchasesApi.create({
      customerId: CUSTOMER_ID,
      store: 'Amazon',
      trackingNumber: '1Z999AA10123456784',
      description: 'Zapatos deportivos',
      declaredValueUsd: 59.99,
      estimatedWeightLb: 2.5,
      suggestedCategory: 'MIGRANT',
    });
  } catch (error) {
    return error;
  }
  throw new Error('the request was expected to fail');
}

async function failure(status: number, body: Record<string, unknown> = {}) {
  server.use(http.post('*/api/purchases', () => HttpResponse.json(body, { status })));
  return rejection();
}

describe('classifyCreateError', () => {
  it('points a duplicate guide at the guide field', async () => {
    const error = await failure(409, { statusCode: 409, code: 'DUPLICATE_PURCHASE' });

    expect(classifyCreateError(error)).toEqual({
      kind: 'duplicate',
      message: 'Este cliente ya tiene una pre-alerta activa con esta guía.',
    });
  });

  it('sends the operator back to the customer when the customer is no longer active', async () => {
    const error = await failure(404, { statusCode: 404, code: 'CUSTOMER_NOT_FOUND' });

    expect(classifyCreateError(error)).toEqual({
      kind: 'customer-inactive',
      message: 'El cliente ya no está activo. Elige otro cliente.',
    });
  });

  it('asks to review the data when the server rejects them', async () => {
    const error = await failure(400, { statusCode: 400, message: ['store must be a string'] });

    expect(classifyCreateError(error)).toEqual({
      kind: 'message',
      message: 'El servidor rechazó algún dato. Revisa el formulario e inténtalo de nuevo.',
    });
  });

  it('keeps the data and asks to try again on an unknown failure', async () => {
    const error = await failure(500, { statusCode: 500, code: 'SOMETHING_ELSE' });

    expect(classifyCreateError(error)).toEqual({
      kind: 'message',
      message: 'No pudimos crear la pre-alerta. Inténtalo de nuevo.',
    });
  });

  it('suggests checking the connection when the request got no response', async () => {
    server.use(http.post('*/api/purchases', () => HttpResponse.error()));

    expect(classifyCreateError(await rejection())).toEqual({
      kind: 'message',
      message: 'No pudimos crear la pre-alerta. Revisa tu conexión e inténtalo de nuevo.',
    });
  });

  it('does not treat an unrelated error as a known one', () => {
    expect(classifyCreateError(new Error('boom'))).toEqual({
      kind: 'message',
      message: 'No pudimos crear la pre-alerta. Inténtalo de nuevo.',
    });
  });
});
