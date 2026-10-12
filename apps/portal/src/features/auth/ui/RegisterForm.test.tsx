import { getAccessToken } from '@rapiexpress/api-client/token-store';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { meHandler, profileFixture, refreshFailHandler, tokensFixture } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import RegisterForm from './RegisterForm';

function renderRegister() {
  server.use(refreshFailHandler());
  return renderWithProviders(
    <Routes>
      <Route path="/registro" element={<RegisterForm />} />
      <Route path="/" element={<p>login page</p>} />
      <Route path="/dashboard" element={<p>dashboard page</p>} />
    </Routes>,
    { route: '/registro' }
  );
}

async function fillForm(overrides: { confirmPassword?: string } = {}) {
  await userEvent.type(await screen.findByLabelText('Nombre'), 'Jane');
  await userEvent.type(screen.getByLabelText('Apellido'), 'Doe');
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'jane@example.com');
  await userEvent.type(screen.getByLabelText('Teléfono'), '+58 412 1234567');
  await userEvent.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'secret-pass');
  await userEvent.type(
    screen.getByPlaceholderText('Repite tu contraseña'),
    overrides.confirmPassword ?? 'secret-pass'
  );
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

describe('RegisterForm', () => {
  it('registers, logs in with the same credentials and navigates to the dashboard', async () => {
    renderRegister();
    const order: string[] = [];
    let registerBody: unknown;
    let loginBody: unknown;
    server.use(
      http.post('*/api/auth/register', async ({ request }) => {
        order.push('register');
        registerBody = await request.json();
        return HttpResponse.json(profileFixture, { status: 201 });
      }),
      http.post('*/api/auth/login', async ({ request }) => {
        order.push('login');
        loginBody = await request.json();
        return HttpResponse.json(tokensFixture('login-token'));
      }),
      meHandler()
    );

    await fillForm();
    await submit();

    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
    expect(order).toEqual(['register', 'login']);
    expect(registerBody).toEqual({
      name: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+58 412 1234567',
      password: 'secret-pass',
    });
    expect(loginBody).toEqual({ email: 'jane@example.com', password: 'secret-pass' });
    expect(getAccessToken()).toBe('login-token');
  });

  it('shows a field error on the email when it is already registered', async () => {
    renderRegister();
    server.use(http.post('*/api/auth/register', () => new HttpResponse(null, { status: 409 })));

    await fillForm();
    await submit();

    expect(await screen.findByText('Este correo ya está registrado.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument();
  });

  it.each([400, 503])('shows one generic message on a %i response', async (status) => {
    renderRegister();
    server.use(http.post('*/api/auth/register', () => new HttpResponse(null, { status })));

    await fillForm();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.'
    );
  });

  it('shows the generic message on network failures', async () => {
    renderRegister();
    server.use(http.post('*/api/auth/register', () => HttpResponse.error()));

    await fillForm();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.'
    );
  });

  it('tells the user to sign in when the account was created but the automatic login failed', async () => {
    renderRegister();
    server.use(
      http.post('*/api/auth/register', () => HttpResponse.json(profileFixture, { status: 201 })),
      http.post('*/api/auth/login', () => new HttpResponse(null, { status: 429 }))
    );

    await fillForm();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta fue creada, pero no pudimos iniciar sesión. Inicia sesión desde la página de ingreso.'
    );
    expect(getAccessToken()).toBeNull();
  });

  it('blocks submit when the passwords do not match', async () => {
    renderRegister();
    const registerHandler = vi.fn(() => HttpResponse.json(profileFixture, { status: 201 }));
    server.use(http.post('*/api/auth/register', registerHandler));

    await fillForm({ confirmPassword: 'different-pass' });
    await submit();

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(registerHandler).not.toHaveBeenCalled();
  });

  it('links back to the login page', async () => {
    renderRegister();

    await userEvent.click(await screen.findByRole('link', { name: 'Inicia sesión' }));

    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
