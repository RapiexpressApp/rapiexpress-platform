import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi } from '@/shared/api/auth.api';
import type { RegisterPayload } from '@/shared/api/auth.schemas';

import { AccountCreatedLoginFailedError } from './auth-errors';
import { useSession } from './session-context';
import { signIn } from './sign-in';

export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await authApi.register(payload);
      try {
        await signIn(queryClient, { email: payload.email, password: payload.password });
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
