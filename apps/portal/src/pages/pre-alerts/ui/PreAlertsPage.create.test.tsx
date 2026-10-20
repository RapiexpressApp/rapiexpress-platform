import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { findPurchasesList, renderPreAlertsPage } from '@/test/pre-alerts-page';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

const OPEN_FORM = { name: 'Pre-alertar compra' };

async function openForm() {
  await userEvent.click(await screen.findByRole('button', OPEN_FORM));
  return within(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' }));
}

async function fillForm(form: ReturnType<typeof within>, overrides: { guide?: string } = {}) {
  await userEvent.type(form.getByLabelText('Tienda'), 'Amazon');
  await userEvent.type(
    form.getByLabelText('Guía de seguimiento'),
    overrides.guide ?? 'tba-123456789'
  );
  await userEvent.type(form.getByLabelText('Descripción'), 'Audífonos inalámbricos');
  await userEvent.type(form.getByLabelText('Valor declarado (USD)'), '120,50');
  await userEvent.type(form.getByLabelText('Peso estimado (lb)'), '1.5');
  await userEvent.selectOptions(form.getByLabelText('Categoría sugerida'), 'FOUR_BY_FOUR');
}

const submit = (form: ReturnType<typeof within>) =>
  userEvent.click(form.getByRole('button', { name: 'Crear pre-alerta' }));

describe('PreAlertsPage create dialog', () => {
  it('opens from the primary action and reflects it in the URL', async () => {
    server.use(purchasesListHandler());
    renderPreAlertsPage();

    await openForm();

    expect(screen.getByTestId('search')).toHaveTextContent('?new=1');
  });

  it('opens straight from a deep link', async () => {
    server.use(purchasesListHandler());

    renderPreAlertsPage('/pre-alerts?new=1');

    expect(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
  });

  it('moves focus into the dialog, closes on Escape and returns focus to the trigger', async () => {
    server.use(purchasesListHandler());
    renderPreAlertsPage();
    const trigger = await screen.findByRole('button', OPEN_FORM);

    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Nueva pre-alerta' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes with the explicit close button and the back button', async () => {
    server.use(purchasesListHandler());
    renderPreAlertsPage();

    let form = await openForm();
    await userEvent.click(form.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    form = await openForm();
    await userEvent.click(form.getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
  });

  it('explains each customs category next to the select', async () => {
    server.use(purchasesListHandler());
    renderPreAlertsPage();

    const form = await openForm();

    const select = form.getByLabelText('Categoría sugerida');
    expect(select).toHaveAccessibleDescription(/4x4: Hasta USD 400 y 8,5 lb\./);
    expect(select).toHaveAccessibleDescription(/G \(migrante\): Para uso personal\./);
    expect(select).toHaveAccessibleDescription(/C \(comercial\): Hasta 100 kg y USD 5\.000\./);
  });

  it('shows every field error and sends no request when the form is empty', async () => {
    let posts = 0;
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () => {
        posts += 1;
        return HttpResponse.json(purchaseFixture(), { status: 201 });
      })
    );
    renderPreAlertsPage();
    const form = await openForm();

    await submit(form);

    expect(await form.findByText('Ingresa la tienda.')).toBeInTheDocument();
    expect(form.getByText('La guía debe tener entre 6 y 64 letras o números.')).toBeInTheDocument();
    expect(form.getByText('Ingresa la descripción.')).toBeInTheDocument();
    expect(form.getByText('El valor declarado es obligatorio.')).toBeInTheDocument();
    expect(form.getByText('El peso estimado es obligatorio.')).toBeInTheDocument();
    expect(form.getByText('Selecciona una categoría.')).toBeInTheDocument();
    expect(form.getByLabelText('Tienda')).toBeInvalid();
    expect(posts).toBe(0);
  });

  it('renders field and form errors with the darker red used for small text', async () => {
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () => new HttpResponse(null, { status: 500 }))
    );
    renderPreAlertsPage();
    const form = await openForm();
    await submit(form);

    const fieldError = await form.findByText('Ingresa la tienda.');
    expect(getComputedStyle(fieldError).color).toBe('var(--chakra-colors-red-600)');

    await fillForm(form);
    await submit(form);

    const formError = await form.findByRole('alert');
    expect(getComputedStyle(formError).color).toBe('var(--chakra-colors-red-600)');
  });

  it('rejects a non-numeric amount before the request', async () => {
    let posts = 0;
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () => {
        posts += 1;
        return HttpResponse.json(purchaseFixture(), { status: 201 });
      })
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);
    await userEvent.clear(form.getByLabelText('Valor declarado (USD)'));
    await userEvent.type(form.getByLabelText('Valor declarado (USD)'), 'doce');

    await submit(form);

    expect(await form.findByText('El valor declarado debe ser un número.')).toBeInTheDocument();
    expect(posts).toBe(0);
  });

  it('creates the pre-alert, closes the dialog, confirms inline and shows the fresh list', async () => {
    const requests: URL[] = [];
    let body: unknown;
    server.use(
      http.get('*/api/me/purchases', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ items: [purchaseFixture()], page: 1, pageSize: 10, total: 1 });
      }),
      http.post('*/api/me/purchases', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(purchaseFixture({ id: 'p2' }), { status: 201 });
      })
    );
    renderPreAlertsPage('/pre-alerts?new=1&status=RECEIVED&page=2');
    const form = within(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' }));
    await fillForm(form);

    await submit(form);

    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('status')).toBe(false));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
    expect(requests.length).toBeGreaterThanOrEqual(2);
    expect(body).toEqual({
      store: 'Amazon',
      trackingNumber: 'TBA123456789',
      description: 'Audífonos inalámbricos',
      declaredValueUsd: 120.5,
      estimatedWeightLb: 1.5,
      suggestedCategory: 'FOUR_BY_FOUR',
    });
  });

  it('refreshes the list after creating', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/api/me/purchases', () => {
        listCalls += 1;
        return HttpResponse.json({ items: [purchaseFixture()], page: 1, pageSize: 10, total: 1 });
      }),
      http.post('*/api/me/purchases', () =>
        HttpResponse.json(purchaseFixture({ id: 'p2' }), { status: 201 })
      )
    );
    renderPreAlertsPage('/pre-alerts?new=1');
    const form = within(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' }));
    await fillForm(form);

    await submit(form);

    await waitFor(() => expect(listCalls).toBe(2));
  });

  it('shows the duplicate guide on its field and keeps the dialog open', async () => {
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () =>
        HttpResponse.json({ code: 'DUPLICATE_PURCHASE', message: 'Duplicate' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);

    await submit(form);

    const guide = form.getByLabelText('Guía de seguimiento');
    expect(await form.findByText('Ya tienes una pre-alerta con esta guía.')).toBeInTheDocument();
    expect(guide).toBeInvalid();
    expect(guide).toHaveFocus();
    expect(form.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('clears the duplicate message once the guide changes', async () => {
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () =>
        HttpResponse.json({ code: 'DUPLICATE_PURCHASE', message: 'Duplicate' }, { status: 409 })
      )
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);
    await submit(form);
    await form.findByText('Ya tienes una pre-alerta con esta guía.');

    await userEvent.type(form.getByLabelText('Guía de seguimiento'), '0');

    await waitFor(() =>
      expect(form.queryByText('Ya tienes una pre-alerta con esta guía.')).not.toBeInTheDocument()
    );
  });

  it.each([
    ['a server error', 500, undefined],
    ['an unknown conflict', 409, { code: 'SOMETHING_ELSE' }],
  ])('shows one generic retry message on %s', async (_name, status, payload) => {
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', () =>
        payload ? HttpResponse.json(payload, { status }) : new HttpResponse(null, { status })
      )
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);

    await submit(form);

    expect(await form.findByRole('alert')).toHaveTextContent(
      'No pudimos crear la pre-alerta. Revisa los datos e inténtalo de nuevo.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('cannot be closed while the request is pending and still confirms afterwards', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', async () => {
        await gate;
        return HttpResponse.json(purchaseFixture({ id: 'p2' }), { status: 201 });
      })
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);

    await submit(form);
    await waitFor(() => expect(form.getByRole('button', { name: /Creando/ })).toBeDisabled());
    await userEvent.keyboard('{Escape}');
    expect(form.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
    await userEvent.click(form.getByRole('button', { name: 'Cerrar' }));

    expect(screen.getByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
    release();
    expect(await screen.findByText('Pre-alerta creada.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('blocks a double submit while the request is pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    server.use(
      purchasesListHandler(),
      http.post('*/api/me/purchases', async () => {
        calls += 1;
        await gate;
        return new HttpResponse(null, { status: 503 });
      })
    );
    renderPreAlertsPage();
    const form = await openForm();
    await fillForm(form);

    await submit(form);
    await waitFor(() => expect(form.getByRole('button', { name: /Creando/ })).toBeDisabled());
    await userEvent.click(form.getByRole('button', { name: /Creando/ }));

    expect(calls).toBe(1);
    release();
    await form.findByRole('alert');
  });
});

describe('PreAlertsPage entry points', () => {
  it('opens the form from the empty state', async () => {
    server.use(purchasesListHandler([]));
    renderPreAlertsPage();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Pre-alertar mi primera compra' })
    );

    expect(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
  });

  it('opens the form from the sidebar call to action', async () => {
    server.use(refreshOkHandler(), meHandler(), purchasesListHandler());
    renderWithProviders(<AppRoutes />, { route: '/pre-alerts' });
    await findPurchasesList();

    await userEvent.click(screen.getByRole('link', { name: 'Pre-alertar compra', hidden: true }));

    expect(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
  });

  it('opens the form from the sidebar when coming from another screen', async () => {
    server.use(refreshOkHandler(), meHandler(), purchasesListHandler());
    renderWithProviders(<AppRoutes />, { route: '/dashboard' });
    await screen.findByRole('heading', { level: 1, name: 'Hola, Jane' });

    await userEvent.click(screen.getByRole('link', { name: 'Pre-alertar compra', hidden: true }));

    expect(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
  });

  it('opens the form from the home call to action', async () => {
    server.use(refreshOkHandler(), meHandler(), purchasesListHandler());
    renderWithProviders(<AppRoutes />, { route: '/dashboard' });

    await userEvent.click(await screen.findByRole('link', { name: 'Pre-alertar una compra' }));

    expect(await screen.findByRole('dialog', { name: 'Nueva pre-alerta' })).toBeInTheDocument();
  });
});
