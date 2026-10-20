import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  customerSummaryFixture,
  OTHER_PURCHASE_ID,
  receptionMatchFixture,
} from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import MatchPicker from './MatchPicker';

const first = receptionMatchFixture();
const second = receptionMatchFixture({
  purchaseId: OTHER_PURCHASE_ID,
  customer: customerSummaryFixture({ name: 'Luis', lastName: 'Pérez', lockerCode: 'MI-00002' }),
  store: 'Shein',
  description: 'Vestido azul',
  declaredValueUsd: 20,
  estimatedWeightLb: 1,
  suggestedCategory: 'FOUR_BY_FOUR',
});

function renderPicker(matches = [first, second]) {
  const onChoose = vi.fn();
  renderWithProviders(<MatchPicker matches={matches} onChoose={onChoose} />, {
    withSession: false,
  });
  return { onChoose };
}

describe('MatchPicker', () => {
  it('explains that several purchases share the guide and moves focus there', () => {
    renderPicker();

    expect(
      screen.getByRole('heading', { name: 'Esta guía coincide con varias compras' })
    ).toHaveFocus();
  });

  it('shows each purchase with its customer, store, value, weight and category', () => {
    renderPicker();

    const [one, two] = screen.getAllByRole('listitem');
    expect(within(one!).getByText('Jane Doe · MI-00001')).toBeInTheDocument();
    expect(within(one!).getByText('Amazon')).toBeInTheDocument();
    expect(within(one!).getByText('Zapatos deportivos')).toBeInTheDocument();
    expect(within(one!).getByText('USD 59,99')).toBeInTheDocument();
    expect(within(one!).getByText('2,5 lb')).toBeInTheDocument();
    expect(within(one!).getByText('G (migrante)')).toBeInTheDocument();
    expect(within(two!).getByText('Luis Pérez · MI-00002')).toBeInTheDocument();
    expect(within(two!).getByText('Shein')).toBeInTheDocument();
    expect(within(two!).getByText('4x4')).toBeInTheDocument();
  });

  it('hands over the purchase the operator picks', async () => {
    const { onChoose } = renderPicker();

    await userEvent.click(
      screen.getByRole('button', { name: 'Usar esta compra de Shein, Luis Pérez · MI-00002' })
    );

    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith(second);
  });

  it('copes with a purchase whose customer data is missing', () => {
    renderPicker([receptionMatchFixture({ customer: null }), second]);

    expect(screen.getByText('Cliente sin datos')).toBeInTheDocument();
  });
});
