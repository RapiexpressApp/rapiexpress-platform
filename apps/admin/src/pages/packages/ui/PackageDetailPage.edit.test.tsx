import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderPackageDetailPage } from '@/test/package-detail-page';
import {
  createGate,
  packageActionHandler,
  packageDetailHandler,
  packageErrorHandler,
  packageStaffDetailFixture,
} from '@/test/packages-handlers';

const EDITABLE = ['IN_WAREHOUSE', 'CONSOLIDATED', 'IN_BAG'] as const;
const LOCKED = ['SHIPPED', 'IN_CUSTOMS', 'AT_AGENCY', 'READY_FOR_PICKUP', 'DELIVERED'] as const;

const EDIT_TITLE = 'Editar datos del paquete';

async function openEdit() {
  await userEvent.click(await screen.findByRole('button', { name: 'Editar datos' }));
  return within(await screen.findByRole('dialog', { name: EDIT_TITLE }));
}

async function replaceText(input: HTMLElement, text: string) {
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

const save = (dialog: ReturnType<typeof within>) =>
  userEvent.click(dialog.getByRole('button', { name: 'Guardar cambios' }));

describe('edit data availability', () => {
  it.each(EDITABLE)('offers the edit action while the package is %s', async (status) => {
    renderPackageDetailPage({}, packageDetailHandler(packageStaffDetailFixture({ status })));

    expect(await screen.findByRole('button', { name: 'Editar datos' })).toBeInTheDocument();
  });

  it.each(LOCKED)('hides the edit action once the package is %s', async (status) => {
    renderPackageDetailPage({}, packageDetailHandler(packageStaffDetailFixture({ status })));
    await screen.findByRole('heading', { level: 1, name: 'WH-000042' });

    expect(screen.queryByRole('button', { name: 'Editar datos' })).toBeNull();
  });
});

describe('edit data form', () => {
  it('opens with the current data and the decimal comma', async () => {
    renderPackageDetailPage({}, packageDetailHandler());

    const dialog = await openEdit();

    expect(dialog.getByRole('textbox', { name: /Peso \(lb\)/ })).toHaveValue('2,5');
    expect(dialog.getByRole('textbox', { name: /Valor declarado/ })).toHaveValue('59,99');
    expect(dialog.getByRole('textbox', { name: 'Descripción' })).toHaveValue('Zapatos deportivos');
    expect(dialog.getByRole('textbox', { name: 'Notas' })).toHaveValue(
      'Caja con una esquina golpeada'
    );
    expect(dialog.getByRole('combobox', { name: 'Tipo de paquete' })).toHaveValue('NORMAL');
    expect(dialog.getByRole('combobox', { name: 'Categoría' })).toHaveValue('MIGRANT');
  });

  it('sends only the fields that changed, saves, toasts and shows the new data', async () => {
    const bodies: Record<string, unknown>[] = [];
    let current = packageStaffDetailFixture();
    const updated = packageStaffDetailFixture({ weightLb: 3.25, weightKg: 1.47 });
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () => HttpResponse.json(current)),
      packageActionHandler('patch', '', updated, {
        onRequest: (body) => {
          bodies.push(body);
          current = updated;
        },
      })
    );
    const dialog = await openEdit();

    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '3,25');
    await save(dialog);

    expect(await screen.findByText('Datos del paquete actualizados.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toEqual([{ weightLb: 3.25 }]);
    expect(await screen.findByText('3,25 lb · 1,47 kg')).toBeInTheDocument();
  });

  it('reads a decimal comma in the declared value and changes the selects', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();

    await replaceText(dialog.getByRole('textbox', { name: /Valor declarado/ }), '80,5');
    await userEvent.selectOptions(
      dialog.getByRole('combobox', { name: 'Tipo de paquete' }),
      'Frágil'
    );
    await userEvent.selectOptions(
      dialog.getByRole('combobox', { name: 'Categoría' }),
      'C (comercial)'
    );
    await save(dialog);

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({
      declaredValueUsd: 80.5,
      packageType: 'FRAGILE',
      category: 'COMMERCIAL',
    });
  });

  it('never sends the fields that were blank and stay blank', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(
        packageStaffDetailFixture({
          category: null,
          declaredValueUsd: null,
          description: null,
          notes: null,
        })
      ),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();

    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '4');
    await save(dialog);

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ weightLb: 4 });
  });

  it('offers no way to blank the category once it is set, but does when it is missing', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const filled = await openEdit();
    expect(
      within(filled.getByRole('combobox', { name: 'Categoría' })).queryByRole('option', {
        name: 'Sin definir',
      })
    ).toBeNull();
  });

  it('lets the operator define a category that was missing', async () => {
    const bodies: Record<string, unknown>[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(packageStaffDetailFixture({ category: null })),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();
    expect(dialog.getByRole('combobox', { name: 'Categoría' })).toHaveValue('');

    await userEvent.selectOptions(dialog.getByRole('combobox', { name: 'Categoría' }), '4x4');
    await save(dialog);

    await waitFor(() => expect(bodies).toEqual([{ category: 'FOUR_BY_FOUR' }]));
  });

  it('tells the operator when nothing changed and sends nothing', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();

    await save(dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Modifica al menos un campo para guardar los cambios.'
    );
    expect(bodies).toHaveLength(0);
    expect(screen.getByRole('dialog', { name: EDIT_TITLE })).toBeInTheDocument();
  });

  it('treats a change that only differs in formatting as no change', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();

    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '2.50');
    await replaceText(
      dialog.getByRole('textbox', { name: 'Descripción' }),
      '  Zapatos deportivos  '
    );
    await save(dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent('Modifica al menos un campo');
    expect(bodies).toHaveLength(0);
  });

  it('clears the no change message as soon as the operator edits again', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const dialog = await openEdit();
    await save(dialog);
    await dialog.findByRole('alert');

    await userEvent.type(dialog.getByRole('textbox', { name: 'Notas' }), '!');

    expect(dialog.queryByRole('alert')).toBeNull();
  });

  it('rejects an invalid weight before the request and focuses the field', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();
    const weight = dialog.getByRole('textbox', { name: /Peso \(lb\)/ });

    await replaceText(weight, 'abc');
    await save(dialog);

    expect(await dialog.findByText('El peso debe ser un número.')).toBeInTheDocument();
    await waitFor(() => expect(weight).toHaveFocus());
    expect(bodies).toHaveLength(0);
  });

  it('asks for the weight when it is blank', async () => {
    renderPackageDetailPage({}, packageDetailHandler());
    const dialog = await openEdit();

    await userEvent.clear(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }));
    await save(dialog);

    expect(await dialog.findByText('El peso es obligatorio.')).toBeInTheDocument();
  });

  it('explains that a filled field cannot be emptied, since the API cannot clear it', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();

    await userEvent.clear(dialog.getByRole('textbox', { name: 'Descripción' }));
    await userEvent.clear(dialog.getByRole('textbox', { name: /Valor declarado/ }));
    await save(dialog);

    expect(await dialog.findAllByText(/no se puede borrar/)).toHaveLength(2);
    await waitFor(() =>
      expect(dialog.getByRole('textbox', { name: /Valor declarado/ })).toHaveFocus()
    );
    expect(bodies).toHaveLength(0);
  });
});

