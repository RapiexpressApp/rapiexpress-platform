import { getAccessToken } from '@rapiexpress/api-client/token-store';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { meHandler, refreshFailHandler, tokensFixture, unauthorized } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import LoginForm from './LoginForm';

function renderLogin() {
  server.use(refreshFailHandler());
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/dashboard" element={<p>dashboard page</p>} />
    </Routes>
  );
}

async function fillAndSubmit() {
  await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'jane@example.com');
  await userEvent.type(screen.getByPlaceholderText('Tu contraseña'), 'secret-pass');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginForm', () => {
  it('logs in, stores the token and navigates to the dashboard', async () => {
    renderLogin();
    server.use(
      http.post('*/api/auth/login', () => HttpResponse.json(tokensFixture('login-token'))),
      meHandler()
    );

    await fillAndSubmit();

    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
    expect(getAccessToken()).toBe('login-token');
  });

  it('shows one generic message on 401 without revealing the account state', async () => {
    renderLogin();
    server.use(http.post('*/api/auth/login', unauthorized));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(getAccessToken()).toBeNull();
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument();
  });

  it('shows a retry message on server errors', async () => {
    renderLogin();
    server.use(http.post('*/api/auth/login', () => new HttpResponse(null, { status: 503 })));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.'
    );
  });

  it('shows the retry message on network failures', async () => {
    renderLogin();
    server.use(http.post('*/api/auth/login', () => HttpResponse.error()));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Inténtalo de nuevo en unos minutos.'
    );
  });

  it('disables the submit button while the request is pending and prevents double submit', async () => {
    renderLogin();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    server.use(
      http.post('*/api/auth/login', async () => {
        calls += 1;
        await gate;
        return unauthorized();
      })
    );

    await fillAndSubmit();

    const button = screen.getByRole('button', { name: /Entrar|Ingresando/ });
    await waitFor(() => expect(button).toBeDisabled());
    await userEvent.click(button);
    expect(calls).toBe(1);

    release();
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('validates the form locally before calling the API', async () => {
    renderLogin();
    let calls = 0;
    server.use(
      http.post('*/api/auth/login', () => {
        calls += 1;
        return unauthorized();
      })
    );

    await userEvent.type(await screen.findByLabelText('Correo electrónico'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('El formato de correo no es válido.')).toBeInTheDocument();
    expect(calls).toBe(0);
  });
});
