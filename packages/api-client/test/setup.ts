import { afterAll, afterEach, beforeAll } from 'vitest';

import { clearAccessToken } from '../src/token-store';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  clearAccessToken();
  server.resetHandlers();
});

afterAll(() => server.close());
