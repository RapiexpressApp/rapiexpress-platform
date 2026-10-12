import BaseSessionProvider from '@rapiexpress/api-client/session-provider';
import type { ReactNode } from 'react';

import { session } from '@/shared/api/api';

interface SessionProviderProps {
  children: ReactNode;
}

function SessionProvider({ children }: SessionProviderProps) {
  return <BaseSessionProvider bootstrap={session.bootstrapSession}>{children}</BaseSessionProvider>;
}

export default SessionProvider;
