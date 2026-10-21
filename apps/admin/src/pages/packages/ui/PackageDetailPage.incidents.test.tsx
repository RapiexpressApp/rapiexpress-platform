import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  createGate,
  INCIDENT_ID,
  packageActionHandler,
  packageDetailHandler,
  packageErrorHandler,
  packageIncidentFixture,
  packageStaffDetailFixture,
  staffUserFixture,
} from '@/test/packages-handlers';

const withOpenIncident = (overrides = {}) => {
  const open = packageIncidentFixture(overrides);
  return packageStaffDetailFixture({ openIncident: open, incidents: [open] });
};

const OPEN_TITLE = 'Abrir incidencia';
const RESOLVE_TITLE = 'Resolver incidencia';

async function openIncidentDialog() {
  await userEvent.click(await screen.findByRole('button', { name: OPEN_TITLE }));
  return within(await screen.findByRole('dialog', { name: OPEN_TITLE }));
}

async function resolveDialog() {
  await userEvent.click(await screen.findByRole('button', { name: RESOLVE_TITLE }));
  return within(await screen.findByRole('dialog', { name: RESOLVE_TITLE }));
}

async function fillIncident(dialog: ReturnType<typeof within>, type: string, reason: string) {
  await userEvent.selectOptions(dialog.getByRole('combobox', { name: 'Tipo de incidencia' }), type);
  await userEvent.type(dialog.getByRole('textbox', { name: 'Motivo' }), reason);
}

const submitOpen = (dialog: ReturnType<typeof within>) =>
  userEvent.click(dialog.getByRole('button', { name: OPEN_TITLE }));

const submitResolve = (dialog: ReturnType<typeof within>) =>
  userEvent.click(dialog.getByRole('button', { name: RESOLVE_TITLE }));

