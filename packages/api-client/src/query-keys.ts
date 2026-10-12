import type { ListParams } from './pagination.ts';

const authRoot = ['auth'] as const;
const usersRoot = ['users'] as const;

export const queryKeys = {
  auth: {
    all: authRoot,
    me: () => [...authRoot, 'me'] as const,
  },
  users: {
    all: usersRoot,
    list: (params: ListParams) => [...usersRoot, 'list', params] as const,
  },
};
