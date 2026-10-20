import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  customerSearchHandler,
  customerSummaryFixture,
  existingPackageFixture,
  lookupHandler,
  packageDetailFixture,
  receptionLookupFixture,
  receptionMatchFixture,
  TRACKING_NUMBER,
} from '@/test/reception-handlers';
import {
  confirmReception,
  enterWeight,
  getGuideInput,
  renderReceptionPage,
  reviewReception,
  scanGuide,
} from '@/test/reception-page';

const matched = receptionLookupFixture({ matches: [receptionMatchFixture()] });

function sequence<T>(...responses: T[]) {
  let index = 0;
  return () => responses[Math.min(index++, responses.length - 1)]!;
}

function lookupSequence(...lookups: ReturnType<typeof receptionLookupFixture>[]) {
  const next = sequence(...lookups);
  const calls: URL[] = [];
  const handler = http.get('*/api/packages/reception/lookup', ({ request }) => {
    calls.push(new URL(request.url));
    return HttpResponse.json(next());
  });
  return { handler, calls };
}

function receiveSequence(...results: ('ok' | { status: number; body: Record<string, unknown> })[]) {
  const next = sequence(...results);
  const bodies: Record<string, unknown>[] = [];
  const handler = http.post('*/api/packages', async ({ request }) => {
    bodies.push((await request.json()) as Record<string, unknown>);
    const result = next();
    return result === 'ok'
      ? HttpResponse.json(packageDetailFixture(), { status: 201 })
      : HttpResponse.json(result.body, { status: result.status });
  });
  return { handler, bodies };
}

async function reachConfirmation() {
  await scanGuide(TRACKING_NUMBER);
  await enterWeight('2,5');
  await reviewReception();
  await confirmReception();
}

describe('ReceptionPage when another scan wins the race', () => {
  const raced = [
    existingPackageFixture({ id: 'k9', warehouseNumber: 'WH-000099', status: 'IN_WAREHOUSE' }),
  ];

  it('returns to the duplicate warning with the packages the backend reports', async () => {
    const { handler, bodies } = receiveSequence({
      status: 409,
      body: { code: 'DUPLICATE_TRACKING_NUMBER', existingPackages: raced },
    });
    renderReceptionPage(lookupHandler(matched), handler);

    await reachConfirmation();

    expect(
      await screen.findByRole('heading', { name: 'Esta guía ya fue recibida' })
    ).toBeInTheDocument();
    expect(screen.getByText('WH-000099')).toBeInTheDocument();
    expect(screen.getByText('En bodega')).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).not.toHaveProperty('confirmDuplicate');
  });

  it('resends the same package with the duplicate confirmed once the operator agrees', async () => {
    const { handler, bodies } = receiveSequence(
      { status: 409, body: { code: 'DUPLICATE_TRACKING_NUMBER', existingPackages: raced } },
      'ok'
    );
    renderReceptionPage(lookupHandler(matched), handler);
    await reachConfirmation();

    await userEvent.click(await screen.findByRole('button', { name: 'Es otro bulto' }));
    expect(await screen.findByText('Confirmado como otro bulto')).toBeInTheDocument();
    expect(screen.getByText('2,5 lb')).toBeInTheDocument();
    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({ weightLb: 2.5, confirmDuplicate: true });
  });

  it('asks for a new lookup when the duplicate arrives without a readable list', async () => {
    const lookups = lookupSequence(matched, receptionLookupFixture({ existingPackages: raced }));
    const { handler } = receiveSequence({
      status: 409,
      body: { code: 'DUPLICATE_TRACKING_NUMBER' },
    });
    renderReceptionPage(lookups.handler, handler);

    await reachConfirmation();

    expect(
      await screen.findByRole('heading', { name: 'Esta guía ya fue recibida' })
    ).toBeInTheDocument();
    expect(lookups.calls).toHaveLength(2);
  });
});