describe('open an incident', () => {
  it('offers the action only while no incident is open', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    expect(await screen.findByRole('button', { name: OPEN_TITLE })).toBeInTheDocument();
  });

  it('hides the action while an incident is open', async () => {
    renderPackageDetailPage({}, packageDetailHandler(withOpenIncident()));
    await screen.findByRole('group', { name: 'Incidencia abierta' });

    expect(screen.queryByRole('button', { name: OPEN_TITLE })).toBeNull();
  });

  it('keeps it available when every earlier incident is resolved', async () => {
    const resolved = packageIncidentFixture({
      resolvedBy: staffUserFixture(),
      resolvedAt: '2026-03-18T10:00:00.000Z',
    });
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ incidents: [resolved] }))
    );

    expect(await screen.findByRole('button', { name: OPEN_TITLE })).toBeInTheDocument();
  });

  it('offers the five incident types in Spanish', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const dialog = await openIncidentDialog();

    const options = within(dialog.getByRole('combobox', { name: 'Tipo de incidencia' }))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual([
      'Selecciona un tipo',
      'Dañado',
      'Retenido en aduana',
      'Extraviado',
      'Abandonado',
      'Otro',
    ]);
  });

  it('opens it with a type and a trimmed reason, then shows the flag and the resolve action', async () => {
    const bodies: unknown[] = [];
    let current = packageStaffDetailFixture();
    const opened = withOpenIncident({ type: 'CUSTOMS_HOLD', reason: 'Revisión de aduana' });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/incidents', packageIncidentFixture(), {
        status: 201,
        onRequest: (body) => {
          bodies.push(body);
          current = opened;
        },
      })
    );
    const dialog = await openIncidentDialog();

    await fillIncident(dialog, 'Retenido en aduana', '  Revisión de aduana  ');
    await submitOpen(dialog);

    expect(await screen.findByText('Incidencia abierta.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toEqual([{ type: 'CUSTOMS_HOLD', reason: 'Revisión de aduana' }]);
    expect(await screen.findByRole('button', { name: RESOLVE_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: OPEN_TITLE })).toBeNull();
    expect(screen.getAllByText('Incidencia abierta').length).toBeGreaterThan(0);
  });

  it('requires a type and a reason before sending anything', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('post', '/incidents', packageIncidentFixture(), {
        status: 201,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openIncidentDialog();

    await submitOpen(dialog);

    expect(await dialog.findByText('Selecciona un tipo de incidencia.')).toBeInTheDocument();
    expect(dialog.getByText('Describe la incidencia.')).toBeInTheDocument();
    await waitFor(() =>
      expect(dialog.getByRole('combobox', { name: 'Tipo de incidencia' })).toHaveFocus()
    );
    expect(bodies).toHaveLength(0);
  });

  it('rejects a reason made only of spaces and one that is too long', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const dialog = await openIncidentDialog();
    await userEvent.selectOptions(
      dialog.getByRole('combobox', { name: 'Tipo de incidencia' }),
      'Otro'
    );

    await userEvent.type(dialog.getByRole('textbox', { name: 'Motivo' }), '   ');
    await submitOpen(dialog);
    expect(await dialog.findByText('Describe la incidencia.')).toBeInTheDocument();

    fireEvent.change(dialog.getByRole('textbox', { name: 'Motivo' }), {
      target: { value: 'x'.repeat(501) },
    });
    await submitOpen(dialog);
    expect(
      await dialog.findByText('El motivo no puede superar los 500 caracteres.')
    ).toBeInTheDocument();
  });

  it('closes and points to the incidents when one was opened meanwhile', async () => {
    let current = packageStaffDetailFixture();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageErrorHandler('post', '/incidents', 'INCIDENT_ALREADY_OPEN')
    );
    const dialog = await openIncidentDialog();
    current = withOpenIncident();

    await fillIncident(dialog, 'Dañado', 'Caja rota');
    await submitOpen(dialog);

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(
      'Este paquete ya tiene una incidencia abierta. Resuélvela antes de abrir otra.'
    );
    expect(within(notice).getByRole('button', { name: 'Ver incidencias' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByRole('button', { name: RESOLVE_TITLE })).toBeInTheDocument();
  });

  it('keeps the dialog open on a generic failure and opens on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      http.post('*/api/packages/:id/incidents', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(packageIncidentFixture(), { status: 201 });
      })
    );
    const dialog = await openIncidentDialog();
    await fillIncident(dialog, 'Dañado', 'Caja rota');

    await submitOpen(dialog);
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos abrir la incidencia. Inténtalo de nuevo.'
    );

    await submitOpen(dialog);
    expect(await screen.findByText('Incidencia abierta.')).toBeInTheDocument();
  });

  it('sends one request when submitted twice in the same tick and cannot be closed meanwhile', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('post', '/incidents', packageIncidentFixture(), {
        status: 201,
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openIncidentDialog();
    await fillIncident(dialog, 'Dañado', 'Caja rota');
    const form = screen.getByRole('form', { name: OPEN_TITLE });

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    await userEvent.keyboard('{Escape}');

    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(screen.getByRole('dialog', { name: OPEN_TITLE })).toBeInTheDocument();
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });

  it('moves focus to the incidents section once the action that opened the dialog is gone', async () => {
    let current = packageStaffDetailFixture();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/incidents', packageIncidentFixture(), {
        status: 201,
        onRequest: () => {
          current = withOpenIncident();
        },
      })
    );
    const dialog = await openIncidentDialog();
    await fillIncident(dialog, 'Dañado', 'Caja rota');

    await submitOpen(dialog);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Incidencias' })).toHaveFocus()
    );
  });
});

