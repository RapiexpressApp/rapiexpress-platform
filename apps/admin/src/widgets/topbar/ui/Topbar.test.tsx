import { getAccessToken } from '@rapiexpress/api-client/token-store';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import Topbar from './Topbar';

function renderTopbar() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>login page</p>} />
      <Route path="/clientes" element={<Topbar />} />
    </Routes>,
    { route: '/clientes' }
  );
}

describe('Topbar', () => {
  it('shows the staff name and a role badge', async () => {
    server.use(refreshOkHandler(), meHandler('OPERATIONS'));

    renderTopbar();

    expect(await screen.findByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
  });

  it('logs out on the server, clears the token and returns to login', async () => {
    const logout = vi.fn();
    server.use(
      refreshOkHandler(),
      meHandler('ADMIN'),
      http.post('*/api/auth/logout', () => {
        logout();
        return new HttpResponse(null, { status: 204 });
      })
    );
    renderTopbar();

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('still ends the local session when the logout request fails', async () => {
    server.use(
      refreshOkHandler(),
      meHandler('ADMIN'),
      http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 }))
    );
    renderTopbar();

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });
});
