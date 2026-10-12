import { getAccessToken } from '@rapiexpress/api-client/token-store';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import LoginPage from '@/pages/login/ui/LoginPage';
import { meHandler, refreshFailHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import GuestOnly from './GuestOnly';
import RequireRole from './RequireRole';
import RequireStaff from './RequireStaff';

function renderRoutes(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/" element={<LoginPage />} />
      </Route>
      <Route element={<RequireStaff />}>
        <Route element={<RequireRole allow={['ADMIN']} />}>
          <Route path="/usuarios" element={<p>users page</p>} />
        </Route>
        <Route path="/clientes" element={<p>customers page</p>} />
      </Route>
    </Routes>,
    { route }
  );
}

describe('RequireStaff', () => {
  it('shows a loading state without redirecting while the session is bootstrapping', async () => {
    server.use(refreshOkHandler(), meHandler('ADMIN'));

    renderRoutes('/usuarios');

    expect(screen.getByRole('status', { name: 'Cargando sesión' })).toBeInTheDocument();
    expect(screen.queryByText('Panel administrativo')).not.toBeInTheDocument();
    expect(await screen.findByText('users page')).toBeInTheDocument();
  });

  it('redirects anonymous visitors to the login page', async () => {
    server.use(refreshFailHandler());

    renderRoutes('/clientes');

    expect(
      await screen.findByRole('heading', { name: 'Panel administrativo' })
    ).toBeInTheDocument();
    expect(screen.queryByText('customers page')).not.toBeInTheDocument();
  });

  it('ends the session and explains the missing access for a customer account', async () => {
    const logout = vi.fn();
    server.use(
      refreshOkHandler(),
      meHandler('CUSTOMER'),
      http.post('*/api/auth/logout', () => {
        logout();
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderRoutes('/clientes');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no tiene acceso al panel.'
    );
    expect(screen.queryByText('customers page')).not.toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('sends a single logout even under StrictMode', async () => {
    const logout = vi.fn();
    server.use(
      refreshOkHandler(),
      meHandler('CUSTOMER'),
      http.post('*/api/auth/logout', () => {
        logout();
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { container } = renderWithProviders(
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<LoginPage />} />
        </Route>
        <Route element={<RequireStaff />}>
          <Route path="/clientes" element={<p>customers page</p>} />
        </Route>
      </Routes>,
      { route: '/clientes', strict: true }
    );

    await screen.findByRole('alert');
    expect(container).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ADMIN', 'users page'],
    ['OPERATIONS', 'customers page'],
  ])('lets a %s user enter and routes / to their default page', async (role, page) => {
    server.use(refreshOkHandler(), meHandler(role));

    renderRoutes('/');

    expect(await screen.findByText(page)).toBeInTheDocument();
  });

  it('redirects operations users away from the users page', async () => {
    server.use(refreshOkHandler(), meHandler('OPERATIONS'));

    renderRoutes('/usuarios');

    expect(await screen.findByText('customers page')).toBeInTheDocument();
    expect(screen.queryByText('users page')).not.toBeInTheDocument();
  });
});
