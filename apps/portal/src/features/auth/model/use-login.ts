import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi } from '@/shared/api/auth.api';
import type { LoginPayload } from '@/shared/api/auth.schemas';
import { clearAccessToken } from '@/shared/api/token-store';

import { useSession } from './session-context';
import { meQueryOptions } from './use-me';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await authApi.login(payload);
      try {
        await queryClient.fetchQuery({ ...meQueryOptions, staleTime: 0 });
      } catch (error) {
        clearAccessToken();
        throw error;
      }
    },
    onSuccess: () => {
      markAuthenticated();
      navigate('/dashboard', { replace: true });
    },
  });
}
