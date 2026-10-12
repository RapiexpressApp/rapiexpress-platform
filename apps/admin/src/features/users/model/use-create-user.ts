import { queryKeys } from '@rapiexpress/api-client/query-keys';
import type { CreateUserPayload } from '@rapiexpress/api-client/users.schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usersApi } from '@/shared/api/api';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
