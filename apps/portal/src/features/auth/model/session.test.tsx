import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/shared/api/query-keys';
import { notifySessionExpired } from '@/shared/api/session-events';
import { getAccessToken, setAccessToken } from '@/shared/api/token-store';
import {
  meHandler,
  profileFixture,
  refreshFailHandler,
  refreshOkHandler,
} from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import { useSession } from './session-context';
import { useLogout } from './use-logout';

function StatusProbe() {
  const { status } = useSession();
  return <p>status:{status}</p>;
}

function LogoutProbe() {
  const { status } = useSession();
  const logout = useLogout();
  const location = useLocation();
  return (
    <>
      <p>status:{status}</p>
      <p>path:{location.pathname}</p>
      <button onClick={() => logout.mutate()}>logout</button>
    </>
  );
}

describe('session bootstrap', () => {
  it('starts loading and becomes authenticated when refresh and me succeed', async () => {
    server.use(refreshOkHandler(), meHandler());

    const { queryClient } = renderWithProviders(<StatusProbe />);

    expect(screen.getByText('status:loading')).toBeInTheDocument();
    expect(await screen.findByText('status:authenticated')).toBeInTheDocument();
    expect(getAccessToken()).toBe('access-1');
    expect(queryClient.getQueryData(queryKeys.auth.me())).toEqual(profileFixture);
  });

  it('becomes anonymous when refresh is rejected', async () => {
    server.use(refreshFailHandler());

    renderWithProviders(<StatusProbe />);

    expect(await screen.findByText('status:anonymous')).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('becomes anonymous and drops the token when me fails after a successful refresh', async () => {
    server.use(
      refreshOkHandler(),
      http.get('*/api/auth/me', () => new HttpResponse(null, { status: 500 }))
    );

    renderWithProviders(<StatusProbe />);

    expect(await screen.findByText('status:anonymous')).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('calls refresh only once under StrictMode double effects', async () => {
    const refresh = vi.fn(() =>
      HttpResponse.json({ accessToken: 'access-1', tokenType: 'Bearer', expiresIn: 900 })
    );
    server.use(http.post('*/api/auth/refresh', refresh), meHandler());

    renderWithProviders(<StatusProbe />, { strict: true });

    await screen.findByText('status:authenticated');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('becomes anonymous and clears cached data when the session expires', async () => {
    server.use(refreshOkHandler(), meHandler());
    const { queryClient } = renderWithProviders(<StatusProbe />);
    await screen.findByText('status:authenticated');

    notifySessionExpired();

    expect(await screen.findByText('status:anonymous')).toBeInTheDocument();
    expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined();
  });
});

describe('useLogout', () => {
  it('clears the token and cache, becomes anonymous and navigates to /', async () => {
    server.use(refreshOkHandler(), meHandler());
    let logoutCalls = 0;
    server.use(
      http.post('*/api/auth/logout', () => {
        logoutCalls += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { queryClient } = renderWithProviders(
      <Routes>
        <Route path="*" element={<LogoutProbe />} />
      </Routes>,
      { route: '/dashboard' }
    );
    await screen.findByText('status:authenticated');
    expect(screen.getByText('path:/dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByText('status:anonymous')).toBeInTheDocument());
    expect(screen.getByText('path:/')).toBeInTheDocument();
    expect(logoutCalls).toBe(1);
    expect(getAccessToken()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('still ends the local session when the logout request fails', async () => {
    server.use(
      refreshOkHandler(),
      meHandler(),
      http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 500 }))
    );

    renderWithProviders(
      <Routes>
        <Route path="*" element={<LogoutProbe />} />
      </Routes>,
      { route: '/dashboard' }
    );
    await screen.findByText('status:authenticated');
    setAccessToken('access-1');

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByText('status:anonymous')).toBeInTheDocument());
    expect(getAccessToken()).toBeNull();
    expect(screen.getByText('path:/')).toBeInTheDocument();
  });
});
