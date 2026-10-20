import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import ScanStep from './ScanStep';

function renderStep(props: Partial<React.ComponentProps<typeof ScanStep>> = {}) {
  const onScan = vi.fn();
  const onRetry = vi.fn();
  renderWithProviders(
    <ScanStep pending={false} failed={false} onScan={onScan} onRetry={onRetry} {...props} />,
    { withSession: false }
  );
  return { onScan, onRetry, input: screen.getByRole('textbox', { name: 'Guía de seguimiento' }) };
}

describe('ScanStep', () => {
  it('focuses the guide input so a scanner can type right away', () => {
    const { input } = renderStep();

    expect(input).toHaveFocus();
  });

  it('submits the normalized guide when the scanner presses Enter', async () => {
    const { onScan } = renderStep();

    await userEvent.keyboard('1z999-aa1 0123456784{Enter}');

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('1Z999AA10123456784');
  });

  it('submits with the search button too', async () => {
    const { onScan, input } = renderStep();

    await userEvent.type(input, 'TBA123456789');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar guía' }));

    expect(onScan).toHaveBeenCalledWith('TBA123456789');
  });

  it('shows an inline error and sends nothing for an invalid guide', async () => {
    const { onScan, input } = renderStep();

    await userEvent.type(input, 'AB-12{Enter}');

    expect(onScan).not.toHaveBeenCalled();
    expect(screen.getByText('La guía debe tener entre 6 y 64 letras o números.')).toBeVisible();
    expect(input).toBeInvalid();
    expect(input).toHaveFocus();
  });

  it('asks for the guide when the input is empty', async () => {
    const { onScan } = renderStep();

    await userEvent.keyboard('{Enter}');

    expect(onScan).not.toHaveBeenCalled();
    expect(screen.getByText('Ingresa la guía.')).toBeVisible();
  });

  it('clears the error once the next valid guide is submitted', async () => {
    const { onScan, input } = renderStep();

    await userEvent.type(input, 'AB-12{Enter}');
    await userEvent.clear(input);
    await userEvent.type(input, 'TBA123456789{Enter}');

    expect(onScan).toHaveBeenCalledWith('TBA123456789');
    expect(screen.queryByText('La guía debe tener entre 6 y 64 letras o números.')).toBeNull();
  });

  it('ignores a second Enter while the lookup is pending', async () => {
    const { onScan } = renderStep({ pending: true, initialValue: 'TBA123456789' });

    await userEvent.keyboard('{Enter}');

    expect(onScan).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Buscando/ })).toBeDisabled();
  });

  it('shows the guide that is being looked up again', () => {
    const { input } = renderStep({ initialValue: 'TBA123456789' });

    expect(input).toHaveValue('TBA123456789');
  });

  it('offers a retry when the lookup failed', async () => {
    const { onRetry } = renderStep({ failed: true, initialValue: 'TBA123456789' });

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos consultar la guía.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
