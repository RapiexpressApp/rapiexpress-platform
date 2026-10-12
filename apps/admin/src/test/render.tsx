import { ChakraProvider } from '@chakra-ui/react';
import { system } from '@rapiexpress/ui/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { Fragment, type ReactElement, StrictMode } from 'react';
import { MemoryRouter } from 'react-router';

import SessionProvider from '@/features/auth/model/SessionProvider';
import AppToaster from '@/shared/ui/AppToaster';

interface RenderOptions {
  route?: string;
  withSession?: boolean;
  strict?: boolean;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', withSession = true, strict = false }: RenderOptions = {}
) {
  const queryClient = createTestQueryClient();
  const content = withSession ? <SessionProvider>{ui}</SessionProvider> : ui;
  const Root = strict ? StrictMode : Fragment;

  const result = render(
    <Root>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
          <AppToaster />
        </ChakraProvider>
      </QueryClientProvider>
    </Root>
  );

  return { ...result, queryClient };
}
