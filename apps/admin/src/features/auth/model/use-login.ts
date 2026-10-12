import type { LoginPayload } from '@rapiexpress/api-client/auth.schemas';
import { useSession } from '@rapiexpress/api-client/session-context';
import { clearAccessToken } from '@rapiexpress/api-client/token-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi, session } from '@/shared/api/api';
import { DEFAULT_ROUTE, isPanelRole } from '@/shared/model/roles';

import { NoPanelAccessError } from './auth-errors';
import { meQueryOptions } from './use-me';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await session.signIn(queryClient, payload);
      const profile = queryClient.getQueryData(meQueryOptions.queryKey);
      if (profile && isPanelRole(profile.role)) return profile.role;

      await authApi.logout().catch(() => undefined);
      clearAccessToken();
      queryClient.clear();
      throw new NoPanelAccessError();
    },
    onSuccess: (role) => {
      markAuthenticated();
      navigate(DEFAULT_ROUTE[role], { replace: true });
    },
  });
}
