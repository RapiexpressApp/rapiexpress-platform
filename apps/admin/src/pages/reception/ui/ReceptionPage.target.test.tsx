import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  CUSTOMER_ID,
  customerSearchHandler,
  customerSummaryFixture,
  lookupHandler,
  OTHER_PURCHASE_ID,
  PURCHASE_ID,
  receiveHandler,
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

describe('ReceptionPage with one matching purchase', () => {
  const lookup = receptionLookupFixture({ matches: [receptionMatchFixture()] });

  it('goes straight to the details with the purchase and its customer', async () => {
    renderReceptionPage(lookupHandler(lookup));

    await scanGuide(TRACKING_NUMBER);

    expect(await screen.findByText('Compra encontrada')).toBeInTheDocument();
    expect(screen.getByText('Paso 3 de 4 · Datos del bulto')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe · MI-00001')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Peso \(lb\)/ })).toHaveFocus();
  });

  it('prefills the form from the purchase but leaves the weight to the scale', async () => {
    renderReceptionPage(lookupHandler(lookup));

    await scanGuide(TRACKING_NUMBER);

    expect(await screen.findByRole('textbox', { name: 'Descripción' })).toHaveValue(
      'Zapatos deportivos'
    );
    expect(screen.getByRole('textbox', { name: /Valor declarado/ })).toHaveValue('59,99');
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('MIGRANT');
    expect(screen.getByRole('textbox', { name: /Peso \(lb\)/ })).toHaveValue('');
  });

  it('sends the purchase id and not the customer id', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(lookup),
      receiveHandler(undefined, (b) => bodies.push(b))
    );
    await scanGuide(TRACKING_NUMBER);
    await enterWeight('2,5');
    await reviewReception();

    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      trackingNumber: TRACKING_NUMBER,
      purchaseId: PURCHASE_ID,
      weightLb: 2.5,
      description: 'Zapatos deportivos',
      declaredValueUsd: 59.99,
      category: 'MIGRANT',
    });
    expect(bodies[0]).not.toHaveProperty('customerId');
  });

  it('does not offer to change the destination because there is nothing else to choose', async () => {
    renderReceptionPage(lookupHandler(lookup));

    await scanGuide(TRACKING_NUMBER);
    await screen.findByText('Compra encontrada');

    expect(screen.queryByRole('button', { name: 'Cambiar destino' })).toBeNull();
  });
});

describe('ReceptionPage with several matching purchases', () => {
  const second = receptionMatchFixture({
    purchaseId: OTHER_PURCHASE_ID,
    customer: customerSummaryFixture({ name: 'Luis', lastName: 'Pérez', lockerCode: 'MI-00002' }),
    store: 'Shein',
    description: 'Vestido azul',
    declaredValueUsd: 20,
    suggestedCategory: 'FOUR_BY_FOUR',
  });
  const lookup = receptionLookupFixture({ matches: [receptionMatchFixture(), second] });

  it('lets the operator pick the purchase and uses its data', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(lookup),
      receiveHandler(undefined, (b) => bodies.push(b))
    );
    await scanGuide(TRACKING_NUMBER);

    await userEvent.click(await screen.findByRole('button', { name: /Usar esta compra de Shein/ }));

    expect(await screen.findByRole('textbox', { name: 'Descripción' })).toHaveValue('Vestido azul');
    expect(screen.getByText('Luis Pérez · MI-00002')).toBeInTheDocument();
    await enterWeight('1');
    await reviewReception();
    await confirmReception();
    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).toMatchObject({ purchaseId: OTHER_PURCHASE_ID, weightLb: 1 });
  });

  it('lets the operator go back and pick the other purchase', async () => {
    renderReceptionPage(lookupHandler(lookup));
    await scanGuide(TRACKING_NUMBER);
    await userEvent.click(await screen.findByRole('button', { name: /Usar esta compra de Shein/ }));

    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar destino' }));

    expect(
      await screen.findByRole('heading', { name: 'Esta guía coincide con varias compras' })
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Usar esta compra de Amazon/ }));
    expect(await screen.findByRole('textbox', { name: 'Descripción' })).toHaveValue(
      'Zapatos deportivos'
    );
  });
});

describe('ReceptionPage without a matching purchase', () => {
  const lookup = receptionLookupFixture();

  it('assigns the package to the customer found with the reception search', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(lookup),
      customerSearchHandler([customerSummaryFixture()]),
      receiveHandler(undefined, (b) => bodies.push(b))
    );
    await scanGuide(TRACKING_NUMBER);

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Buscar cliente' }),
      'MI-00001'
    );
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));

    expect(await screen.findByText('Cliente: Jane Doe · MI-00001')).toBeInTheDocument();
    await enterWeight('3');
    await reviewReception();
    await confirmReception();
    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).toEqual({
      trackingNumber: TRACKING_NUMBER,
      customerId: CUSTOMER_ID,
      weightLb: 3,
    });
  });

  it('receives the package without a customer only after the explicit choice', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(lookup),
      receiveHandler(undefined, (b) => bodies.push(b))
    );
    await scanGuide(TRACKING_NUMBER);

    expect(
      await screen.findByRole('heading', { name: 'No encontramos una pre-alerta para esta guía' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Peso \(lb\)/ })).toBeNull();
    await userEvent.click(
      screen.getByRole('button', { name: 'Sin cliente (bandeja de no asignados)' })
    );

    expect(
      await screen.findByText('Sin cliente: irá a la bandeja de no asignados.')
    ).toBeInTheDocument();
    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();
    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).toEqual({ trackingNumber: TRACKING_NUMBER, weightLb: 2.5 });
  });

  it('goes back from the details to choose another customer', async () => {
    renderReceptionPage(lookupHandler(lookup), customerSearchHandler([customerSummaryFixture()]));
    await scanGuide(TRACKING_NUMBER);
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar cliente' }), 'jane');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));
    await screen.findByText('Cliente: Jane Doe · MI-00001');

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar destino' }));

    expect(await screen.findByRole('searchbox', { name: 'Buscar cliente' })).toBeInTheDocument();
    expect(screen.getByText('Paso 2 de 4 · Destino del bulto')).toBeInTheDocument();
  });
});

describe('ReceptionPage rescanning from the destination step', () => {
  it.each([
    ['no purchase matches', receptionLookupFixture()],
    [
      'several purchases match',
      receptionLookupFixture({
        matches: [
          receptionMatchFixture(),
          receptionMatchFixture({ purchaseId: OTHER_PURCHASE_ID, store: 'Shein' }),
        ],
      }),
    ],
  ])('lets the operator scan a corrected guide when %s', async (_label, lookup) => {
    const requests: URL[] = [];
    renderReceptionPage(lookupHandler(lookup, (url) => requests.push(url)));
    await scanGuide('TBA00000001');
    await screen.findByText('Paso 2 de 4 · Destino del bulto');

    await userEvent.click(screen.getByRole('button', { name: 'Escanear otra guía' }));

    await waitFor(() => expect(getGuideInput()).toHaveFocus());
    expect(getGuideInput()).toHaveValue('');
    expect(screen.getByText('Paso 1 de 4 · Escanear guía')).toBeInTheDocument();
    await scanGuide(TRACKING_NUMBER);
    await screen.findByText('Paso 2 de 4 · Destino del bulto');
    expect(requests.map((url) => url.searchParams.get('trackingNumber'))).toEqual([
      'TBA00000001',
      TRACKING_NUMBER,
    ]);
  });
});
