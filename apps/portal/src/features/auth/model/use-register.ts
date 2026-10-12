import type { RegisterPayload } from '@rapiexpress/api-client/auth.schemas';
import { useSession } from '@rapiexpress/api-client/session-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi, session } from '@/shared/api/api';

import { AccountCreatedLoginFailedError } from './auth-errors';

export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await authApi.register(payload);
      try {
        await session.signIn(queryClient, { email: payload.email, password: payload.password });
      } catch (error) {
        throw new AccountCreatedLoginFailedError(error);
      }
    },
    onSuccess: () => {
      markAuthenticated();
      navigate('/dashboard', { replace: true });
    },
  });
}
