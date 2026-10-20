import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { logoutHandler, meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { usersListHandler } from '@/test/users-handlers';

function renderApp(role: string, route: string) {
  const customersRequested = vi.fn();
  const usersRequested = vi.fn();
  server.use(
    refreshOkHandler(),
    meHandler(role),
    logoutHandler(),
    http.get('*/api/customers', () => {
      customersRequested();
      return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
    }),
    usersListHandler([], { onRequest: usersRequested })
  );
  renderWithProviders(<AppRoutes />, { route });
  return { customersRequested, usersRequested };
}

const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

describe('AppRoutes reception', () => {
  it.each(['ADMIN', 'OPERATIONS'])('lets %s open reception', async (role) => {
    renderApp(role, '/recepcion');

    expect(await heading('Recepción')).toBeInTheDocument();
  });

  it('shows admins reception, users and customers', async () => {
    renderApp('ADMIN', '/recepcion');

    await heading('Recepción');
    const sidebar = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(sidebar).toHaveTextContent('Recepción');
    expect(sidebar).toHaveTextContent('Usuarios');
    expect(sidebar).toHaveTextContent('Clientes');
  });

  it('still lets admins and operations open the customers page', async () => {
    renderApp('OPERATIONS', '/clientes');

    expect(await heading('Clientes')).toBeInTheDocument();
  });

  it('still sends operations away from the users page', async () => {
    const { usersRequested } = renderApp('OPERATIONS', '/usuarios');

    expect(await heading('Clientes')).toBeInTheDocument();
    expect(usersRequested).not.toHaveBeenCalled();
  });

  it('still lets admins open the users page', async () => {
    renderApp('ADMIN', '/usuarios');

    expect(await heading('Usuarios')).toBeInTheDocument();
  });

  it('keeps customer accounts out of every page', async () => {
    renderApp('CUSTOMER', '/recepcion');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no tiene acceso al panel.'
    );
    expect(screen.queryByRole('heading', { level: 1, name: 'Recepción' })).toBeNull();
  });
});
