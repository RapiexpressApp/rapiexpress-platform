import { createAuthApi } from '@rapiexpress/api-client/auth.api';
import { createApiClient } from '@rapiexpress/api-client/client';
import { createSession } from '@rapiexpress/api-client/session';
import { createUsersApi } from '@rapiexpress/api-client/users.api';

export const api = createApiClient({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const authApi = createAuthApi(api);

export const session = createSession(authApi);

export const usersApi = createUsersApi(api);
