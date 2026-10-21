import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { packagesApi } from '@/shared/api/api';
import { PACKAGE_ID } from '@/test/packages-handlers';
import { server } from '@/test/server';

import {
  classifyAssignError,
  classifyLinkError,
  classifyOpenIncidentError,
  classifyResolveError,
  classifyTransitionError,
  classifyUpdateError,
} from './package-action-errors';

async function rejection(): Promise<unknown> {
  try {
    await packagesApi.update(PACKAGE_ID, { weightLb: 3 });
  } catch (error) {
    return error;
  }
  throw new Error('the request was expected to fail');
}

async function failure(code: string, extra: Record<string, unknown> = {}, status = 409) {
  server.use(
    http.patch('*/api/packages/:id', () =>
      HttpResponse.json({ statusCode: status, code, message: code, ...extra }, { status })
    )
  );
  return rejection();
}

async function offline() {
  server.use(http.patch('*/api/packages/:id', () => HttpResponse.error()));
  return rejection();
}

describe('classifyUpdateError', () => {
  it('closes the dialog when the package can no longer be edited', async () => {
    expect(classifyUpdateError(await failure('PACKAGE_NOT_EDITABLE'))).toEqual({
      kind: 'stale',
      notice: {
        message:
          'Este paquete ya salió de la bodega y sus datos ya no se pueden editar. Actualizamos la información.',
      },
    });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyUpdateError(await failure('SOMETHING_ELSE', {}, 500))).toEqual({
      kind: 'inline',
      message: 'No pudimos guardar los cambios. Inténtalo de nuevo.',
    });
  });

  it('suggests checking the connection when the request got no response', async () => {
    expect(classifyUpdateError(await offline())).toEqual({
      kind: 'inline',
      message: 'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.',
    });
  });

  it('does not mistake an inherited property for an error code', async () => {
    expect(classifyUpdateError(await failure('constructor', {}, 500)).kind).toBe('inline');
  });

  it('tells that the package no longer exists', async () => {
    expect(classifyUpdateError(await failure('PACKAGE_NOT_FOUND', {}, 404))).toEqual({
      kind: 'stale',
      notice: { message: 'Este paquete ya no existe.' },
    });
  });
});

describe('classifyTransitionError', () => {
  it('lists the statuses the server still allows', async () => {
    const error = await failure('INVALID_TRANSITION', {
      from: 'SHIPPED',
      to: 'DELIVERED',
      allowed: ['IN_CUSTOMS'],
    });

    expect(classifyTransitionError(error)).toEqual({
      kind: 'stale',
      notice: {
        message:
          'No se puede mover el paquete de «Embarcado» a «Entregado». Movimientos permitidos: «En aduana».',
      },
    });
  });

  it('lists several allowed statuses', async () => {
    const error = await failure('INVALID_TRANSITION', {
      from: 'SHIPPED',
      to: 'DELIVERED',
      allowed: ['IN_CUSTOMS', 'AT_AGENCY'],
    });

    expect(classifyTransitionError(error)).toMatchObject({
      notice: { message: expect.stringContaining('«En aduana», «En agencia»') },
    });
  });

  it('says so when nothing is allowed from the current status', async () => {
    const error = await failure('INVALID_TRANSITION', {
      from: 'DELIVERED',
      to: 'SHIPPED',
      allowed: [],
    });

    expect(classifyTransitionError(error)).toEqual({
      kind: 'stale',
      notice: {
        message:
          'No se puede mover el paquete de «Entregado» a «Embarcado». Desde «Entregado» no hay movimientos permitidos.',
      },
    });
  });

  it('still explains an invalid transition whose body cannot be read', async () => {
    expect(classifyTransitionError(await failure('INVALID_TRANSITION'))).toEqual({
      kind: 'stale',
      notice: { message: 'Ese cambio de estado no está permitido. Actualizamos la información.' },
    });
  });

  it('asks to choose again when the status changed under the operator', async () => {
    expect(classifyTransitionError(await failure('PACKAGE_STATUS_CHANGED'))).toEqual({
      kind: 'stale',
      notice: {
        message:
          'El estado del paquete cambió mientras lo revisabas. Actualizamos la información para que elijas de nuevo.',
      },
    });
  });

  it('points to the incident section when an incident blocks the move', async () => {
    expect(classifyTransitionError(await failure('PACKAGE_HAS_OPEN_INCIDENT'))).toEqual({
      kind: 'stale',
      notice: {
        message: 'El paquete tiene una incidencia abierta. Resuélvela antes de cambiar su estado.',
        showIncidents: true,
      },
    });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyTransitionError(await failure('SOMETHING_ELSE', {}, 500))).toEqual({
      kind: 'inline',
      message: 'No pudimos cambiar el estado del paquete. Inténtalo de nuevo.',
    });
  });
});

