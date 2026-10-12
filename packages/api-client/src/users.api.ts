import type { ApiClient } from './client.ts';
import { type ListParams, toListQuery } from './pagination.ts';
import {
  type CreatedUser,
  createdUserSchema,
  type CreateUserPayload,
  createUserPayloadSchema,
  type UserList,
  userListSchema,
} from './users.schemas.ts';

export function createUsersApi({ apiClient }: ApiClient) {
  return {
    async list(params: ListParams): Promise<UserList> {
      const { data } = await apiClient.get('/users', { params: toListQuery(params) });
      return userListSchema.parse(data);
    },

    async create(payload: CreateUserPayload): Promise<CreatedUser> {
      const body = createUserPayloadSchema.parse(payload);
      const { data } = await apiClient.post('/users', body);
      return createdUserSchema.parse(data);
    },
  };
}

export type UsersApi = ReturnType<typeof createUsersApi>;