describe('ReceptionPage when the purchase is no longer available', () => {
  it.each([
    ['PURCHASE_NOT_PENDING', 409],
    ['PURCHASE_NOT_FOUND', 404],
  ])('explains %s and looks the guide up again', async (code, status) => {
    const lookups = lookupSequence(matched, receptionLookupFixture());
    const { handler } = receiveSequence({ status, body: { code } });
    renderReceptionPage(lookups.handler, handler);

    await reachConfirmation();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La compra ya no está pendiente de recepción.'
    );
    expect(
      await screen.findByRole('heading', { name: 'No encontramos una pre-alerta para esta guía' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(lookups.calls).toHaveLength(2);
    expect(lookups.calls[1]?.searchParams.get('trackingNumber')).toBe(TRACKING_NUMBER);
  });

  it('shows the guide being consulted again while the new lookup runs', async () => {
    let calls = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { handler } = receiveSequence({ status: 409, body: { code: 'PURCHASE_NOT_PENDING' } });
    renderReceptionPage(
      http.get('*/api/packages/reception/lookup', async () => {
        calls += 1;
        if (calls > 1) await gate;
        return HttpResponse.json(matched);
      }),
      handler
    );

    await reachConfirmation();

    expect(await screen.findByRole('button', { name: /Buscando/ })).toBeDisabled();
    expect(getGuideInput()).toHaveValue(TRACKING_NUMBER);
    expect(screen.getByRole('alert')).toHaveTextContent('Consultamos la guía de nuevo.');
    release();
    await screen.findByText('Compra encontrada');
  });

  it('lets the operator retry when the new lookup fails too', async () => {
    let calls = 0;
    const { handler } = receiveSequence({ status: 409, body: { code: 'PURCHASE_NOT_PENDING' } });
    renderReceptionPage(
      http.get('*/api/packages/reception/lookup', () => {
        calls += 1;
        return calls === 2 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(matched);
      }),
      handler
    );
    await reachConfirmation();

    expect(await screen.findByText('No pudimos consultar la guía.')).toBeInTheDocument();
    expect(getGuideInput()).toHaveValue(TRACKING_NUMBER);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Compra encontrada')).toBeInTheDocument();
    expect(calls).toBe(3);
  });

  it('explains a purchase that belongs to another customer and looks the guide up again', async () => {
    const lookups = lookupSequence(matched, receptionLookupFixture());
    const { handler } = receiveSequence({
      status: 409,
      body: { code: 'CUSTOMER_PURCHASE_MISMATCH' },
    });
    renderReceptionPage(lookups.handler, handler);

    await reachConfirmation();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La compra pertenece a otro cliente.'
    );
    await screen.findByRole('heading', { name: 'No encontramos una pre-alerta para esta guía' });
    expect(lookups.calls).toHaveLength(2);
  });
});

describe('ReceptionPage when the customer is no longer active', () => {
  it('explains it and goes back to choosing a customer', async () => {
    const { handler, bodies } = receiveSequence({
      status: 404,
      body: { code: 'CUSTOMER_NOT_FOUND' },
    });
    renderReceptionPage(
      lookupHandler(receptionLookupFixture()),
      customerSearchHandler([customerSummaryFixture()]),
      handler
    );
    await scanGuide(TRACKING_NUMBER);
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar cliente' }), 'jane');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));
    await enterWeight('2,5');
    await reviewReception();

    await confirmReception();

    expect(await screen.findByRole('alert')).toHaveTextContent('El cliente ya no está activo.');
    expect(await screen.findByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 4 · Destino del bulto')).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
  });

  it('clears the explanation once the operator chooses again', async () => {
    const { handler } = receiveSequence({ status: 404, body: { code: 'CUSTOMER_NOT_FOUND' } });
    renderReceptionPage(
      lookupHandler(receptionLookupFixture()),
      customerSearchHandler([customerSummaryFixture()]),
      handler
    );
    await scanGuide(TRACKING_NUMBER);
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar cliente' }), 'jane');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));
    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();
    await screen.findByText('El cliente ya no está activo.', { exact: false });

    await userEvent.click(
      screen.getByRole('button', { name: 'Sin cliente (bandeja de no asignados)' })
    );

    await screen.findByRole('textbox', { name: /Peso \(lb\)/ });
    expect(screen.queryByText('El cliente ya no está activo.', { exact: false })).toBeNull();
  });

  it('lets the operator dismiss the explanation', async () => {
    const { handler } = receiveSequence({ status: 404, body: { code: 'CUSTOMER_NOT_FOUND' } });
    renderReceptionPage(
      lookupHandler(receptionLookupFixture()),
      customerSearchHandler([customerSummaryFixture()]),
      handler
    );
    await scanGuide(TRACKING_NUMBER);
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar cliente' }), 'jane');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));
    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();
    const alert = await screen.findByRole('alert');

    await userEvent.click(within(alert).getByRole('button', { name: 'Cerrar aviso' }));

    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ReceptionPage on any other failure', () => {
  it('shows a retryable message and keeps the confirmation', async () => {
    const { handler, bodies } = receiveSequence({ status: 500, body: { message: 'boom' } }, 'ok');
    renderReceptionPage(lookupHandler(matched), handler);
    await reachConfirmation();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos registrar la recepción.'
    );
    expect(screen.getByRole('heading', { name: 'Confirma la recepción' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar recepción' })).toBeEnabled();

    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies).toHaveLength(2);
    expect(screen.queryByText('No pudimos registrar la recepción.', { exact: false })).toBeNull();
  });

  it('treats an unknown error code as a generic failure', async () => {
    const { handler } = receiveSequence({ status: 409, body: { code: 'SOMETHING_NEW' } });
    renderReceptionPage(lookupHandler(matched), handler);

    await reachConfirmation();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos registrar la recepción.'
    );
  });

  it('treats a network failure as a generic failure', async () => {
    renderReceptionPage(
      lookupHandler(matched),
      http.post('*/api/packages', () => HttpResponse.error())
    );

    await reachConfirmation();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos registrar la recepción.'
    );
  });

  it('does not leave an old failure behind when the next package is received', async () => {
    const { handler } = receiveSequence({ status: 500, body: {} }, 'ok');
    renderReceptionPage(lookupHandler(matched), handler);
    await reachConfirmation();
    await screen.findByRole('alert');
    await confirmReception();
    await screen.findByRole('heading', { name: 'Paquete recibido' });

    await userEvent.click(screen.getByRole('button', { name: 'Recibir otro' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(getGuideInput()).toHaveValue('');
  });
});
