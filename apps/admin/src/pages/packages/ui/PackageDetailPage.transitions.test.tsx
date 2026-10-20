import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  createGate,
  packageActionHandler,
  packageDetailHandler,
  packageErrorHandler,
  packageIncidentFixture,
  packageStaffDetailFixture,
} from '@/test/packages-handlers';

const shipped = (overrides = {}) =>
  packageStaffDetailFixture({
    status: 'SHIPPED',
    allowedTransitions: ['IN_CUSTOMS'],
    ...overrides,
  });

async function openConfirmation(name = 'Mover a En aduana') {
  await userEvent.click(await screen.findByRole('button', { name }));
  return within(await screen.findByRole('alertdialog', { name }));
}

const confirm = (dialog: ReturnType<typeof within>, name = 'Mover a En aduana') =>
  userEvent.click(dialog.getByRole('button', { name }));

describe('transition buttons', () => {
  it('renders one button per status the server allows, in the server order', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        shipped({ allowedTransitions: ['IN_CUSTOMS', 'AT_AGENCY', 'READY_FOR_PICKUP'] })
      )
    );
    const group = within(await screen.findByRole('group', { name: 'Cambiar estado' }));

    expect(group.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Mover a En aduana',
      'Mover a En agencia',
      'Mover a Listo para retirar',
    ]);
  });

  it('does not compute transitions of its own', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped({ allowedTransitions: ['AT_AGENCY'] }))
    );
    await screen.findByRole('group', { name: 'Cambiar estado' });

    expect(screen.queryByRole('button', { name: 'Mover a En aduana' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mover a Entregado' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mover a En agencia' })).toBeEnabled();
  });

  it('says there is nothing to do when the server allows no manual move', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ allowedTransitions: [] }))
    );

    expect(
      await screen.findByText('No hay cambios de estado manuales disponibles.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Cambiar estado' })).toBeNull();
  });

  it('keeps the buttons visible but disabled, with the reason, while an incident is open', async () => {
    const open = packageIncidentFixture();
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped({ openIncident: open, incidents: [open] }))
    );
    const button = await screen.findByRole('button', { name: 'Mover a En aduana' });

    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(
      /Resuelve la incidencia abierta para poder cambiar el estado\./
    );
    await userEvent.click(button);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('enables the buttons when there is no open incident', async () => {
    renderPackageDetailPage({}, packageDetailHandler(shipped()));

    expect(await screen.findByRole('button', { name: 'Mover a En aduana' })).toBeEnabled();
    expect(screen.queryByText(/Resuelve la incidencia abierta/)).toBeNull();
  });
});

describe('transition confirmation', () => {
  it('names the package and both statuses before moving it', async () => {
    renderPackageDetailPage({}, packageDetailHandler(shipped()));

    const dialog = await openConfirmation();

    expect(dialog.getByText(/WH-000042/)).toBeInTheDocument();
    expect(dialog.getByText(/«Embarcado»/)).toBeInTheDocument();
    expect(dialog.getByText(/«En aduana»/)).toBeInTheDocument();
    expect(dialog.getByText(/historial/)).toBeInTheDocument();
  });

  it('sends nothing when the operator backs out, and returns focus to the button', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped()),
      packageActionHandler('post', '/transitions', shipped(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const trigger = await screen.findByRole('button', { name: 'Mover a En aduana' });
    const dialog = await openConfirmation();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(bodies).toHaveLength(0);
  });

  it('puts the initial focus on the safe action', async () => {
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(0, 0, 100, 40),
    ] as unknown as DOMRectList);
    renderPackageDetailPage({}, packageDetailHandler(shipped()));

    const dialog = await openConfirmation();

    await waitFor(() => expect(dialog.getByRole('button', { name: 'Cancelar' })).toHaveFocus());
  });

  it('moves the package, toasts, refreshes and offers the next moves', async () => {
    const bodies: unknown[] = [];
    let current = shipped();
    const moved = packageStaffDetailFixture({
      status: 'IN_CUSTOMS',
      allowedTransitions: ['AT_AGENCY'],
    });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/transitions', moved, {
        onRequest: (body) => {
          bodies.push(body);
          current = moved;
        },
      })
    );
    const dialog = await openConfirmation();

    await confirm(dialog);

    expect(await screen.findByText('Estado del paquete actualizado.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(bodies).toEqual([{ to: 'IN_CUSTOMS' }]);
    expect(await screen.findByRole('button', { name: 'Mover a En agencia' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mover a En aduana' })).toBeNull();
  });

  it('moves focus to the page heading when the button that opened the dialog is gone', async () => {
    let current = shipped();
    const moved = packageStaffDetailFixture({
      status: 'IN_CUSTOMS',
      allowedTransitions: ['AT_AGENCY'],
    });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/transitions', moved, {
        onRequest: () => {
          current = moved;
        },
      })
    );
    const dialog = await openConfirmation();

    await confirm(dialog);

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'WH-000042' })).toHaveFocus()
    );
  });
});

