import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { meHandler, profileFixture, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import HomePage from './HomePage';

describe('HomePage', () => {
  it('greets the customer by first name and shows the real locker code', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Jane' })
    ).toBeInTheDocument();
    expect(screen.getByText('Suite MI-00001')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText(/Carlos/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RX-85421/)).not.toBeInTheDocument();
  });

  it('greets with the first word of a compound given name', async () => {
    server.use(
      refreshOkHandler(),
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ ...profileFixture, name: 'María José', lastName: 'Pérez' })
      )
    );

    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, María' })
    ).toBeInTheDocument();
    expect(screen.getByText('María José Pérez')).toBeInTheDocument();
  });

  it('keeps the static warehouse address lines', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('8250 NW 27th St')).toBeInTheDocument();
  });

  it('shows a loading state while the profile is pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      refreshOkHandler(),
      http.get('*/api/auth/me', async () => {
        await gate;
        return HttpResponse.json(profileFixture);
      })
    );

    renderWithProviders(<HomePage />);

    expect(screen.getByRole('status', { name: 'Cargando perfil' })).toBeInTheDocument();
    expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();

    release();
    expect(await screen.findByText('Hola, Jane')).toBeInTheDocument();
  });
});
