import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  customerSummaryFixture,
  existingPackageFixture,
  lookupHandler,
  packageDetailFixture,
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

const unassignedLookup = receptionLookupFixture();

async function reachDetails(...handlers: Parameters<typeof renderReceptionPage>) {
  const view = renderReceptionPage(lookupHandler(unassignedLookup), ...handlers);
  await scanGuide(TRACKING_NUMBER);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Sin cliente (bandeja de no asignados)' })
  );
  await screen.findByRole('textbox', { name: /Peso \(lb\)/ });
  return view;
}

describe('ReceptionPage details', () => {
  it('requires the weight before moving to the confirmation', async () => {
    await reachDetails();

    await reviewReception();

    expect(await screen.findByText('El peso es obligatorio.')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Confirma la recepción' })).toBeNull();
    expect(screen.getByText('Paso 3 de 4 · Datos del bulto')).toBeInTheDocument();
  });

  it('rejects a weight the backend would refuse', async () => {
    await reachDetails();

    await enterWeight('0');
    await reviewReception();

    expect(await screen.findByText('El peso debe ser mayor que 0.')).toBeVisible();
  });

  it('omits every blank optional field from the request', async () => {
    const bodies: Record<string, unknown>[] = [];
    await reachDetails(receiveHandler(undefined, (b) => bodies.push(b)));

    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(Object.keys(bodies[0] ?? {}).sort()).toEqual(['trackingNumber', 'weightLb']);
  });

  it('sends the optional details the operator filled in', async () => {
    const bodies: Record<string, unknown>[] = [];
    await reachDetails(receiveHandler(undefined, (b) => bodies.push(b)));

    await enterWeight('4');
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo de paquete' }),
      'FRAGILE'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Categoría' }),
      'COMMERCIAL'
    );
    await userEvent.type(screen.getByRole('textbox', { name: /Valor declarado/ }), '45,90');
    await userEvent.type(screen.getByRole('textbox', { name: 'Notas' }), 'Caja abollada');
    await reviewReception();
    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).toEqual({
      trackingNumber: TRACKING_NUMBER,
      weightLb: 4,
      packageType: 'FRAGILE',
      category: 'COMMERCIAL',
      declaredValueUsd: 45.9,
      notes: 'Caja abollada',
    });
  });
});

describe('ReceptionPage two-step confirmation', () => {
  it('registers nothing until the operator confirms the summary', async () => {
    const bodies: Record<string, unknown>[] = [];
    await reachDetails(receiveHandler(undefined, (b) => bodies.push(b)));
    await enterWeight('2,5');

    await reviewReception();

    expect(
      await screen.findByRole('heading', { name: 'Confirma la recepción' })
    ).toBeInTheDocument();
    expect(screen.getByText('Paso 4 de 4 · Confirmar')).toBeInTheDocument();
    expect(screen.getByText('2,5 lb')).toBeInTheDocument();
    expect(screen.getByText('Sin asignar (bandeja de no asignados)')).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('goes back to edit the details without losing what was typed', async () => {
    await reachDetails();
    await enterWeight('2,5');
    await userEvent.type(screen.getByRole('textbox', { name: 'Notas' }), 'Caja abollada');
    await reviewReception();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar datos' }));

    expect(await screen.findByRole('textbox', { name: /Peso \(lb\)/ })).toHaveValue('2,5');
    expect(screen.getByRole('textbox', { name: 'Notas' })).toHaveValue('Caja abollada');
  });

  it('registers once even if the confirm button is double clicked', async () => {
    const bodies: Record<string, unknown>[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await reachDetails(
      http.post('*/api/packages', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>);
        await gate;
        return HttpResponse.json(packageDetailFixture(), { status: 201 });
      })
    );
    await enterWeight('2,5');
    await reviewReception();

    await userEvent.dblClick(await screen.findByRole('button', { name: 'Confirmar recepción' }));

    expect(await screen.findByRole('button', { name: /Registrando/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Editar datos' })).toBeDisabled();
    release();
    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies).toHaveLength(1);
  });

  it('confirms a duplicate explicitly and sends the confirmation', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(
        receptionLookupFixture({
          existingPackages: [existingPackageFixture()],
          matches: [receptionMatchFixture()],
        })
      ),
      receiveHandler(undefined, (b) => bodies.push(b))
    );
    await scanGuide(TRACKING_NUMBER);
    await userEvent.click(await screen.findByRole('button', { name: 'Es otro bulto' }));
    await enterWeight('2,5');
    await reviewReception();

    expect(await screen.findByText('Confirmado como otro bulto')).toBeInTheDocument();
    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).toMatchObject({ confirmDuplicate: true });
  });

  it('does not send a duplicate confirmation for a new guide', async () => {
    const bodies: Record<string, unknown>[] = [];
    await reachDetails(receiveHandler(undefined, (b) => bodies.push(b)));
    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(bodies[0]).not.toHaveProperty('confirmDuplicate');
  });
});

describe('ReceptionPage success', () => {
  const received = packageDetailFixture({
    warehouseNumber: 'WH-000077',
    customer: customerSummaryFixture(),
    label: { warehouseNumber: 'WH-000077', customerName: 'Jane Doe', lockerCode: 'MI-00001' },
  });

  async function receive() {
    const view = await reachDetails(receiveHandler(received));
    await enterWeight('2,5');
    await reviewReception();
    await confirmReception();
    await screen.findByRole('heading', { name: 'Paquete recibido' });
    return view;
  }

  it('shows the warehouse number prominently and the label to print', async () => {
    await receive();

    expect(screen.getByRole('region', { name: 'Paquete recibido' })).toHaveTextContent('WH-000077');
    const label = screen.getByLabelText('Etiqueta de bodega');
    expect(label).toHaveTextContent('WH-000077');
    expect(label).toHaveTextContent('Jane Doe');
    expect(label).toHaveTextContent('MI-00001');
  });

  it('prints the label', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    await receive();

    await userEvent.click(screen.getByRole('button', { name: 'Imprimir etiqueta' }));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it('invalidates the package queries so the lists refresh', async () => {
    const { queryClient } = await reachDetails(receiveHandler(received));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await enterWeight('2,5');
    await reviewReception();

    await confirmReception();

    await screen.findByRole('heading', { name: 'Paquete recibido' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['packages'] });
  });

  it('resets and focuses the guide input for the next package', async () => {
    await receive();

    await userEvent.click(screen.getByRole('button', { name: 'Recibir otro' }));

    await waitFor(() => expect(getGuideInput()).toHaveFocus());
    expect(getGuideInput()).toHaveValue('');
    expect(screen.getByText('Paso 1 de 4 · Escanear guía')).toBeInTheDocument();
    expect(screen.queryByText('WH-000077')).toBeNull();
  });

  it('can receive a second package right after the first', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderReceptionPage(
      lookupHandler(receptionLookupFixture({ matches: [receptionMatchFixture()] })),
      receiveHandler(received, (b) => bodies.push(b))
    );
    for (let round = 0; round < 2; round += 1) {
      await scanGuide(TRACKING_NUMBER);
      await enterWeight('2,5');
      await reviewReception();
      await confirmReception();
      await screen.findByRole('heading', { name: 'Paquete recibido' });
      await userEvent.click(screen.getByRole('button', { name: 'Recibir otro' }));
      await waitFor(() => expect(getGuideInput()).toHaveFocus());
    }

    expect(bodies).toHaveLength(2);
  });
});
