import '@testing-library/jest-dom/vitest';

import { clearAccessToken } from '@rapiexpress/api-client/token-store';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  clearAccessToken();
  server.resetHandlers();
});

afterAll(() => server.close());