describe('classifyAssignError', () => {
  it('closes the dialog when someone else assigned the package first', async () => {
    expect(classifyAssignError(await failure('PACKAGE_ALREADY_ASSIGNED'))).toEqual({
      kind: 'stale',
      notice: {
        message: 'Este paquete ya tiene un cliente asignado. Actualizamos la información.',
      },
    });
  });

  it('asks for another customer when the chosen one is not active', async () => {
    expect(classifyAssignError(await failure('CUSTOMER_NOT_FOUND', {}, 404))).toEqual({
      kind: 'inline',
      message: 'El cliente ya no está activo. Elige otro cliente.',
    });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyAssignError(await offline())).toEqual({
      kind: 'inline',
      message: 'No pudimos asignar el cliente. Revisa tu conexión e inténtalo de nuevo.',
    });
  });
});

describe('classifyLinkError', () => {
  it('closes the dialog when the package is already linked', async () => {
    expect(classifyLinkError(await failure('PACKAGE_ALREADY_LINKED'))).toEqual({
      kind: 'stale',
      notice: {
        message: 'Este paquete ya está vinculado a una compra. Actualizamos la información.',
      },
    });
  });

  it.each([
    ['PURCHASE_NOT_PENDING', 'Esa pre-alerta ya fue recibida o cancelada. Elige otra.'],
    ['PURCHASE_NOT_FOUND', 'Esa pre-alerta ya no existe. Elige otra.'],
    [
      'CUSTOMER_PURCHASE_MISMATCH',
      'Esa pre-alerta pertenece a otro cliente distinto al del paquete. Elige otra.',
    ],
  ])('asks for another purchase on %s', async (code, message) => {
    expect(classifyLinkError(await failure(code))).toEqual({ kind: 'inline', message });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyLinkError(await failure('SOMETHING_ELSE', {}, 500))).toEqual({
      kind: 'inline',
      message: 'No pudimos vincular la compra. Inténtalo de nuevo.',
    });
  });
});

describe('classifyOpenIncidentError', () => {
  it('points to the open incident when there already is one', async () => {
    expect(classifyOpenIncidentError(await failure('INCIDENT_ALREADY_OPEN'))).toEqual({
      kind: 'stale',
      notice: {
        message: 'Este paquete ya tiene una incidencia abierta. Resuélvela antes de abrir otra.',
        showIncidents: true,
      },
    });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyOpenIncidentError(await failure('SOMETHING_ELSE', {}, 500))).toEqual({
      kind: 'inline',
      message: 'No pudimos abrir la incidencia. Inténtalo de nuevo.',
    });
  });
});

describe('classifyResolveError', () => {
  it('closes the dialog when the incident was already resolved', async () => {
    expect(classifyResolveError(await failure('INCIDENT_ALREADY_RESOLVED'))).toEqual({
      kind: 'stale',
      notice: { message: 'Esta incidencia ya fue resuelta. Actualizamos la información.' },
    });
  });

  it('closes the dialog when the incident no longer exists', async () => {
    expect(classifyResolveError(await failure('INCIDENT_NOT_FOUND', {}, 404))).toEqual({
      kind: 'stale',
      notice: { message: 'No encontramos esta incidencia. Actualizamos la información.' },
    });
  });

  it('keeps the dialog open for an unknown failure', async () => {
    expect(classifyResolveError(await failure('SOMETHING_ELSE', {}, 500))).toEqual({
      kind: 'inline',
      message: 'No pudimos resolver la incidencia. Inténtalo de nuevo.',
    });
  });
});
