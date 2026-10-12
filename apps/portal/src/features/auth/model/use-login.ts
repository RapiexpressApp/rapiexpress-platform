import type { LoginPayload } from '@rapiexpress/api-client/auth.schemas';
import { useSession } from '@rapiexpress/api-client/session-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { session } from '@/shared/api/api';

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAuthenticated } = useSession();

  return useMutation({
    mutationFn: (payload: LoginPayload) => session.signIn(queryClient, payload),
    onSuccess: () => {
      markAuthenticated();
      navigate('/dashboard', { replace: true });
    },
  });
}
