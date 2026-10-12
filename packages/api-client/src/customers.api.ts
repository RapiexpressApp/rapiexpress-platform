import type { ApiClient } from './client.ts';
import { type CustomerList, customerListSchema } from './customers.schemas.ts';
import { type ListParams, toListQuery } from './pagination.ts';

export function createCustomersApi({ apiClient }: ApiClient) {
  return {
    async list(params: ListParams): Promise<CustomerList> {
      const { data } = await apiClient.get('/customers', { params: toListQuery(params) });
      return customerListSchema.parse(data);
    },
  };
}

export type CustomersApi = ReturnType<typeof createCustomersApi>;
