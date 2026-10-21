import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { customerSummaryFixture, receptionMatchFixture } from '@/test/reception-handlers';
import { renderWithProviders } from '@/test/render';

import { getInitialFormInput } from '../model/reception-form-values';
import type { ReceptionTarget } from '../model/reception-target';
import ReceptionForm from './ReceptionForm';

const unassigned: ReceptionTarget = { kind: 'unassigned' };

function renderForm(
  target: ReceptionTarget = unassigned,
  props: Partial<React.ComponentProps<typeof ReceptionForm>> = {}
) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <ReceptionForm
      target={target}
      defaultValues={getInitialFormInput(target)}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
    { withSession: false }
  );
  return { onSubmit, onCancel, weight: screen.getByRole('textbox', { name: /Peso \(lb\)/ }) };
}

describe('ReceptionForm', () => {
  it('names the form so screen reader users can find it', () => {
    renderForm();

    expect(screen.getByRole('form', { name: 'Datos del bulto' })).toBeInTheDocument();
  });

  it('focuses the weight so the scale reading can be typed right away', () => {
    const { weight } = renderForm();

    expect(weight).toHaveFocus();
  });

  it('requires the weight and sends nothing without it', async () => {
    const { onSubmit, weight } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('El peso es obligatorio.')).toBeVisible();
    expect(weight).toBeInvalid();
    expect(weight).toHaveFocus();
  });

  it('turns a weight with a decimal comma into a number', async () => {
    const { onSubmit, weight } = renderForm();

    await userEvent.type(weight, '2,5');
    await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [input, values] = onSubmit.mock.calls[0]!;
    expect(input).toMatchObject({ weightLb: '2,5', description: '' });
    expect(values).toEqual({ weightLb: 2.5 });
  });

  it('leaves the blank optional fields out of the values', async () => {
    const { onSubmit, weight } = renderForm();

    await userEvent.type(weight, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));

    expect(onSubmit.mock.calls[0]![1]).toEqual({ weightLb: 3 });
  });

  it('collects the type, category, value, description and notes', async () => {
    const { onSubmit, weight } = renderForm();

    await userEvent.type(weight, '4');
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo de paquete' }),
      'FRAGILE'
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Categoría' }),
      'COMMERCIAL'
    );
    await userEvent.type(screen.getByRole('textbox', { name: /Valor declarado/ }), '45,90');
    await userEvent.type(screen.getByRole('textbox', { name: 'Descripción' }), ' Zapatos ');
    await userEvent.type(screen.getByRole('textbox', { name: 'Notas' }), 'Caja abollada');
    await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));

    expect(onSubmit.mock.calls[0]![1]).toEqual({
      weightLb: 4,
      packageType: 'FRAGILE',
      category: 'COMMERCIAL',
      declaredValueUsd: 45.9,
      description: 'Zapatos',
      notes: 'Caja abollada',
    });
  });

  it('rejects values the backend would refuse', async () => {
    const { onSubmit, weight } = renderForm();

    await userEvent.type(weight, '1,234');
    await userEvent.type(screen.getByRole('textbox', { name: /Valor declarado/ }), 'caro');
    await userEvent.click(screen.getByRole('button', { name: 'Revisar recepción' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('El peso admite como máximo 2 decimales.')).toBeVisible();
    expect(screen.getByText('El valor declarado debe ser un número.')).toBeVisible();
  });

  it('offers a normal package by default and the fragile option', () => {
    renderForm();

    const type = screen.getByRole('combobox', { name: 'Tipo de paquete' });
    expect(type).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Normal (predeterminado)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Frágil' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('');
  });

  it('keeps what was typed when the form is reopened', () => {
    renderForm(unassigned, {
      defaultValues: {
        weightLb: '2,5',
        packageType: 'FRAGILE',
        category: 'MIGRANT',
        declaredValueUsd: '10,00',
        description: 'Zapatos',
        notes: 'Frágil',
      },
    });

    expect(screen.getByRole('textbox', { name: /Peso \(lb\)/ })).toHaveValue('2,5');
    expect(screen.getByRole('combobox', { name: 'Tipo de paquete' })).toHaveValue('FRAGILE');
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('MIGRANT');
    expect(screen.getByRole('textbox', { name: /Valor declarado/ })).toHaveValue('10,00');
  });

  describe('destination', () => {
    it('shows the matched purchase, prefills the form and hints the estimated weight', () => {
      const { weight } = renderForm({ kind: 'purchase', match: receptionMatchFixture() });

      expect(screen.getByText('Compra encontrada')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe · MI-00001')).toBeInTheDocument();
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Descripción' })).toHaveValue(
        'Zapatos deportivos'
      );
      expect(screen.getByRole('textbox', { name: /Valor declarado/ })).toHaveValue('59,99');
      expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('MIGRANT');
      expect(weight).toHaveValue('');
      expect(weight).toHaveAccessibleDescription(/Peso estimado por el cliente: 2,5 lb/);
    });

    it('shows the customer the package will be assigned to', () => {
      renderForm({ kind: 'customer', customer: customerSummaryFixture() });

      expect(screen.getByText('Cliente: Jane Doe · MI-00001')).toBeInTheDocument();
    });

    it('says plainly that the package goes to the unassigned tray', () => {
      renderForm(unassigned);

      expect(
        screen.getByText('Sin cliente: irá a la bandeja de no asignados.')
      ).toBeInTheDocument();
    });

    it('lets the operator change the destination only when there is another one to choose', async () => {
      const onChangeTarget = vi.fn();
      const { unmount } = renderWithProviders(
        <ReceptionForm
          target={unassigned}
          defaultValues={getInitialFormInput(unassigned)}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onChangeTarget={onChangeTarget}
        />,
        { withSession: false }
      );

      await userEvent.click(screen.getByRole('button', { name: 'Cambiar destino' }));
      expect(onChangeTarget).toHaveBeenCalledTimes(1);
      unmount();

      renderForm();
      expect(screen.queryByRole('button', { name: 'Cambiar destino' })).toBeNull();
    });
  });

  it('lets the operator abandon the package and scan another guide', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Escanear otra guía' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
