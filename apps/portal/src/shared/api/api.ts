import { createAuthApi } from '@rapiexpress/api-client/auth.api';
import { createApiClient } from '@rapiexpress/api-client/client';
import { createMyPackagesApi } from '@rapiexpress/api-client/my-packages.api';
import { createMyPurchasesApi } from '@rapiexpress/api-client/purchases.api';
import { createSession } from '@rapiexpress/api-client/session';

export const api = createApiClient({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const authApi = createAuthApi(api);

export const session = createSession(authApi);

export const myPurchasesApi = createMyPurchasesApi(api);

export const myPackagesApi = createMyPackagesApi(api);
