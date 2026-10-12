import { clearAccessToken } from '@rapiexpress/api-client/token-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi } from '@/shared/api/api';

import { useSession } from './session-context';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { markAnonymous } = useSession();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAccessToken();
      queryClient.clear();
      markAnonymous();
      navigate('/', { replace: true });
    },
  });
}
