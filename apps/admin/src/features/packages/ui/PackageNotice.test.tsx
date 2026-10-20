import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import PackageNotice from './PackageNotice';

function renderNotice(props: Partial<React.ComponentProps<typeof PackageNotice>> = {}) {
  const handlers = { onDismiss: vi.fn(), onShowIncidents: vi.fn() };
  renderWithProviders(
    <PackageNotice notice={{ message: 'El paquete cambió.' }} {...handlers} {...props} />,
    { withSession: false }
  );
  return handlers;
}

describe('PackageNotice', () => {
  it('announces the message', () => {
    renderNotice();

    expect(screen.getByRole('alert')).toHaveTextContent('El paquete cambió.');
  });

  it('can be dismissed', async () => {
    const { onDismiss } = renderNotice();

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('only points to the incidents when the notice asks for it', () => {
    renderNotice();

    expect(screen.queryByRole('button', { name: 'Ver incidencias' })).toBeNull();
  });

  it('points to the incidents section', async () => {
    const { onShowIncidents } = renderNotice({
      notice: { message: 'Hay una incidencia abierta.', showIncidents: true },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Ver incidencias' }));

    expect(onShowIncidents).toHaveBeenCalledTimes(1);
  });
});
