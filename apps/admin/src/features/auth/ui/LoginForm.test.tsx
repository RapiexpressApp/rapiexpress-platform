import { getAccessToken } from '@rapiexpress/api-client/token-store';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  logoutHandler,
  meHandler,
  refreshFailHandler,
  tokensFixture,
  unauthorized,
} from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import LoginForm from './LoginForm';

function renderLogin() {
  server.use(refreshFailHandler());
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/usuarios" element={<p>users page</p>} />
      <Route path="/clientes" element={<p>customers page</p>} />
      <Route path="/recepcion" element={<p>reception page</p>} />
    </Routes>
  );
}

async function fillAndSubmit() {
  await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'staff@rapiexpress.com');
  await userEvent.type(screen.getByPlaceholderText('Tu contraseña'), 'secret-pass');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginForm', () => {
  it('logs in an admin and lands on the users page', async () => {
    renderLogin();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture('login-token'))),
      meHandler('ADMIN')
    );

    await fillAndSubmit();

    expect(await screen.findByText('users page')).toBeInTheDocument();
    expect(getAccessToken()).toBe('login-token');
  });

  it('logs in an operations user and lands on the customers page', async () => {
    renderLogin();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture())),
      meHandler('OPERATIONS')
    );

    await fillAndSubmit();

    expect(await screen.findByText('customers page')).toBeInTheDocument();
  });

  it('logs in a warehouse user and lands on the reception page', async () => {
    renderLogin();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture())),
      meHandler('WAREHOUSE')
    );

    await fillAndSubmit();

    expect(await screen.findByText('reception page')).toBeInTheDocument();
  });

  it('shows one generic message when credentials are rejected', async () => {
    renderLogin();
    server.use(http.post('*/api/auth/login', unauthorized));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(getAccessToken()).toBeNull();
  });

  it('shows a retry message on server errors', async () => {
    renderLogin();
    server.use(http.post('*/api/auth/login', () => new HttpResponse(null, { status: 503 })));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.'
    );
  });

  it('rejects a customer account, ends the session on both sides and stays on login', async () => {
    renderLogin();
    const logout = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture('customer-token'))),
      meHandler('CUSTOMER'),
      http.post('*/api/auth/logout', () => {
        logout();
        return new HttpResponse(null, { status: 204 });
      })
    );

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no tiene acceso al panel.'
    );
    expect(logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(screen.queryByText('users page')).not.toBeInTheDocument();
    expect(screen.queryByText('customers page')).not.toBeInTheDocument();
  });

  it('still clears the local session when the server logout fails for a rejected account', async () => {
    renderLogin();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture())),
      meHandler('CUSTOMER'),
      http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 }))
    );

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no tiene acceso al panel.'
    );
    expect(getAccessToken()).toBeNull();
  });

  it('validates the form locally before calling the API', async () => {
    renderLogin();
    const login = vi.fn();
    server.use(
      http.post('*/api/auth/login', () => {
        login();
        return unauthorized();
      }),
      logoutHandler()
    );

    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('El formato de correo no es válido.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
