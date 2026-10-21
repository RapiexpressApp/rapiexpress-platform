import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  customerSearchHandler,
  customerSummaryFixture,
  OTHER_PURCHASE_ID,
  receptionLookupFixture,
  receptionMatchFixture,
} from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import TargetStep from './TargetStep';

function renderStep(lookup = receptionLookupFixture()) {
  const onChoose = vi.fn();
  const onRestart = vi.fn();
  renderWithProviders(<TargetStep lookup={lookup} onChoose={onChoose} onRestart={onRestart} />, {
    withSession: false,
  });
  return { onChoose, onRestart };
}

describe('TargetStep without a matching purchase', () => {
  it('explains that nothing matched and moves focus there', () => {
    renderStep();

    expect(
      screen.getByRole('heading', { name: 'No encontramos una pre-alerta para esta guía' })
    ).toHaveFocus();
  });

  it('assigns the package to the customer the operator finds', async () => {
    server.use(customerSearchHandler([customerSummaryFixture()]));
    const { onChoose } = renderStep();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar cliente' }), 'MI-00001');
    await userEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'customer', customer: customerSummaryFixture() });
  });

  it('receives the package without a customer only when the operator says so', async () => {
    const { onChoose } = renderStep();

    expect(onChoose).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Sin cliente (bandeja de no asignados)' })
    );

    expect(onChoose).toHaveBeenCalledWith({ kind: 'unassigned' });
  });

  it('lets the operator scan another guide when the first one was a typo', async () => {
    const { onChoose, onRestart } = renderStep();

    await userEvent.click(screen.getByRole('button', { name: 'Escanear otra guía' }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onChoose).not.toHaveBeenCalled();
  });
});

describe('TargetStep with matching purchases', () => {
  it('lets the operator pick one of the purchases', async () => {
    const first = receptionMatchFixture();
    const second = receptionMatchFixture({ purchaseId: OTHER_PURCHASE_ID, store: 'Shein' });
    const { onChoose } = renderStep(receptionLookupFixture({ matches: [first, second] }));

    await userEvent.click(screen.getByRole('button', { name: /Usar esta compra de Shein/ }));

    expect(onChoose).toHaveBeenCalledWith({ kind: 'purchase', match: second });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('lets the operator scan another guide instead of picking one', async () => {
    const first = receptionMatchFixture();
    const second = receptionMatchFixture({ purchaseId: OTHER_PURCHASE_ID, store: 'Shein' });
    const { onChoose, onRestart } = renderStep(
      receptionLookupFixture({ matches: [first, second] })
    );

    await userEvent.click(screen.getByRole('button', { name: 'Escanear otra guía' }));

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(onChoose).not.toHaveBeenCalled();
  });
});