describe('resolve an incident', () => {
  it('offers the action inside the open incident only', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });
    expect(screen.queryByRole('button', { name: RESOLVE_TITLE })).toBeNull();
  });

  it('resolves it without a note by sending an empty body', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(withOpenIncident()),
      packageActionHandler('post', '/incidents/:incidentId/resolve', packageIncidentFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await resolveDialog();

    await submitResolve(dialog);

    expect(await screen.findByText('Incidencia resuelta.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toEqual([{}]);
  });

  it('sends the trimmed note and shows the resolved incident afterwards', async () => {
    const bodies: unknown[] = [];
    let current = withOpenIncident();
    const resolved = packageIncidentFixture({
      resolvedBy: staffUserFixture({ name: 'Luis', lastName: 'Pérez' }),
      resolvedAt: '2026-03-18T10:00:00.000Z',
      resolutionNote: 'Reempacado',
    });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/incidents/:incidentId/resolve', resolved, {
        onRequest: (body) => {
          bodies.push(body);
          current = packageStaffDetailFixture({ incidents: [resolved] });
        },
      })
    );
    const dialog = await resolveDialog();

    await userEvent.type(
      dialog.getByRole('textbox', { name: /Nota de resolución/ }),
      '  Reempacado  '
    );
    await submitResolve(dialog);

    await waitFor(() => expect(bodies).toEqual([{ resolutionNote: 'Reempacado' }]));
    expect(await screen.findByText('Reempacado')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Incidencia abierta' })).toBeNull();
    expect(await screen.findByRole('button', { name: OPEN_TITLE })).toBeInTheDocument();
  });

  it('treats a note made only of spaces as no note', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(withOpenIncident()),
      packageActionHandler('post', '/incidents/:incidentId/resolve', packageIncidentFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await resolveDialog();

    await userEvent.type(dialog.getByRole('textbox', { name: /Nota de resolución/ }), '   ');
    await submitResolve(dialog);

    await waitFor(() => expect(bodies).toEqual([{}]));
  });

  it('rejects a note that is too long', async () => {
    renderPackageDetailPage({}, packageDetailHandler(withOpenIncident()));
    const dialog = await resolveDialog();

    fireEvent.change(dialog.getByRole('textbox', { name: /Nota de resolución/ }), {
      target: { value: 'x'.repeat(501) },
    });
    await submitResolve(dialog);

    expect(
      await dialog.findByText('La nota no puede superar los 500 caracteres.')
    ).toBeInTheDocument();
  });

  it('targets the open incident by its id', async () => {
    const paths: string[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(withOpenIncident()),
      http.post('*/api/packages/:id/incidents/:incidentId/resolve', ({ params }) => {
        paths.push(String(params.incidentId));
        return HttpResponse.json(packageIncidentFixture());
      })
    );
    const dialog = await resolveDialog();

    await submitResolve(dialog);

    await waitFor(() => expect(paths).toEqual([INCIDENT_ID]));
  });

  it.each([
    ['INCIDENT_ALREADY_RESOLVED', 409, 'Esta incidencia ya fue resuelta.'],
    ['INCIDENT_NOT_FOUND', 404, 'No encontramos esta incidencia.'],
  ])('closes and explains on %s, then refreshes', async (code, status, message) => {
    let current = withOpenIncident();
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageErrorHandler('post', '/incidents/:incidentId/resolve', code, {}, status)
    );
    const dialog = await resolveDialog();
    current = packageStaffDetailFixture();

    await submitResolve(dialog);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByRole('button', { name: OPEN_TITLE })).toBeInTheDocument();
  });

  it('keeps the dialog open on a generic failure', async () => {
    renderPackageDetailPage(
      {},
      packageDetailHandler(withOpenIncident()),
      http.post(
        '*/api/packages/:id/incidents/:incidentId/resolve',
        () => new HttpResponse(null, { status: 500 })
      )
    );
    const dialog = await resolveDialog();

    await submitResolve(dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos resolver la incidencia. Inténtalo de nuevo.'
    );
    expect(screen.getByRole('dialog', { name: RESOLVE_TITLE })).toBeInTheDocument();
  });

  it('sends one request when submitted twice in the same tick', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(withOpenIncident()),
      packageActionHandler('post', '/incidents/:incidentId/resolve', packageIncidentFixture(), {
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    await resolveDialog();
    const form = screen.getByRole('form', { name: RESOLVE_TITLE });

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    release();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });

  it('enables the transitions again once the incident is resolved', async () => {
    let current = withOpenIncident();
    current = { ...current, status: 'SHIPPED', allowedTransitions: ['IN_CUSTOMS'] };
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('post', '/incidents/:incidentId/resolve', packageIncidentFixture(), {
        onRequest: () => {
          current = packageStaffDetailFixture({
            status: 'SHIPPED',
            allowedTransitions: ['IN_CUSTOMS'],
          });
        },
      })
    );
    expect(await screen.findByRole('button', { name: 'Mover a En aduana' })).toBeDisabled();
    const dialog = await resolveDialog();

    await submitResolve(dialog);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Mover a En aduana' })).toBeEnabled()
    );
  });
});
