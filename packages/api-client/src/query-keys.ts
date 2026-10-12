const authRoot = ['auth'] as const;

export const queryKeys = {
  auth: {
    all: authRoot,
    me: () => [...authRoot, 'me'] as const,
  },
};
