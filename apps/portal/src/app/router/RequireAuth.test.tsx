import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { meHandler, refreshFailHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import GuestOnly from './GuestOnly';
import RequireAuth from './RequireAuth';

function renderRoutes(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/" element={<p>login page</p>} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<p>dashboard page</p>} />
      </Route>
    </Routes>,
    { route }
  );
}

describe('RequireAuth', () => {
  it('shows a loading state without redirecting while the session is bootstrapping', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderRoutes('/dashboard');

    expect(screen.getByRole('status', { name: 'Cargando sesión' })).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
  });

  it('redirects anonymous visitors to /', async () => {
    server.use(refreshFailHandler());

    renderRoutes('/dashboard');

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument();
  });
});

describe('GuestOnly', () => {
  it('redirects authenticated users from / to /dashboard', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderRoutes('/');

    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
  });

  it('renders the login page for anonymous visitors', async () => {
    server.use(refreshFailHandler());

    renderRoutes('/');

    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
