import '@fontsource-variable/inter';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import SessionProvider from '@/features/auth/model/SessionProvider.tsx';
import { queryClient } from '@/shared/api/query-client.ts';
import { system } from '@/shared/ui/theme.ts';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ChakraProvider value={system}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChakraProvider>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>
);
