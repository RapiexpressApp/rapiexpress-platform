import { onSessionExpired } from '@rapiexpress/api-client/session-events';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

import { bootstrapSession } from './bootstrap-session';
import { SessionContext, type SessionStatus } from './session-context';

interface SessionProviderProps {
  children: ReactNode;
}

function SessionProvider({ children }: SessionProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;

    void bootstrapSession(queryClient).then((authenticated) => {
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
  }, [queryClient]);

  const value = {
    status,
    markAuthenticated: () => setStatus('authenticated'),
    markAnonymous: () => setStatus('anonymous'),
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export default SessionProvider;
