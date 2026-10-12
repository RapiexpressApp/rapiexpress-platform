import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import Topbar from './Topbar';

describe('Topbar', () => {
  it('shows the customer name and initials from the profile', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderWithProviders(<Topbar />);

    expect(await screen.findAllByText('Jane Doe')).toHaveLength(2);
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Mendoza')).not.toBeInTheDocument();
  });

  it('exposes the logout action', async () => {
    server.use(refreshOkHandler(), meHandler());

    renderWithProviders(<Topbar />);

    expect(await screen.findByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});
