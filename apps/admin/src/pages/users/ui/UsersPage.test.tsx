import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { userFixture, usersListHandler } from '@/test/users-handlers';

import UsersPage from './UsersPage';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="search">{location.search}</p>;
}

function renderPage(route = '/usuarios') {
  server.use(refreshOkHandler(), meHandler('ADMIN'));
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/usuarios" element={<UsersPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}

const rows = [
  userFixture(),
  userFixture({
    id: 'u2',
    email: 'admin@rapiexpress.com',
    name: 'Ana',
    lastName: 'Rojas',
    role: 'ADMIN',
    isActive: false,
  }),
];

describe('UsersPage list', () => {
  it('renders staff rows with role and status badges', async () => {
    server.use(usersListHandler(rows));

    renderPage();

    expect(await screen.findByText('Olga Pérez')).toBeInTheDocument();
    expect(screen.getByText('ops@rapiexpress.com')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–2 de 2')).toBeInTheDocument();
  });

  it('shows a loading state first', async () => {
    server.use(usersListHandler(rows));

    renderPage();

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    await screen.findByText('Olga Pérez');
  });

  it('shows an empty state', async () => {
    server.use(usersListHandler([]));

    renderPage();

    expect(await screen.findByText('Aún no hay usuarios.')).toBeInTheDocument();
  });

  it('shows an error state with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/users', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ items: rows, page: 1, pageSize: 20, total: 2 });
      })
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los usuarios.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Olga Pérez')).toBeInTheDocument();
  });

  it('debounces the search, requests it and writes it to the URL resetting the page', async () => {
    const requests: URL[] = [];
    server.use(usersListHandler(rows, { onRequest: (url) => requests.push(url) }));

    renderPage('/usuarios?page=3');
    await screen.findByText('Olga Pérez');
    const initial = requests.length;

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), 'olga');

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?search=olga'));
    await waitFor(() => expect(requests.length).toBeGreaterThan(initial));
    const searched = requests.slice(initial);
    expect(searched).toHaveLength(1);
    expect(searched[0]?.searchParams.get('search')).toBe('olga');
    expect(searched[0]?.searchParams.get('page')).toBe('1');
  });

  it('navigates pages through the URL and keeps previous rows while loading', async () => {
    const requests: URL[] = [];
    server.use(usersListHandler(rows, { total: 45, onRequest: (url) => requests.push(url) }));

    renderPage();
    await screen.findByText('Página 1 de 3');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?page=2'));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('page')).toBe('2');
    expect(screen.getByText('Olga Pérez')).toBeInTheDocument();
  });

  it('reads page and pageSize from the URL and clamps invalid values', async () => {
    const requests: URL[] = [];
    server.use(usersListHandler(rows, { total: 300, onRequest: (url) => requests.push(url) }));

    renderPage('/usuarios?page=0&pageSize=500');
    await screen.findByText('Olga Pérez');

    expect(requests[0]?.searchParams.get('page')).toBe('1');
    expect(requests[0]?.searchParams.get('pageSize')).toBe('100');
  });
});

describe('UsersPage create', () => {
  async function openAndFill(overrides: { email?: string; confirm?: string } = {}) {
    await userEvent.click(await screen.findByRole('button', { name: 'Crear usuario' }));
    const dialog = await screen.findByRole('dialog');
    const form = within(dialog);
    await userEvent.type(form.getByLabelText('Nombre'), 'Nora');
    await userEvent.type(form.getByLabelText('Apellido'), 'Díaz');
    await userEvent.type(
      form.getByLabelText('Correo electrónico'),
      overrides.email ?? 'nora@rapiexpress.com'
    );
    await userEvent.type(form.getByLabelText('Teléfono'), '+58 412 7654321');
    await userEvent.selectOptions(form.getByLabelText('Rol'), 'WAREHOUSE');
    await userEvent.type(form.getAllByLabelText('Contraseña')[0]!, 'secret-pass');
    await userEvent.type(
      form.getByLabelText('Confirmar contraseña'),
      overrides.confirm ?? 'secret-pass'
    );
    return form;
  }

  it('creates a user, closes the dialog, toasts and refreshes the list', async () => {
    let listCalls = 0;
    let body: unknown;
    server.use(
      http.get('*/api/users', () => {
        listCalls += 1;
        return HttpResponse.json({ items: rows, page: 1, pageSize: 20, total: 2 });
      }),
      http.post('*/api/users', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...userFixture({ id: 'u3' }), kind: 'STAFF' }, { status: 201 });
      })
    );
    renderPage();
    const form = await openAndFill();

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));

    expect(await screen.findByText('Usuario creado.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(listCalls).toBe(2));
    expect(body).toEqual({
      name: 'Nora',
      lastName: 'Díaz',
      email: 'nora@rapiexpress.com',
      phone: '+58 412 7654321',
      password: 'secret-pass',
      role: 'WAREHOUSE',
    });
  });

  it('shows the duplicate email error on the field for a 409', async () => {
    server.use(
      usersListHandler(rows),
      http.post('*/api/users', () => new HttpResponse(null, { status: 409 }))
    );
    renderPage();
    const form = await openAndFill();

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));

    expect(await form.findByText('Este correo ya está registrado.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(form.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([400, 503])('shows a generic error for a %s without closing', async (status) => {
    server.use(
      usersListHandler(rows),
      http.post('*/api/users', () => new HttpResponse(null, { status }))
    );
    renderPage();
    const form = await openAndFill();

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));

    expect(await form.findByRole('alert')).toHaveTextContent('No pudimos crear el usuario.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('validates locally and never calls the API with an invalid form', async () => {
    const create = vi.fn();
    server.use(
      usersListHandler(rows),
      http.post('*/api/users', () => {
        create();
        return new HttpResponse(null, { status: 201 });
      })
    );
    renderPage();
    const form = await openAndFill({ confirm: 'different' });

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));

    expect(await form.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('requires choosing a role', async () => {
    server.use(usersListHandler(rows));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Crear usuario' }));
    const form = within(await screen.findByRole('dialog'));

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));

    expect(await form.findByText('Selecciona un rol.')).toBeInTheDocument();
  });

  it('blocks double submit while the request is pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    server.use(
      usersListHandler(rows),
      http.post('*/api/users', async () => {
        calls += 1;
        await gate;
        return new HttpResponse(null, { status: 503 });
      })
    );
    renderPage();
    const form = await openAndFill();

    await userEvent.click(form.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(form.getByRole('button', { name: /Creando/ })).toBeDisabled());
    await userEvent.click(form.getByRole('button', { name: /Creando/ }));

    expect(calls).toBe(1);
    release();
    await form.findByRole('alert');
  });
});
