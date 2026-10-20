import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  customerSummaryFixture,
  receptionMatchFixture,
  TRACKING_NUMBER,
} from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import type { ReceptionTarget } from '../model/reception-target';
import ReceptionSummary from './ReceptionSummary';

function renderSummary(props: Partial<React.ComponentProps<typeof ReceptionSummary>> = {}) {
  const onConfirm = vi.fn();
  const onEdit = vi.fn();
  const target: ReceptionTarget = { kind: 'unassigned' };
  renderWithProviders(
    <ReceptionSummary
      trackingNumber={TRACKING_NUMBER}
      target={target}
      values={{ weightLb: 2.5 }}
      duplicateConfirmed={false}
      pending={false}
      onConfirm={onConfirm}
      onEdit={onEdit}
      {...props}
    />,
    { withSession: false }
  );
  return { onConfirm, onEdit };
}

describe('ReceptionSummary', () => {
  it('asks for the confirmation and moves focus to it', () => {
    renderSummary();

    expect(screen.getByRole('heading', { name: 'Confirma la recepción' })).toHaveFocus();
  });

  it('summarizes an unassigned package with only the weight', () => {
    renderSummary();

    expect(screen.getByText(TRACKING_NUMBER)).toBeInTheDocument();
    expect(screen.getByText('Sin asignar (bandeja de no asignados)')).toBeInTheDocument();
    expect(screen.getByText('2,5 lb')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.queryByText('Categoría')).toBeNull();
    expect(screen.queryByText('Valor declarado')).toBeNull();
    expect(screen.queryByText('Descripción')).toBeNull();
    expect(screen.queryByText('Notas')).toBeNull();
    expect(screen.queryByText('Compra')).toBeNull();
  });

  it('summarizes the customer, the purchase and every detail the operator filled in', () => {
    renderSummary({
      target: { kind: 'purchase', match: receptionMatchFixture() },
      values: {
        weightLb: 12.75,
        packageType: 'FRAGILE',
        category: 'COMMERCIAL',
        declaredValueUsd: 59.99,
        description: 'Zapatos',
        notes: 'Caja abollada',
      },
    });

    expect(screen.getByText('Jane Doe · MI-00001')).toBeInTheDocument();
    expect(screen.getByText('Amazon: Zapatos deportivos')).toBeInTheDocument();
    expect(screen.getByText('12,75 lb')).toBeInTheDocument();
    expect(screen.getByText('Frágil')).toBeInTheDocument();
    expect(screen.getByText('C (comercial)')).toBeInTheDocument();
    expect(screen.getByText('USD 59,99')).toBeInTheDocument();
    expect(screen.getByText('Zapatos')).toBeInTheDocument();
    expect(screen.getByText('Caja abollada')).toBeInTheDocument();
  });

  it('shows the customer picked in the search', () => {
    renderSummary({ target: { kind: 'customer', customer: customerSummaryFixture() } });

    expect(screen.getByText('Jane Doe · MI-00001')).toBeInTheDocument();
    expect(screen.queryByText('Compra')).toBeNull();
  });

  it('records that the duplicate was confirmed', () => {
    renderSummary({ duplicateConfirmed: true });

    expect(screen.getByText('Confirmado como otro bulto')).toBeInTheDocument();
  });

  it('confirms the reception', async () => {
    const { onConfirm } = renderSummary();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar recepción' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('goes back to edit the details', async () => {
    const { onEdit, onConfirm } = renderSummary();

    await userEvent.click(screen.getByRole('button', { name: 'Editar datos' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks a second confirmation and the edit while the request is pending', async () => {
    const { onConfirm, onEdit } = renderSummary({ pending: true });

    await userEvent.click(screen.getByRole('button', { name: /Registrando/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Editar datos' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Registrando/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Editar datos' })).toBeDisabled();
  });

  it('shows why the reception failed', () => {
    renderSummary({ errorMessage: 'No pudimos registrar la recepción.' });

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos registrar la recepción.');
  });
});
