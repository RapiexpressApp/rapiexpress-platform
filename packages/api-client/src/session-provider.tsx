import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { SessionContext, type SessionStatus } from './session-context.ts';
import { onSessionExpired } from './session-events.ts';

interface SessionProviderProps {
  bootstrap: (queryClient: QueryClient) => Promise<boolean>;
  children: ReactNode;
}

function SessionProvider({ bootstrap, children }: SessionProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;

    void bootstrap(queryClient).then((authenticated) => {
      if (active) setStatus(authenticated ? 'authenticated' : 'anonymous');
    });

    const unsubscribe = onSessionExpired(() => {
      queryClient.clear();
      setStatus('anonymous');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient, bootstrap]);

  const value = {
    status,
    markAuthenticated: () => setStatus('authenticated'),
    markAnonymous: () => setStatus('anonymous'),
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export default SessionProvider;