describe('edit data failures', () => {
  it('closes and explains when the package can no longer be edited, then refreshes', async () => {
    let shipped = false;
    renderPackageDetailPage(
      {},
      http.get('*/api/packages/:id', () =>
        HttpResponse.json(
          packageStaffDetailFixture({ status: shipped ? 'SHIPPED' : 'IN_WAREHOUSE' })
        )
      ),
      packageErrorHandler('patch', '', 'PACKAGE_NOT_EDITABLE')
    );
    const dialog = await openEdit();
    shipped = true;

    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '3');
    await save(dialog);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este paquete ya salió de la bodega y sus datos ya no se pueden editar.'
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Editar datos' })).toBeNull());
    expect(screen.getByText('Embarcado')).toBeInTheDocument();
  });

  it('keeps the dialog open on a generic failure and succeeds on the next try', async () => {
    let calls = 0;
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      http.patch('*/api/packages/:id', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(packageStaffDetailFixture());
      })
    );
    const dialog = await openEdit();
    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '3');

    await save(dialog);
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'No pudimos guardar los cambios. Inténtalo de nuevo.'
    );
    expect(screen.getByRole('dialog', { name: EDIT_TITLE })).toBeInTheDocument();

    await save(dialog);
    expect(await screen.findByText('Datos del paquete actualizados.')).toBeInTheDocument();
  });
});

describe('edit data while saving', () => {
  it('sends a single request when the form is submitted twice in the same tick', async () => {
    const { gate, release } = createGate();
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        gate,
        onRequest: (body) => bodies.push(body),
      })
    );
    const dialog = await openEdit();
    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '3');
    const form = screen.getByRole('form', { name: EDIT_TITLE });

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    release();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(bodies).toHaveLength(1);
  });

  it('cannot be closed while saving', async () => {
    const { gate, release } = createGate();
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), { gate })
    );
    const dialog = await openEdit();
    await replaceText(dialog.getByRole('textbox', { name: /Peso \(lb\)/ }), '3');

    await save(dialog);
    await waitFor(() => expect(dialog.getByRole('button', { name: /Guardando/ })).toBeDisabled());
    await userEvent.keyboard('{Escape}');

    expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('dialog', { name: EDIT_TITLE })).toBeInTheDocument();
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('edit data focus', () => {
  it('closes on cancel without a request and returns focus to the edit button', async () => {
    const bodies: unknown[] = [];
    renderPackageDetailPage(
      {},
      packageDetailHandler(),
      packageActionHandler('patch', '', packageStaffDetailFixture(), {
        onRequest: (body) => bodies.push(body),
      })
    );
    const trigger = await screen.findByRole('button', { name: 'Editar datos' });
    const dialog = await openEdit();

    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(bodies).toHaveLength(0);
  });
});
