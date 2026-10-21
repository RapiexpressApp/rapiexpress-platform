import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, type RequestHandler } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { logoutHandler, meHandler, refreshOkHandler } from '@/test/auth-handlers';
import {
  PACKAGE_ID,
  packageDetailHandler,
  packageListItemFixture,
  packagesListHandler,
} from '@/test/packages-handlers';
import { purchasesListHandler } from '@/test/purchases-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { usersListHandler } from '@/test/users-handlers';

function renderApp(role: string, route: string, ...handlers: RequestHandler[]) {
  const customersRequested = vi.fn();
  const usersRequested = vi.fn();
  const purchasesRequested = vi.fn();
  server.use(
    ...handlers,
    refreshOkHandler(),
    meHandler(role),
    logoutHandler(),
    packagesListHandler([]),
    purchasesListHandler([], { onRequest: purchasesRequested }),
    http.get('*/api/customers', () => {
      customersRequested();
      return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
    }),
    usersListHandler([], { onRequest: usersRequested })
  );
  renderWithProviders(<AppRoutes />, { route });
  return { customersRequested, usersRequested, purchasesRequested };
}

const heading = (name: string) => screen.findByRole('heading', { level: 1, name });

describe('AppRoutes for warehouse staff', () => {
  it('lands on reception after the session starts', async () => {
    renderApp('WAREHOUSE', '/');

    expect(await heading('Recepción')).toBeInTheDocument();
  });

  it('shows reception and packages as the only navigation entries', async () => {
    renderApp('WAREHOUSE', '/recepcion');

    await heading('Recepción');
    const sidebar = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(sidebar).toHaveTextContent('Recepción');
    expect(sidebar).toHaveTextContent('Paquetes');
    expect(sidebar).not.toHaveTextContent('Pre-alertas');
    expect(sidebar).not.toHaveTextContent('Usuarios');
    expect(sidebar).not.toHaveTextContent('Clientes');
  });

  it('lets warehouse staff open the packages page', async () => {
    renderApp('WAREHOUSE', '/paquetes');

    expect(await heading('Paquetes')).toBeInTheDocument();
  });

  it('keeps warehouse staff out of the users page', async () => {
    const { usersRequested } = renderApp('WAREHOUSE', '/usuarios');

    expect(await heading('Recepción')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).toBeNull();
    expect(usersRequested).not.toHaveBeenCalled();
  });

  it('keeps warehouse staff out of the pre-alerts page', async () => {
    const { purchasesRequested } = renderApp('WAREHOUSE', '/prealertas');

    expect(await heading('Recepción')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pre-alertas' })).toBeNull();
    expect(purchasesRequested).not.toHaveBeenCalled();
  });

  it('keeps warehouse staff out of the customers page', async () => {
    const { customersRequested } = renderApp('WAREHOUSE', '/clientes');

    expect(await heading('Recepción')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Clientes' })).toBeNull();
    expect(customersRequested).not.toHaveBeenCalled();
  });
});

describe('AppRoutes for the other staff roles', () => {
  it.each(['ADMIN', 'OPERATIONS'])('lets %s open reception', async (role) => {
    renderApp(role, '/recepcion');

    expect(await heading('Recepción')).toBeInTheDocument();
  });

  it.each(['ADMIN', 'OPERATIONS'])('lets %s open the packages page', async (role) => {
    renderApp(role, '/paquetes');

    expect(await heading('Paquetes')).toBeInTheDocument();
  });

  it.each(['ADMIN', 'OPERATIONS'])('lets %s open the pre-alerts page', async (role) => {
    renderApp(role, '/prealertas');

    expect(await heading('Pre-alertas')).toBeInTheDocument();
  });

  it('shows admins reception, packages, pre-alerts, users and customers', async () => {
    renderApp('ADMIN', '/recepcion');

    await heading('Recepción');
    const sidebar = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(sidebar).toHaveTextContent('Recepción');
    expect(sidebar).toHaveTextContent('Paquetes');
    expect(sidebar).toHaveTextContent('Pre-alertas');
    expect(sidebar).toHaveTextContent('Usuarios');
    expect(sidebar).toHaveTextContent('Clientes');
  });

  it('shows operations reception, packages, pre-alerts and customers but not users', async () => {
    renderApp('OPERATIONS', '/recepcion');

    await heading('Recepción');
    const sidebar = screen.getByRole('navigation', { name: 'Navegación móvil' });
    expect(sidebar).toHaveTextContent('Paquetes');
    expect(sidebar).toHaveTextContent('Pre-alertas');
    expect(sidebar).toHaveTextContent('Clientes');
    expect(sidebar).not.toHaveTextContent('Usuarios');
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

describe('AppRoutes package detail', () => {
  it.each(['ADMIN', 'OPERATIONS', 'WAREHOUSE'])('lets %s open a package', async (role) => {
    renderApp(role, `/paquetes/${PACKAGE_ID}`, packageDetailHandler());

    expect(await heading('WH-000042')).toBeInTheDocument();
  });

  it('opens the detail of the package picked in the list', async () => {
    renderApp(
      'WAREHOUSE',
      '/paquetes',
      packagesListHandler([packageListItemFixture()]),
      packageDetailHandler()
    );

    await userEvent.click(await screen.findByRole('link', { name: 'WH-000042' }));

    expect(await heading('WH-000042')).toBeInTheDocument();
  });

  it('keeps customer accounts out of a package', async () => {
    renderApp('CUSTOMER', `/paquetes/${PACKAGE_ID}`);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no tiene acceso al panel.'
    );
  });
});
