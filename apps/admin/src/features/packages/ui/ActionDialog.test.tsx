import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { useDialogBusy } from '../model/dialog-busy';
import ActionDialog from './ActionDialog';

function Content({ busy }: { busy: boolean }) {
  useDialogBusy(busy);
  return <button type="button">Confirmar</button>;
}

function renderDialog(busy: boolean, onClose = vi.fn()) {
  renderWithProviders(
    <ActionDialog open title="Mover paquete" description="Descripción del cambio" onClose={onClose}>
      <Content busy={busy} />
    </ActionDialog>,
    { withSession: false }
  );
  return onClose;
}

describe('ActionDialog', () => {
  it('names the dialog and describes it', async () => {
    renderDialog(false);

    const dialog = await screen.findByRole('dialog', { name: 'Mover paquete' });

    expect(dialog).toHaveAccessibleDescription('Descripción del cambio');
  });

  it('can be an alert dialog', async () => {
    renderWithProviders(
      <ActionDialog open alert title="Confirmar" onClose={vi.fn()}>
        <p>Contenido</p>
      </ActionDialog>,
      { withSession: false }
    );

    expect(await screen.findByRole('alertdialog', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('closes on Escape and with the close button while idle', async () => {
    const onClose = renderDialog(false);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
  });

  it('cannot be closed while its content reports a pending request', async () => {
    const onClose = renderDialog(true);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
  });
});
