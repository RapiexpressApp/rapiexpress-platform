import {
  type LoginPayload,
  loginPayloadSchema,
  type RegisterPayload,
  registerPayloadSchema,
  type TokenResponse,
  tokenResponseSchema,
  type UserProfile,
  userProfileSchema,
} from './auth.schemas.ts';
import type { ApiClient } from './client.ts';
import { setAccessToken } from './token-store.ts';

export function createAuthApi({ apiClient, refreshSession }: ApiClient) {
  return {
    async login(payload: LoginPayload): Promise<TokenResponse> {
      const body = loginPayloadSchema.parse(payload);
      const { data } = await apiClient.post('/auth/login', body);
      const tokens = tokenResponseSchema.parse(data);
      setAccessToken(tokens.accessToken);
      return tokens;
    },

    async register(payload: RegisterPayload): Promise<UserProfile> {
      const body = registerPayloadSchema.parse(payload);
      const { data } = await apiClient.post('/auth/register', body);
      return userProfileSchema.parse(data);
    },

    async refresh(): Promise<TokenResponse> {
      return tokenResponseSchema.parse(await refreshSession());
    },

    async logout(): Promise<void> {
      await apiClient.post('/auth/logout');
    },

    async me(): Promise<UserProfile> {
      const { data } = await apiClient.get('/auth/me');
      return userProfileSchema.parse(data);
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
