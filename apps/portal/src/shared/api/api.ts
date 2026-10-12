import { createAuthApi } from '@rapiexpress/api-client/auth.api';
import { createApiClient } from '@rapiexpress/api-client/client';

export const api = createApiClient({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const authApi = createAuthApi(api);
