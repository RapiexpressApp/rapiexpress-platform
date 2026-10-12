import { useSession } from '@rapiexpress/api-client/session-context';
import { clearAccessToken } from '@rapiexpress/api-client/token-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import { useNavigate } from 'react-router';

import { authApi } from '@/shared/api/api';

export interface LoginRedirectState {
  noPanelAccess?: boolean;
}

interface LogoutVariables {
  noPanelAccess?: boolean;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAnonymous } = useSession();

  return useMutation({
    mutationFn: (_variables?: LogoutVariables) => authApi.logout(),
    onSettled: (_data, _error, variables) => {
      clearAccessToken();
      queryClient.clear();
      const state: LoginRedirectState | undefined = variables?.noPanelAccess
        ? { noPanelAccess: true }
        : undefined;
      navigate('/', { replace: true, state });
      // Router navigations are transitions; marking anonymous in the same lane keeps RequireStaff's own redirect from overriding the state above.
      startTransition(markAnonymous);
    },
  });
}