describe('transition failures', () => {
  it('shows the statuses the server allows when the move is invalid, and refreshes', async () => {
    let current = shipped();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageErrorHandler('post', '/transitions', 'INVALID_TRANSITION', {
        from: 'SHIPPED',
        to: 'IN_CUSTOMS',
        allowed: ['AT_AGENCY'],
      })
    );
    const dialog = await openConfirmation();
    current = shipped({ allowedTransitions: ['AT_AGENCY'] });

    await confirm(dialog);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede mover el paquete de «Embarcado» a «En aduana». Movimientos permitidos: «En agencia».'
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(await screen.findByRole('button', { name: 'Mover a En agencia' })).toBeInTheDocument();
  });

  it('refreshes the package when its status changed meanwhile', async () => {
    let current = shipped();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageErrorHandler('post', '/transitions', 'PACKAGE_STATUS_CHANGED')
    );
    const dialog = await openConfirmation();
    current = packageStaffDetailFixture({
      status: 'IN_CUSTOMS',
      allowedTransitions: ['AT_AGENCY'],
    });

    await confirm(dialog);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El estado del paquete cambió mientras lo revisabas.'
    );
    expect(await screen.findByRole('button', { name: 'Mover a En agencia' })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('points to the incidents when one blocks the move, and disables the buttons after refreshing', async () => {
    const open = packageIncidentFixture();
    let current = shipped();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageErrorHandler('post', '/transitions', 'PACKAGE_HAS_OPEN_INCIDENT')
    );
    const dialog = await openConfirmation();
    current = shipped({ openIncident: open, incidents: [open] });

    await confirm(dialog);

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(
      'El paquete tiene una incidencia abierta. Resuélvela antes de cambiar su estado.'
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Mover a En aduana' })).toBeDisabled()
    );

    await userEvent.click(within(notice).getByRole('button', { name: 'Ver incidencias' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Incidencias' })).toHaveFocus();
  });

  it('keeps the dialog open on a generic failure and moves on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped()),
      http.post('*/api/packages/:id/transitions', () => {
        calls += 1;
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(shipped());
      })
    );
    const dialog = await openConfirmation();

    await confirm(dialog);
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos cambiar el estado del paquete. Inténtalo de nuevo.'
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await confirm(dialog);
    expect(await screen.findByText('Estado del paquete actualizado.')).toBeInTheDocument();
  });
});

describe('transition while pending', () => {
  it('sends a single request when confirmed twice in the same tick', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped()),
      packageActionHandler('post', '/transitions', shipped(), {
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openConfirmation();
    const button = dialog.getByRole('button', { name: 'Mover a En aduana' });

    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    release();

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });

  it('cannot be closed while moving', async () => {
    const { gate, release } = createGate();
    renderPackageDetailPage(
      {},
      packageDetailHandler(shipped()),
      packageActionHandler('post', '/transitions', shipped(), { gate })
    );
    const dialog = await openConfirmation();

    await confirm(dialog);
    await waitFor(() => expect(dialog.getByRole('button', { name: /Moviendo/ })).toBeDisabled());
    await userEvent.keyboard('{Escape}');

    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    release();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});
