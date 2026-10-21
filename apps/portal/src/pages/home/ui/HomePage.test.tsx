import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { profileFixture } from '@/test/auth-handlers';
import { renderHomePage } from '@/test/home-page';
import {
  myPackageDetailFixture,
  myPackageDetailHandler,
  myPackageFixture,
  myPackagesBackendHandler,
  myPackagesListHandler,
} from '@/test/packages-handlers';

describe('HomePage', () => {
  it('greets the customer by first name and shows the real locker code', async () => {
    renderHomePage();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Jane' })
    ).toBeInTheDocument();
    expect(screen.getByText('Suite MI-00001')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText(/Carlos/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RX-85421/)).not.toBeInTheDocument();
  });

  it('greets with the first word of a compound given name', async () => {
    renderHomePage(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ ...profileFixture, name: 'María José', lastName: 'Pérez' })
      )
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, María' })
    ).toBeInTheDocument();
    expect(screen.getByText('María José Pérez')).toBeInTheDocument();
  });

  it('keeps the static warehouse address lines', async () => {
    renderHomePage();

    expect(await screen.findByText('8250 NW 27th St')).toBeInTheDocument();
  });

  it('shows a loading state while the profile is pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderHomePage(
      http.get('*/api/auth/me', async () => {
        await gate;
        return HttpResponse.json(profileFixture);
      })
    );

    expect(screen.getByRole('status', { name: 'Cargando perfil' })).toBeInTheDocument();
    expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();

    release();
    expect(await screen.findByText('Hola, Jane')).toBeInTheDocument();
  });

  it('keeps the rest of the page when the profile fails and retries it', async () => {
    let calls = 0;
    renderHomePage(
      http.get('*/api/auth/me', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(profileFixture);
      }),
      myPackagesListHandler([myPackageFixture()])
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tu perfil.');
    expect(await screen.findByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
    expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Hola, Jane')).toBeInTheDocument();
    expect(screen.queryByText('No pudimos cargar tu perfil.')).not.toBeInTheDocument();
  });

  it('loads the shipments while the profile is still pending', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    renderHomePage(
      http.get('*/api/auth/me', async () => {
        await gate;
        return HttpResponse.json(profileFixture);
      }),
      myPackagesListHandler([myPackageFixture()])
    );

    expect(await screen.findByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Cargando perfil' })).toBeInTheDocument();

    release();
    expect(await screen.findByText('Hola, Jane')).toBeInTheDocument();
  });

  it('keeps every other block working when the purchases endpoint fails', async () => {
    renderHomePage(
      http.get('*/api/me/purchases', () => new HttpResponse(null, { status: 500 })),
      myPackagesBackendHandler([myPackageFixture({ status: 'SHIPPED' })]),
      myPackageDetailHandler(myPackageDetailFixture({ status: 'SHIPPED' }))
    );

    expect(await screen.findByText('No pudimos cargar tus pre-alertas.')).toBeInTheDocument();
    expect(await screen.findByText('Hola, Jane')).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Envíos' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Ver detalle del envío' }, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(await screen.findByText('Tienes 1 paquete en camino.')).toBeInTheDocument();
  });
});
