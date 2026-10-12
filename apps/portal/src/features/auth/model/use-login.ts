import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import type { LoginPayload } from '@/shared/api/auth.schemas';

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
