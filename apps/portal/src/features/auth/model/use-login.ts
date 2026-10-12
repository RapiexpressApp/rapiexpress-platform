import type { LoginPayload } from '@rapiexpress/api-client/auth.schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { useSession } from './session-context';
import { signIn } from './sign-in';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: (payload: LoginPayload) => signIn(queryClient, payload),
    onSuccess: () => {
      markAuthenticated();
      navigate('/dashboard', { replace: true });
    },
  });
}
